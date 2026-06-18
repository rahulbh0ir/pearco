"use client"

import { useEffect } from "react"
import styles from "./room.module.css"


export default ({
  id }: {
    id: string
  }) => {

  useEffect(() => {

    let peerConnection: RTCPeerConnection;
    let stream: MediaStream;
    
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

    const makeCall = async () => {

      const localStream = document.getElementById("localVideo") as HTMLVideoElement;
      stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      })
      localStream.srcObject = stream;
      peerConnection = await new RTCPeerConnection(configuration);
      
      stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
      const offer = await peerConnection.createOffer();
      peerConnection.setLocalDescription(offer);

      peerConnection.addEventListener("icecandidate", (event) => {
        if(event.candidate) {
          console.log(event.candidate);
          console.log(peerConnection)
        }
      })


    }

    makeCall()


  }, [])




  return (
    <main className={styles.room}>
      <h2>Room : {id}</h2>

      <section className={styles.content}>
        <video id="localVideo" autoPlay playsInline controls={false}></video>
        <video id="remoteVideo" autoPlay playsInline controls={false}></video>
      </section>




      <button onClick={() => {
        const localVideo = document.querySelector("#localVideo") as HTMLVideoElement;
        localVideo.srcObject = null;
      }}>Stop</button>

    </main>
  )
}

