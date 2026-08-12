"use client"

import { useEffect, useRef, useState } from "react"
import "./test.css"


export default () => {

  const socket = useRef<WebSocket | null>(null)
  const stream = useRef<MediaStream | null>(null)
  const localVideo = useRef<HTMLVideoElement>(null);

  let [toggle, setToggle] = useState(true);



  useEffect(() => {

    socket.current = new WebSocket("ws://localhost:8800");

    socket.current.onopen = () => {
      console.log("✅ CLIENT: WebSocket connected");
      socket.current!.send("hello");
    };

    socket.current.onerror = (error) => {
      console.log("❌ CLIENT: WebSocket error", error);
    };

    socket.current.onclose = (event) => {
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
