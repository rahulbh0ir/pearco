"use client"

import { useEffect, useRef, useState } from "react";
import styles from "./room.module.css"

export default ({
  id
}: {
  id: string
}) => {

  const [offer, setOffer] = useState("")
  const [answer, setAnser] = useState("")

  // const offerRef = useRef(null)
  // const answerRef = useRef(null)

  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);
  let peerConnection = useRef<RTCPeerConnection | null>(null);
  let stream = useRef<MediaStream>(null);

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

  useEffect(() => {

    const getStream = async () => {

      peerConnection.current = await new RTCPeerConnection(configuration);
      stream.current = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      })

      localRef.current!.srcObject = stream.current;

      stream.current!.getTracks().forEach(track => {
        peerConnection.current!.addTrack(track, stream.current!)
      })

      peerConnection.current?.addEventListener("track", (event) => {
        if (event.streams) {
          remoteRef.current!.srcObject = event.streams[0]
        }
      })
    }


    getStream()

  }, [])


  const createOffer = async () => {

    if (offer !== "") {
      peerConnection.current?.setRemoteDescription(JSON.parse(offer))
      createAnswer();
      return
    }

    const getOffer = await peerConnection.current?.createOffer();
    peerConnection.current?.setLocalDescription(getOffer)
    peerConnection.current?.addEventListener("icecandidate", (event) => {
      if (event.candidate) {
        setOffer(JSON.stringify(peerConnection.current?.localDescription));
      }
    })


  }

  const createAnswer = async () => {

    if (answer !== "") {
      peerConnection.current?.setRemoteDescription(JSON.parse(answer));
      return
    }


    const getAnswer = await peerConnection.current?.createAnswer();
    peerConnection.current?.setLocalDescription(getAnswer);
    peerConnection.current?.addEventListener("icecandidate", (event) => {
      if (event.candidate) {
        setAnser(JSON.stringify(peerConnection.current?.localDescription))
      }
    })

  }



  return (
    <main className={styles.room}>

      <h2>Room : {id}</h2>

      <section className={styles.content}>
        <video ref={localRef} id="localVideo" autoPlay playsInline></video>
        <video ref={remoteRef} id="remoteVideo" autoPlay playsInline></video>
      </section>

      <section className={styles.textArea}>

        <div className={styles.textDiv}>
          <p>Offer Text</p>
          <textarea
            // ref={offerRef}
            value={offer}
            id={styles.offer}
            onChange={(event) => setOffer(event.target.value)}
          >
          </textarea>
          <button onClick={createOffer}>Create Offer</button>
        </div>

        <div className={styles.textDiv}>
          <p>Answer Text</p>
          <textarea
            // ref={answerRef}
            value={answer}
            id={styles.answer}
            onChange={(event) => setAnser(event.target.value)}
          >
          </textarea>
          <button onClick={createAnswer}>Create Answer</button>
        </div>

      </section>

    </main>
  )
}
