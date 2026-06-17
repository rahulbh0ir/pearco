"use client"

import { useEffect } from "react"
import styles from "./room.module.css"


export default ({
  id }: {
    id: string
  }) => {

  useEffect(() => {

    const getStream = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      })
      const localVideo = document.querySelector("#localVideo") as HTMLVideoElement;
      localVideo.srcObject = stream;
    }

    
    const makeCall = async () => {
      const configuration = {"iceServers" : [{'urls' : 'stun:stun.l.google.com:19302'}]};
      const peerConnection = new RTCPeerConnection(configuration);
      
      console.log(peerConnection)
      
    } 
    
    getStream()
    makeCall()

  }, [])


  return (
    <main className={styles.room}>
      <h2>Room : {id}</h2>

      <section className={styles.content}>
        <video id="localVideo" autoPlay playsInline controls={false}></video>
        <video id="remoteVideo" autoPlay playsInline controls={false}></video>
      </section>

    </main>
  )
}

