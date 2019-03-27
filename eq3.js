'use strict'

const eq3device = require('./lib/eq3device')

module.exports = function(RED) {
  function eq3(config) {
    var node = this;
    RED.nodes.createNode(this, config);
    this.serverConfig = RED.nodes.getNode(config.server);
    node.device = global[config.eq3device]

    if (!node.device) {
      // discoverByAddress => see line 117 of https://github.com/noble/noble-device/blob/master/lib/util.js
      eq3device.discoverByAddress(config.eq3device ,function(device) {
        node.device = device
        global[config.eq3device] = device
      })
    }

    node.intervalId = setInterval(() => {
      if(node.device) {
        if (node.device.connectedAndSetUp){
            node.status({fill:"green",shape:"dot",text:"connected"});
        } else {
            node.status({fill:"green",shape:"ring",text:"discovered"});
        }
      } else {
        node.status({fill:"red",shape:"ring",text:"not discovered"});
      }
    }, 10000)

    node.on('close', function(done) {
      clearInterval(node.intervalId)
      done()
    })

    node.on('input', function(msg) {
      node.setCommand = function() {
        setTimeout(() => {
          node.device.getInfo()
          .then(a => {
            msg.payload = a
            node.send(msg)
          });
        }, 2000)

        if (typeof msg.payload !== 'object') return

        if (msg.payload.getInfo) {
           node.device.getInfo()
           .then(a => {
             msg.payload = a
             node.send(msg)
           });
        }

        switch (msg.payload.setState) {
          case 'on':
            node.device.turnOn()
            .then(a => {
              msg.payload = a
              node.send(msg)
            });
            break;
          case 'off':
            node.device.turnOff()
            .then(a => {
              msg.payload = a
              node.send(msg)
            });
            break;

          case 'manual':
            node.device.manualMode()
            .then(a => {
              msg.payload = a
              node.send(msg)
            });
            break;

          case 'auto':
            node.device.automaticMode()
            .then(a => {
              msg.payload = a
              node.send(msg)
            });
            break;
          default:
            break;
        }

        switch (msg.payload.boost) {
          case '0':
            node.device.setBoost(false)
            .then(a => {
              msg.payload = a
              node.send(msg)
            });
            break;
          case '1':
            node.device.setBoost(true)
            .then(a => {
              msg.payload = a
              node.send(msg)
            });
            break;

          default:
            break;
        }

        if (msg.payload.setTemperature)
          node.device.setTemperature(msg.payload.setTemperature)            
          .then(a => {
            msg.payload = a
            node.send(msg)
          });
      }

      // makes use of https://github.com/noble/noble-device#discovery-api
      if(!node.device) {
        RED.log.error('the specified device at ' + config.eq3device
        + ' has not been found yet')
        RED.log.warn('list of all available addressess will be retrieved...')
        eq3device.discoverAll((device) => {
          RED.log.warn('found device at address ' + device.address)
          //if(!node.device || config.eq3device !==  device.address)
          //  RED.log.warn('found device at address ' + device.address)

          if(!node.device && config.eq3device ===  device.address) {
            RED.log.info('device has found and configured!')
            global[config.eq3device] = device
            node.device = global[config.eq3device]
          }
        })
      }
      // see also https://github.com/noble/noble-device#usage
      else if(!node.device.connectedAndSetUp)
        node.device.connectAndSetup()
      // .then(() => node.setCommand())
      //else
      //  node.setCommand()
    });
  }
  RED.nodes.registerType("eq3-bluetooth", eq3);
}
