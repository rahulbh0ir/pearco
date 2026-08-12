const { WebSocketServer } = require("ws");

const wss = new WebSocketServer({
    port: 8800
});

wss.on("listening", () => {
    console.log("✅ WebSocket server is LISTENING on 8800");
});

wss.on("error", (error) => {
    console.log("❌ WebSocket server error:", error);
});

wss.on("connection", (ws) => {

    console.log("✅ CLIENT CONNECTED");

    ws.on("message", (message) => {
        console.log("📩 received:", message.toString());
    });

    ws.on("close", () => {
        console.log("❌ CLIENT DISCONNECTED");
    });

});