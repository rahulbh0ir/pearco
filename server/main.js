
const { WebSocketServer } = require("ws");
const ws = new WebSocketServer({port : 8800});

console.log("websocket running...");