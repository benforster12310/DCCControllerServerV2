// DCCControllerServerV2 Written By Ben Forster 2023

// Import Modules
import { WebSocketServer } from 'ws';
import { read, readFileSync } from 'fs';


// 1 - Load The Webserver
const wss = new WebSocketServer({ port: 81, path:"/ws" });

// 2 - Go through the locos.json file
var locosJson = JSON.parse(readFileSync("./locos.json"));

