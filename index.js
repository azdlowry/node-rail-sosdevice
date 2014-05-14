var prettyjson = require('prettyjson');
var StompClient = require('stomp-client');
var sos = require("sos-device");
var config = require("./config");

var destination = '/topic/TRAIN_MVT_FREIGHT',
    client = new StompClient('datafeeds.networkrail.co.uk', 61618, config.username, config.password, '1.0');

console.log('Trying to connect...');

client.on('disconnect', function(err) {
    console.log('Disconnected: ' + err);
});

var processEvents = function processEvents(events, callback) {
    for (var i = 0; i < events.length; i++) {
        var event = events[i];
        if (event.body.loc_stanox > 30999 && event.body.loc_stanox < 32000) {
            console.log("Processing report from stanox - " + event.body.loc_stanox);
            console.log(JSON.stringify(event, null, 1));
            callback();
        } else {
            console.log("Ignoring report from stanox - " + event.body.loc_stanox);
        }
    }
}

var connectToRailApi = function connectToRailApi(callback) {
    client.connect(function(sessionId) {
        console.log('Trying to subscribe...');
        client.subscribe(destination, function(body, headers) {
            processEvents(JSON.parse(body), callback);
        });
    });
};

console.log("Connecting to SOS device");

sos.connect(function(err, sosDevice) {
  if (err) {
    return console.log("Connect failed: " + JSON.stringify(err));
  }

  sosDevice.readAllInfo(function(err, deviceInfo) {
    if (err) {
      return console.log("readAllInfo failed: " + JSON.stringify(err));
    }

    connectToRailApi(function signalFreightTrain() {

        var controlPacket = {
          ledMode: deviceInfo.ledPatterns[2].id,
          ledPlayDuration: 500,
//          audioMode: deviceInfo.audioPatterns[2].id,
//          audioPlayDuration: 500
        };

        sosDevice.sendControlPacket(controlPacket, function(err) {
        });
      });
   });
});

