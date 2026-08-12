"use client"

import { useEffect, useRef, useState } from "react"
import "./test.css"


export default () => {

  const ws = useRef<WebSocket | null>(null);
  let localVideo = useRef<HTMLVideoElement>(null);
  let stream = useRef<MediaStream | null>(null)
  let [toggle, setToggle] = useState(true);



  useEffect(() => {

    const socket = new WebSocket("ws://localhost:8800");
    ws.current = socket;

    socket.onopen = () => {
      console.log("✅ CLIENT: WebSocket connected");
      socket.send("hello");
    };

    socket.onerror = (error) => {
      console.log("❌ CLIENT: WebSocket error", error);
    };

    socket.onclose = (event) => {
      console.log("❌ CLIENT: WebSocket closed", event.code);
    };

    const getStream = async () => {
      stream.current = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      })

      localVideo.current!.srcObject = stream.current
    }

    getStream()




    return () => {
      
      // close websocket
      socket.close()
      
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
