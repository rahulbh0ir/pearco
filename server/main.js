const { WebSocketServer } = require("ws");
const crypto = require("crypto");

const wss = new WebSocketServer({
    port: 8800
});

const clients = new Map();
const rooms = new Map();


/*
==================================================
BROADCAST
==================================================
*/

function broadcast(roomId, senderId, type, payload) {

    const room = rooms.get(roomId);

    if (!room) {
        return;
    }

    for (const clientId of room) {

        if (clientId === senderId) {
            continue;
        }

        const client = clients.get(clientId);

        if (
            client &&
            client.readyState === 1
        ) {

            client.send(
                JSON.stringify({
                    type,
                    senderId,
                    payload
                })
            );
        }
    }
}


/*
==================================================
SERVER
==================================================
*/

wss.on("listening", () => {

    console.log(
        "✅ WebSocket server is LISTENING on 8800"
    );
});


wss.on("error", error => {

    console.error(
        "❌ WebSocket server error:",
        error
    );
});


/*
==================================================
CONNECTION
==================================================
*/

wss.on("connection", ws => {

    const uuid = crypto.randomUUID();

    let roomId = null;

    clients.set(uuid, ws);

    console.log(
        "🔌 CONNECTED:",
        uuid
    );


    /*
    ==============================================
    WELCOME
    ==============================================
    */

    ws.send(
        JSON.stringify({
            type: "welcome",
            payload: uuid
        })
    );


    /*
    ==============================================
    MESSAGE
    ==============================================
    */

    ws.on("message", message => {

        try {

            const data = JSON.parse(message);

            const {
                type,
                roomId: incomingRoomId,
                payload
            } = data;


            /*
            ==========================================
            JOIN
            ==========================================
            */

            if (type === "join") {

                if (!incomingRoomId) {

                    console.log(
                        "❌ JOIN WITHOUT ROOM ID"
                    );

                    return;
                }


                roomId = incomingRoomId;


                if (!rooms.has(roomId)) {

                    rooms.set(
                        roomId,
                        new Set()
                    );
                }


                const room = rooms.get(roomId);


                /*
                Don't add the same client twice.
                */

                if (room.has(uuid)) {
                    return;
                }


                /*
                ======================================
                ROOM ALREADY HAS 2 PEOPLE
                ======================================
                */

                if (room.size >= 2) {

                    console.log(
                        "⚠️ ROOM FULL:",
                        roomId
                    );

                    ws.send(
                        JSON.stringify({
                            type: "room-full"
                        })
                    );

                    return;
                }


                /*
                ======================================
                ADD CLIENT
                ======================================
                */

                room.add(uuid);


                console.log(
                    "📩 JOIN:",
                    uuid
                );

                console.log(
                    "🏠 ROOM:",
                    roomId
                );

                console.log(
                    "👥 ROOM SIZE:",
                    room.size
                );


                /*
                ======================================
                FIRST CLIENT
                ======================================
                */

                if (room.size === 1) {

                    console.log(
                        "⏳ Waiting for another client"
                    );

                    return;
                }


                /*
                ======================================
                SECOND CLIENT
                ======================================
                */

                if (room.size === 2) {

                    /*
                    Tell the existing client that
                    a new peer has joined.
                    */

                    const existingClientId =
                        [...room].find(
                            id => id !== uuid
                        );


                    const existingClient =
                        clients.get(
                            existingClientId
                        );


                    if (
                        existingClient &&
                        existingClient.readyState === 1
                    ) {

                        existingClient.send(
                            JSON.stringify({
                                type: "peer-joined",
                                senderId: uuid
                            })
                        );
                    }


                    /*
                    Tell the NEW client to create
                    the offer.
                    */

                    ws.send(
                        JSON.stringify({
                            type: "offerer",
                            senderId: existingClientId,
                            payload: "send the offer"
                        })
                    );


                    console.log(
                        "🔥 OFFERER:",
                        uuid
                    );
                }


                return;
            }


            /*
            ==========================================
            OFFER
            ==========================================
            */

            if (type === "offer") {

                console.log(
                    "📤 OFFER FROM:",
                    uuid,
                    "ROOM:",
                    roomId
                );


                if (!roomId) {
                    return;
                }


                broadcast(
                    roomId,
                    uuid,
                    "offer",
                    payload
                );


                return;
            }


            /*
            ==========================================
            ANSWER
            ==========================================
            */

            if (type === "answer") {

                console.log(
                    "📤 ANSWER FROM:",
                    uuid,
                    "ROOM:",
                    roomId
                );


                if (!roomId) {
                    return;
                }


                broadcast(
                    roomId,
                    uuid,
                    "answer",
                    payload
                );


                return;
            }


            /*
            ==========================================
            ICE
            ==========================================
            */

            if (type === "icecandidate") {

                if (!roomId) {
                    return;
                }


                broadcast(
                    roomId,
                    uuid,
                    "icecandidate",
                    payload
                );


                return;
            }

        } catch (error) {

            console.error(
                "❌ MESSAGE ERROR:",
                error
            );
        }
    });


    /*
    ==============================================
    CLOSE
    ==============================================
    */

    ws.on("close", () => {

        console.log(
            "❌ DISCONNECTED:",
            uuid
        );


        clients.delete(uuid);


        if (!roomId) {
            return;
        }


        const room = rooms.get(roomId);

        if (!room) {
            return;
        }


        /*
        Remove this client
        */

        room.delete(uuid);


        console.log(
            "👥 ROOM SIZE:",
            room.size
        );


        /*
        ==========================================
        TELL REMAINING PEER
        ==========================================
        */

        for (const remainingId of room) {

            const remainingClient =
                clients.get(remainingId);


            if (
                remainingClient &&
                remainingClient.readyState === 1
            ) {

                remainingClient.send(
                    JSON.stringify({
                        type: "peer-left",
                        senderId: uuid
                    })
                );
            }
        }


        /*
        ==========================================
        DELETE EMPTY ROOM
        ==========================================
        */

        if (room.size === 0) {

            rooms.delete(roomId);

            console.log(
                "🗑️ ROOM DELETED:",
                roomId
            );
        }
    });
});