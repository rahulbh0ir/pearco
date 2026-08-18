const { WebSocketServer } = require("ws");
const wss = new WebSocketServer({
    port: 8800
});

let clients = new Map();
let rooms = new Map();



const broadcast = (uuid, type, id, payload) => {
    rooms.get(id).forEach(value => {
        if (value !== uuid) {
            clients.get(value).send(JSON.stringify({ type: "offer", id: uuid, payload: payload }))
        }
    })
}


wss.on("listening", () => {
    console.log("✅ WebSocket server is LISTENING on 8800");
});

wss.on("error", (error) => {
    console.log("❌ WebSocket server error:", error);
});



wss.on("connection", (ws) => {
    const uuid = crypto.randomUUID()
    let room;

    clients.set(uuid, ws)



    ws.on("message", (message) => {
        let data = JSON.parse(message)
        const { type, id, payload } = data;

        room = id

        // console.log("📩 Room :", room);


        if (!rooms.has(room)) {
            rooms.set(room, new Set());
        }

        rooms.get(room).add(uuid);

        console.log(rooms)

        if (type === "offer") {
            broadcast(uuid, type, id, payload)
        }


        if (rooms.get(room).size == 2) {
            ws.send(JSON.stringify({
                type: "full",
                payload: "Room is full"
            }))
        }

    });







    ws.on("close", (ws) => {
        console.log("❌ CLIENT DISCONNECTED : ", uuid);
        clients.delete(uuid);

        if (room && rooms.get(room)) {

            rooms.get(room).delete(uuid)

            if (rooms.get(room).size == 0) {
                rooms.delete(room)
            }
        }

    });



    ws.send(JSON.stringify({
        type: "welcome",
        payload: uuid
    }))

});