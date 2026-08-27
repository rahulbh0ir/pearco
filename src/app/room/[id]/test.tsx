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
  const peer = useRef<RTCPeerConnection | null>(null)

  const stream = useRef<MediaStream | null>(null)
  const localVideo = useRef<HTMLVideoElement>(null);
  const remoteVideo = useRef<HTMLVideoElement>(null);

  let [toggle, setToggle] = useState(true);

  interface datatype {
    type: string,
    payload: any
  }

  const send = ({ type, payload }: datatype) => {

    if (socket.current?.readyState === WebSocket.OPEN) {
      socket.current!.send(JSON.stringify({ type, id, payload }))
    }

  }

  const peerConnection = async () => {
    if (peer.current) {
      return
    }

    peer.current = new RTCPeerConnection(configuration);




    peer.current.addEventListener("track", (event) => {
      remoteVideo.current!.srcObject = event.streams[0]
    })

    peer.current.addEventListener("icecandidate", (event) => {

      if (event.candidate) {
        send({
          type: "icecandidate",
          payload: event.candidate
        })
      }
    })

  }



  const createOffer = async () => {

    let offer = await peer.current!.createOffer();
    await peer.current!.setLocalDescription(offer);

    send({
      type: "offer",
      payload: offer
    })

  };


  const createAnswer = async () => {
    const answer = await peer.current?.createAnswer();
    await peer.current!.setLocalDescription(answer);

    send({
      type: "answer",
      payload: answer
    })
  }





  useEffect(() => {

    socket.current = new WebSocket("ws://localhost:8800");

    socket.current.onopen = () => {

      console.log("✅ CLIENT: WebSocket connected");

      send({
        type: "join",
        payload: "This could be username"
      })
    };


    socket.current.onmessage = async (msg) => {
      // console.log("✅ CLIENT ID :", msg.data);
      const { type, id, payload } = JSON.parse(msg.data);

      if (type === "welcome") {
        console.log("✅ CLIENT ID :", payload)
      }

      if (type === "offerer") {
        createOffer();
        console.log(payload)
      }


      if (type === "offer") {
        console.log("offer :", payload);

        await peerConnection()
        await peer.current!.setRemoteDescription(payload);
        createAnswer()
      }

      if (type === "answer") {
        console.log("Answer :", payload)

        await peer.current?.setRemoteDescription(payload)
      }


      if (type === "icecandidate") {
        console.log("IceCandidate : ", payload)
        await peer.current?.addIceCandidate(new RTCIceCandidate(payload))
      }


    }


    socket.current.onerror = (error) => {
      console.log("❌ CLIENT: WebSocket error", error);
    };

    socket.current.onclose = (event) => {
      console.log("❌ CLIENT: WebSocket closed", event.code);
    };






    const getStream = async () => {

      await peerConnection();

      stream.current = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      })

      localVideo.current!.srcObject = stream.current;
      stream.current.getTracks().forEach(track => peer.current?.addTrack(track, stream.current!))


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
          <video ref={remoteVideo} className="video" id="remoteVideo" autoPlay playsInline></video>

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
