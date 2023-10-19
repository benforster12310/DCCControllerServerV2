// DCCControllerServerV2 Written By Ben Forster 2023

// Import Modules
import { WebSocketServer } from 'ws';
import { readFileSync } from 'fs';

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

    console.log(LocosObject)
    
}



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
    }
}

// updateLoco

function updateLoco(serverAddress) {
    console.log("Call To Update Loco: " + serverAddress);
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

        var binary = dataJson.data;

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

        for(var i = 13; i < binary.length; i++) {
            // then check if the button is on
            if(binary[i] == 1) {
                // then it is on so check if it is momentary
                if(LocosObject[addressString]["cB"][i-12]["m"] == true) {
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

        console.log(str);
        
    })
})