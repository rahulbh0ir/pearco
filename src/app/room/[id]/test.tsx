"use client"

import { useEffect, useRef, useState } from "react"
import "./test.css"


export default () => {

  const ws = useRef<WebSocket | null>(null)
  let localVideo = useRef<HTMLVideoElement>(null);
  let [toggle, setToggle] = useState(true);

  useEffect(() => {

    const socket = new WebSocket("ws://localhost:8800");
    ws.current = socket;

    socket.onopen = () => {
      console.log("Websocket is running...")
      socket.send("hello")
    }

    const getStream = async () => {
      let stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      })

      localVideo.current!.srcObject = stream
    }

    getStream()






    return () => {
      socket.close()
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
