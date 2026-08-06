
const { WebSocketServer } = require("ws");
const wss = new WebSocketServer({ port: 8800 });

console.log("websocket running...");

wss.on("connection" , (ws) => {


  ws.on("message" ,(message) => {
    console.log(message.toString())
  })
})