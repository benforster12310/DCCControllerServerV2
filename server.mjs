// DCCControllerServerV2 Written By Ben Forster 2023

// Import Modules
const WebSocketServer = require('ws');
const readFileSync = require('fs');
const SerialPort = require('serialport');

// define main variables
var LocosObject = {};
var globalEmergencyStop = false;
var globalTrackShort = false;

// 1 - Load The Webserver
const wss = new WebSocketServer({ port: 81, path:"/ws" });

// 2 - Load and Parse locos.json file
var locosJson = JSON.parse(readFileSync("./locos.json"));

// 3 - Go througn the locosJson file and update the locosObject
for(var key in locosJson) {
    var locoCustomButtons = [];
    for(var key1 in locosJson[key]["cB"]) {
        locoCustomButtons[parseInt(key1) -1] = 0;
    }

    LocosObject[locosJson[key]["sA"]] = {}

    LocosObject[locosJson[key]["sA"]]["string"] = "00" + locosJson[key]["sA"] + "0000001" + locoCustomButtons.join("");

    // then put the cB key and property into the same thing
    LocosObject[locosJson[key]["sA"]]["cB"] = locosJson[key]["cB"];

    // then but the dA key and property into thr same thing
    LocosObject[locosJson[key]["sA"]]["dA"] = key;

    console.log(LocosObject)
    
}

// 4 - Start The Serial Port Connection
const serialConnection = new SerialPort({path: "COM7", baudRate: 115200})

// 5 - Power The Track On 
setTimeout(function() {
    serialConnection.write("<1 MAIN> \r\n");
}, 1000);


// broadcastAllLocos
function broadcastAllLocos(wss) {
    // go through all loco objects
    for(key in LocosObject) {
        // 1 - Then get the binary string
        var string = LocosObject[key]["string"];

        // 2 - Broadcast to all devices
        wss.clients.forEach(function each(client) {
            client.send(string, {binary: true});
        })
    }
}

// checkEmergencyStop
function checkEmergencyStop() {
    // then check if the global emergency stop has been activated
    if(globalEmergencyStop == true) {
        // then send a command to turn the track power off
        sendToSerial("<!>");
    }
}

// sendToSerial
function sendToSerial(string) {
    console.log("SERIAL OUTPUT>>> " + string);
    serialConnection.write(string);
}

// updateLoco
function updateLoco(serverAddress) {
    console.log("Call To Update Loco: " + serverAddress);

    // work out the speed from the 5 bits
    var string = LocosObject[serverAddress]["string"];
    var speed = (string[7] * 16) + (string[8] * 8) + (string[9] * 4) + (string[10] * 2) + (string[11] * 1);
    // then change the speed from 0-28 to 0-127
    var speed = parseInt((speed * 127) / 28);

    // then check if it was requested to be emergency stopped
    if(string[6] == 1) {
        // then set speed to -1
        speed = -1;
    }
    
    // then check the direction
    var direction = 1 * string[12];

    // then send that command to the serial connection
    var mainCommand = "<t 1 " + LocosObject[serverAddress]["dA"] + " " + speed + " " + direction + ">";

    sendToSerial(mainCommand);

    // then do the functions commands

    // go through each custom button and then get its real function value, then check if it is on or off then send it to the serial
    for(var key in LocosObject[serverAddress]["cB"]) {
        // then check what function it is mapped to
        var functionNo = LocosObject[serverAddress]["cB"][key]["f"];

        // then check what it is set to
        var customButtonValue = string[12 + parseInt(key)];

        // then combine them into the function and send them off to the serial
        var functionCommand = "<F " + LocosObject[serverAddress]["dA"] + " " + functionNo + " " + customButtonValue + ">";

        sendToSerial(functionCommand)
    }
    
    // then reset the emergency stop as it will have been acted on
    string[6] = "0";

    // then put the whole string back into the json
    LocosObject[serverAddress]["string"] = string;

    // 2 - Broadcast to all devices
    wss.clients.forEach(function each(client) {
        client.send(string, {binary: true});
    })
}

// - Wait For Connections To The Websocket
wss.on("connection", function connection(ws) {
    console.log("Connected To A Client");

    // then as there is a new connection we need to broadcast all of the locos again so it can update itself
    broadcastAllLocos(wss);

    // then wait for messages from the client
    ws.on("message", function message(data) {
        // then read the buffer
        var dataJson = data.toJSON();

        var binary = [];

        // then go through and swap 48 for 0 and 49 for 1

        for(var i = 0; i < dataJson.data.length; i++) {
            // then check if it is 48 and swap it for 0
            if(dataJson.data[i] == 48) {
                // then insert 0 into the i'th index
                binary[i] = 0;
            }
            // then check if it is 49 and swap it for 1
            else if(dataJson.data[i] == 49) {
                // then insert 1 into the i'th index
                binary[i] = 1;
            }
            // if it was normal
            else {
                binary[i] = dataJson.data[i];
            }
        }

        console.log(dataJson)

        // then check parts

        // 1 - check the global emergency stop
        globalEmergencyStop = binary[0];

        checkEmergencyStop();

        // 2 - check the address bits
        var address = [];
        address[0] = binary[2];
        address[1] = binary[3];
        address[2] = binary[4];
        address[3] = binary[5];

        // 3 - then put the binary as a string into the LocosObject
        var addressString = address.join("");
        var dataString = binary.join("");

        console.log(address);
        console.log(addressString);

        LocosObject[addressString]["string"] = dataString;

        updateLoco(addressString);

        // then go through the custom buttons and check if any of them are momentary

        var isMomentary = false;

        for(var i = 13; i < binary.length; i++) {
            // then check if the button is on
            if(binary[i] == 1) {
                // then it is on so check if it is momentary
                if(LocosObject[addressString]["cB"][i-12]["m"] == true) {
                    // then set isMomentary to true
                    isMomentary = true;
                    // then set a timer to turn it off
                    setTimeout(function() {
                        // retrieve the current stored variable
                        var str = LocosObject[addressString]["string"];

                        // then go to the i'th bit
                        str[i] = 0;

                        LocosObject[addressString]["string"] = str;

                    }, 500);
                }
            }
        }

        // then check if the isMomentary flag was set
        if(isMomentary == true) {
            // then set a timeout of 500ms to update the locos again if any buttons were momentary
            setTimeout(function() {
                updateLoco(addressString)
            }, 500);
        }
        
    })
})