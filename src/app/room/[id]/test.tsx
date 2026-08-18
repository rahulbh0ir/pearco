"use client"

import { useEffect, useRef, useState } from "react"
import "./test.css"


export default ({
  id
}: {
  id: string
}) => {

  const configuration = {
    "iceServers": [
      {
        urls: [
          'stun:stun.l.google.com:19302',
          'stun:stun1.l.google.com:19302',
          'stun:stun.cloudflare.com:3478'
        ]
      }
    ]
  };
  const socket = useRef<WebSocket | null>(null)
  const peerConnection = useRef<RTCPeerConnection | null>(null)

  const stream = useRef<MediaStream | null>(null)
  const localVideo = useRef<HTMLVideoElement>(null);
  const remoteVideo = useRef<HTMLVideoElement>(null);

  let [toggle, setToggle] = useState(true);

  interface datatype {
    type: string,
    payload: object | string
  }

  const send = ({ type, payload }: datatype) => {

    if (socket.current?.readyState === WebSocket.OPEN) {
      socket.current!.send(JSON.stringify({ type, id, payload }))
    }

  }





  useEffect(() => {

    socket.current = new WebSocket("ws://localhost:8800");

    socket.current.onopen = () => {
      console.log("✅ CLIENT: WebSocket connected");
      // socket.current!.send(room);
      send({
        type: "join",
        payload: "hello"
      })
    };


    socket.current.onmessage = (msg) => {
      // console.log("✅ CLIENT ID :", msg.data);
      const { type, id, payload } = JSON.parse(msg.data);

      if (type === "welcome") {
        console.log("✅ CLIENT ID :", payload)
      }

      if(type === "offer") {
        console.log("Offer : ", payload , id)
      }


      if (type === "full") {
        console.log(payload)
      }



    }


    socket.current.onerror = (error) => {
      console.log("❌ CLIENT: WebSocket error", error);
    };

    socket.current.onclose = (event) => {
      console.log("❌ CLIENT: WebSocket closed", event.code);
    };






    const getStream = async () => {

      peerConnection.current = new RTCPeerConnection(configuration);

      stream.current = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      })

      localVideo.current!.srcObject = stream.current;

      let offer = await peerConnection.current.createOffer();
      peerConnection.current.setLocalDescription(offer);

      send({
        type: "offer",
        payload: offer
      })



    }

    getStream()




    return () => {

      // close websocket
      socket.current!.close()

      // close camera and audio
      stream.current?.getTracks().forEach(track => track.stop());
      stream.current = null;

    }

  }, [])


  return (

    <main className="test">

      <section className="container">
        <div className="videos">
          <video ref={localVideo} className="video" id="localVideo" autoPlay playsInline></video>
        </div>

        {toggle ? (
          <div className="chat">
            <p>Chats</p>
          </div>
        ) : null}

      </section>


      <section className="controls">
        <button>Audio</button>
        <button>Video</button>
        <button>Screen</button>
        <button>End</button>
        <button onClick={() => setToggle(toggle = !toggle)}>Chat</button>
      </section>

    </main>

  )
}
