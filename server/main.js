
const { WebSocketServer } = require("ws");
const wss = new WebSocketServer({port : 8800});

console.log("websocket running...");