const { WebSocketServer } = require("ws");
const wss = new WebSocketServer({
    port: 8800
});

let clients = new Map();
let rooms = new Map(); 



// const broadcast = () => {

// }


wss.on("listening", () => {
    console.log("✅ WebSocket server is LISTENING on 8800");
});

wss.on("error", (error) => {
    console.log("❌ WebSocket server error:", error);
});



wss.on("connection", (ws) => {
    const id = crypto.randomUUID()
    let room;

    clients.set(id, ws)

    

    ws.on("message", (message) => {
        room = JSON.parse(message)
        console.log("📩 Room :", room);
    });







    ws.on("close", () => {
        console.log("❌ CLIENT DISCONNECTED");
    });

});