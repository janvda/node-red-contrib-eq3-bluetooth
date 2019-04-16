# node-red-contrib-eq3-bluetooth

node-red binding to bluetooth eq3 radiator valves without Max! Cube

## How it works

Every eq3-bluetooth has a bluetooth address which can be extracted by searching bluetooth devices when the device is on and basic set up is passed. After installation the valve you need to do the basic configuration on the device itself (calibration set time and date, ...) then the bluetooth should be visible.

Alternatively on your node-red installed device first make sure your bluetooth is up and running then create a node-red-contrib-eq3-bluetooth node in your flow and connect it to an inject node after deploying the flow you can send any message to node-red-contrib-eq3-bluetooth and in responce you receive the device is not found in your debugger window and after a while you see the list of available eq3-bluetooth addresses you can pick one and put it in the configuration of your node-red-contrib-eq3-bluetooth node.

after this you can send the following commands to the eq3 device by sending the following payloads to this node:

  - {payload: {setState: 'on'}} : turns the valve full open
  - {payload: {setState: 'off'}} : turns the valve full closed
  - {payload: {setState: 'manual'}} : set manual mode
  - {payload: {setState: 'auto'}} : set automatic mode

  
  - {payload: {boost: '1'}} : keep the valve open for 30 minutes
  - {payload: {boost: '0'}} : cancel boost mode

  - {payload: {setTemperature: '10'}} : set the manual temperature to 10 degrees

Note also that this node will also return the current status of the eq3 device as output message after execution of the command on the eq3 device.

You can also request the current status of the eq3 device by sending a payload that is just a string or a number: it doesn't matter which string or number.  E.g. 

  - {payload: 'any_text' } : just returns the current status of the eq3 device.


