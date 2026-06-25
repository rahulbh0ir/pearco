"use client"

import { useEffect, useRef, useState } from "react"
import styles from "./room.module.css"


export default ({
  id }: {
    id: string
  }) => {


  const offerRef = useRef<HTMLTextAreaElement>(null);
  const answerRef = useRef<HTMLTextAreaElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  let [offerSdp, setOfferSdp] = useState("");
  let [answerSdp, setAnswerSdp] = useState("");

  let peerConnection = useRef<RTCPeerConnection | null>(null);
  let stream = useRef<MediaStream | null>(null);

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
      stream.current = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream.current;
      }

      peerConnection.current = await new RTCPeerConnection(configuration);

      stream.current!.getTracks().forEach(track => {
        peerConnection.current!.addTrack(track, stream.current!);
      });

      peerConnection.current.ontrack = (event) => {
        // console.log("Track recieved ", event.streams);
        if (event.streams) {
          remoteVideoRef.current!.srcObject = event.streams[0]
        }
      }

    }

    getStream()
  }, [])



  const createOffer = async () => {

    if (offerRef.current?.value) {
      await peerConnection.current!.setRemoteDescription(JSON.parse(offerRef.current.value));
      await createAnswer();
      return
    }

    const offer = await peerConnection.current!.createOffer();
    await peerConnection.current!.setLocalDescription(offer);

    peerConnection.current!.onicecandidate = event => {
      if (event.candidate) {
        setOfferSdp(JSON.stringify(peerConnection.current?.localDescription))
      }
    }

  }


  const createAnswer = async () => {

    const answer = await peerConnection.current!.createAnswer()
    await peerConnection.current!.setLocalDescription(answer);

    peerConnection.current!.onicecandidate = event => {
      if (event.candidate) {
        setAnswerSdp(JSON.stringify(peerConnection.current?.localDescription))
      }
    }
  }


  const addAnswer = async () => {
    if (
      answerRef.current?.value &&
      peerConnection.current!.signalingState === "have-local-offer"
    ) {
      await peerConnection.current!.setRemoteDescription(
        JSON.parse(answerRef.current.value)
      );
      console.log("Answer Added")



    } else {
      console.log(
        "Cannot add answer. Current state:",
        peerConnection.current!.signalingState
      );
    }
  };


  return (
    <main className={styles.room}>
      <h2>Room : {id}</h2>

      <section className={styles.content}>
        <video
          ref={localVideoRef}
          id="localVideo"
          autoPlay
          playsInline
          controls={false}>
        </video>

        <video
          ref={remoteVideoRef}
          id="remoteVideo"
          autoPlay
          playsInline
          controls={false}>

        </video>
      </section>





      <section className={styles.textArea}>

        <p>SDP Offer</p>
        <textarea
          ref={offerRef}
          name="offer" id={styles.offer}
          value={offerSdp}
          onChange={(e) => setOfferSdp(e.target.value)}>
        </textarea>
        <button className="offerBtn" onClick={createOffer}>Create Offer</button>

        <p>SDP Answer</p>
        <textarea
          ref={answerRef}
          name="answer"
          id={styles.answer}
          value={answerSdp}
          onChange={(e) => setAnswerSdp(e.target.value)}>
        </textarea>
        <button className="answerBtn" onClick={createAnswer}>Create Answer</button>

      </section>

      <section>
        <button className="addBtn" onClick={addAnswer}>Add Answer</button>
      </section>


    </main>
  )
}

