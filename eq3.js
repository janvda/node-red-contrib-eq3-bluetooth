'use strict'

const eq3device = require('./lib/eq3device')

module.exports = function(RED) {
  function eq3(config) {
    var node = this;
    RED.nodes.createNode(this, config);
    this.serverConfig = RED.nodes.getNode(config.server);
    node.device = global[config.eq3device]

    // at startup of the node we are discovering + connecting the device
    if (!node.device) {
      // discoverByAddress => see line 117 of https://github.com/noble/noble-device/blob/master/lib/util.js
      RED.log.info("discovering eQ-3 device " + config.eq3device + " ...")
      eq3device.discoverByAddress(config.eq3device ,function(device) {
        RED.log.info("eQ-3 device " + config.eq3device + " discovered")
        node.status({fill:"green",shape:"ring",text:"discovered"})
        node.device = device
        global[config.eq3device] = device

        if(!node.device.connectedAndSetUp) {
          RED.log.info("connecting and setting up eQ-3 device " + config.eq3device + "...")
          node.device.connectAndSetup().then(() => {
            RED.log.info("eQ-3 device " + config.eq3device + " connected and setup")
            node.status({fill:"green",shape:"dot",text:"connected"})
          })
        }
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
      // node.setCommand is the function that is called at the end of the node.on() method
      node.setCommand = function() {
        // when msg.payload is any string or a number (so not an object) then 
        // it will send a messages with the status of the eq3 device.
        //
        // Note that all other commands - see further below - will also send a message with the status
        // of the eq3 device after executing the command.
        if (typeof msg.payload !== 'object') {
          node.device.getInfo()
          .then(a => { msg.payload = a; node.send(msg) })
          return
        }

        switch (msg.payload.setState) {
          case 'on':
            node.device.setTemperature(30)
            .then(a => { msg.payload = a; node.send(msg) })
            break;
          case 'off':
            node.device.setTemperature(4.5)
            .then(a => { msg.payload = a; node.send(msg) })
            break;

          case 'manual':
            node.device.manualMode()
            .then(a => { msg.payload = a; node.send(msg) })
            break;

          case 'auto':
            node.device.automaticMode()
            .then(a => { msg.payload = a; node.send(msg) })
            break;
          default:
            break;
        }

        switch (msg.payload.boost) {
          case '0':
            node.device.setBoost(false)
            .then(a => { msg.payload = a; node.send(msg) })
            break;
          case '1':
            node.device.setBoost(true)
            .then(a => { msg.payload = a; node.send(msg) })
            break;

          default:
            break;
        }

        if (msg.payload.setTemperature)
          node.device.setTemperature(msg.payload.setTemperature)
          .then(a => { msg.payload = a; node.send(msg) })
      }

      // makes use of https://github.com/noble/noble-device#discovery-api
      if(!node.device) {
        RED.log.error('the specified eQ-3 device at ' + config.eq3device
        + ' has not been found yet')
        RED.log.warn('list of all available addressess will be retrieved...')
        eq3device.discoverAll((device) => {
          RED.log.info('found device at address ' + device.address)
          if(!node.device && config.eq3device ===  device.address) {
            RED.log.info('eQ-3 device ' + config.eq3device + ' found and configured!')
            global[config.eq3device] = device
            node.device = global[config.eq3device]
          }
        })
      }
      // see also https://github.com/noble/noble-device#usage
      else if(!node.device.connectedAndSetUp) {
        RED.log.info("Reconnecting and setup of eQ-3 device " + config.eq3device)
        node.device.connectAndSetup()
        .then(() => {
              RED.log.info("...eQ-3 device " + config.eq3device + " connected and setup.")
              node.setCommand()
        })
      } else
        node.setCommand()
    });
  }
  RED.nodes.registerType("eq3-bluetooth", eq3);
}
