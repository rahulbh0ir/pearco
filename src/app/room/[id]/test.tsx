"use client";

import { useEffect, useRef, useState } from "react";
import "./test.css";


// Interfaces

interface Props {
  id: string;
}

interface SignalMessage {
  type: string;
  senderId?: string;
  payload?: any;
}


export default function Test({ id }: Props) {

  const configuration: RTCConfiguration = {

    iceServers: [
      {
        urls: [
          "stun:stun.l.google.com:19302",
          "stun:stun1.l.google.com:19302",
          "stun:stun.cloudflare.com:3478"
        ]
      }
    ]
  };


  const socket = useRef<WebSocket | null>(null);

  const peer = useRef<RTCPeerConnection | null>(null);

  const stream = useRef<MediaStream | null>(null);

  const localVideo = useRef<HTMLVideoElement | null>(null);

  const remoteVideo = useRef<HTMLVideoElement | null>(null);

  const pendingCandidates = useRef<RTCIceCandidateInit[]>([]);

  const remotePeerId = useRef<string | null>(null);

  const [toggle, setToggle] = useState(true);


  const send = ({
    type,
    payload
  }: {
    type: string;
    payload?: any;
  }) => {

    const ws = socket.current;


    if (!ws) {
      return;
    }


    if (ws.readyState !== WebSocket.OPEN) {
      console.log("⚠️ WebSocket not open");
      return;
    }


    ws.send(JSON.stringify({
      type,
      roomId: id,
      payload
    })
    );
  };


  const createPeerConnection = () => {

    console.log("🧩 Creating new RTCPeerConnection");

    const pc = new RTCPeerConnection(configuration);
    peer.current = pc;


    pc.addEventListener("track", event => {

      console.log("🎥 REMOTE TRACK");

      if (remoteVideo.current) {
        remoteVideo.current.srcObject = event.streams[0];
      }
    });


    pc.addEventListener("icecandidate", event => {

      if (!event.candidate) {
        console.log("🧊 ICE gathering complete");
        return;
      }

      console.log("🧊 Sending ICE");

      send({
        type: "icecandidate",
        payload: event.candidate
      });
    });


    /*
    ----------------------------------------------
    DEBUG
    ----------------------------------------------
    */

    pc.addEventListener(
      "signalingstatechange",
      () => {
        console.log("📡 signalingState:", pc.signalingState);
      }
    );


    pc.addEventListener(
      "iceconnectionstatechange",
      () => {
        console.log("🧊 iceConnectionState:", pc.iceConnectionState);
      }
    );


    pc.addEventListener(
      "connectionstatechange",
      () => {
        console.log("🔗 connectionState:", pc.connectionState);
      }
    );


    return pc;


  };


  const addLocalTracks = () => {

    if (!stream.current) {
      return;
    }


    if (!peer.current) {
      return;
    }


    /*
    Don't add tracks twice.
    */

    const senders = peer.current.getSenders();


    stream.current.getTracks().forEach(track => {

      const alreadyAdded = senders.some(sender => sender.track === track);

      if (!alreadyAdded) {
        peer.current!.addTrack(track, stream.current!);
      }

    });
  };



  const closePeerConnection = () => {

    console.log("🧹 Closing RTCPeerConnection");

    if (peer.current) {
      peer.current.close();
      peer.current = null;
    }

    pendingCandidates.current = [];

    remotePeerId.current = null;


    if (remoteVideo.current) {
      remoteVideo.current.srcObject = null;
    }
  };


  const createOffer = async () => {

    const pc = peer.current;

    if (!pc) {
      console.log("❌ No peer");
      return;
    }


    /*
    Only create an offer from stable.
    */

    if (pc.signalingState !== "stable") {
      console.log("⚠️ Can't create offer.", pc.signalingState);
      return;
    }

    console.log("📤 CREATING OFFER");

    const offer = await pc.createOffer();

    await pc.setLocalDescription(offer);

    /*
    Send the description actually
    installed on the peer.
    */

    send({
      type: "offer",
      payload: pc.localDescription
    });


    console.log("📤 OFFER SENT");
  };


  const handleOffer = async (
    offer: RTCSessionDescriptionInit,
    senderId: string
  ) => {

    console.log("📩 OFFER FROM:", senderId);

    /*
    If this is a different peer,
    destroy the old connection.
    */

    if (
      remotePeerId.current &&
      remotePeerId.current !== senderId
    ) {

      console.log("🔄 OFFER FROM NEW PEER");

      closePeerConnection();

      createPeerConnection();

      addLocalTracks();
    }


    remotePeerId.current =
      senderId;


    const pc = peer.current;


    if (!pc) {
      return;
    }


    /*
    If we're already negotiating,
    don't blindly overwrite it.
    */

    if (
      pc.signalingState !== "stable"
    ) {
      console.log("⚠️ Ignoring offer.", "state:", pc.signalingState);
      return;
    }


    try {
      await pc.setRemoteDescription(offer);

      console.log("✅ REMOTE OFFER SET");

      for (
        const candidate
        of pendingCandidates.current
      ) {

        try {

          await pc.addIceCandidate(
            new RTCIceCandidate(
              candidate
            )
          );

        } catch (error) {

          console.error("❌ QUEUED ICE ERROR:", error);
        }
      }


      pendingCandidates.current = [];

      const answer = await pc.createAnswer();

      await pc.setLocalDescription(answer);

      send({
        type: "answer",
        payload: pc.localDescription
      });


      console.log("📤 ANSWER SENT");

    } catch (error) {

      console.error("❌ OFFER ERROR:",error);
    }
  };




  const handleAnswer = async (
    answer: RTCSessionDescriptionInit,
    senderId: string
  ) => {

    console.log("📩 ANSWER FROM:",senderId);


    /*
    Ignore answers from a peer we aren't
    currently negotiating with.
    */

    if (
      remotePeerId.current &&
      remotePeerId.current !== senderId
    ) {

      console.log("⚠️ Ignoring answer from old peer");

      return;
    }


    remotePeerId.current =
      senderId;


    const pc = peer.current;


    if (!pc) {
      return;
    }


    /*
    VERY IMPORTANT.

    An answer can only be applied when
    we're waiting for an answer.
    */

    if (
      pc.signalingState !==
      "have-local-offer"
    ) {

      console.log("⚠️ IGNORING ANSWER.","Current state:",pc.signalingState);
      return;
    }


    try {

      await pc.setRemoteDescription(answer);
      console.log("✅ REMOTE ANSWER SET");


      /*
      Add queued candidates.
      */

      for (
        const candidate
        of pendingCandidates.current
      ) {

        try {

          await pc.addIceCandidate(
            new RTCIceCandidate(
              candidate
            )
          );

        } catch (error) {

          console.error("❌ QUEUED ICE ERROR:",error);
        }
      }


      pendingCandidates.current = [];

    } catch (error) {

      console.error("❌ ANSWER ERROR:",error);
    }
  };




  const handleIceCandidate = async (
    candidateData: RTCIceCandidateInit,
    senderId: string
  ) => {

    /*
    Ignore candidates from an old peer.
    */

    if (
      remotePeerId.current &&
      remotePeerId.current !== senderId
    ) {

      console.log("⚠️ Ignoring ICE from old peer:",senderId);
      return;
    }


    remotePeerId.current =
      senderId;


    const pc = peer.current;


    if (!pc) {
      return;
    }


    /*
    Remote description hasn't arrived yet.
    */

    if (!pc.remoteDescription) {

      console.log(
        "⏳ Queueing ICE"
      );


      pendingCandidates.current.push(candidateData);

      return;
    }


    try {

      await pc.addIceCandidate(
        new RTCIceCandidate(
          candidateData
        )
      );


      console.log(
        "✅ REMOTE ICE ADDED"
      );

    } catch (error) {

      console.error(
        "❌ ICE ERROR:",
        error
      );
    }
  };


  const handleMessage = async (
    event: MessageEvent
  ) => {

    try {

      const {
        type,
        senderId,
        payload
      }: SignalMessage =
        JSON.parse(event.data);


      console.log(
        "📩 MESSAGE:",
        type,
        senderId
      );


      if (type === "welcome") {

        console.log(
          "🆔 CLIENT ID:",
          payload
        );

        return;
      }


      if (type === "offerer") {

        console.log(
          "🔥 I AM OFFERER"
        );


        remotePeerId.current =
          senderId ?? null;


        await createOffer();

        return;
      }

      if (type === "peer-joined") {

        console.log(
          "👋 NEW PEER:",
          senderId
        );


        /*
        The old WebRTC connection belongs
        to the old peer.

        Destroy it before accepting the
        new negotiation.
        */

        closePeerConnection();


        createPeerConnection();


        addLocalTracks();


        remotePeerId.current =
          senderId ?? null;


        return;
      }


      if (type === "peer-left") {

        console.log(
          "👋 PEER LEFT:",
          senderId
        );

        closePeerConnection();


        return;
      }

      if (type === "room-full") {

        console.log(
          "❌ ROOM IS FULL"
        );
        return;
      }


      if (type === "offer") {

        if (!senderId) {
          return;
        }

        await handleOffer(
          payload,
          senderId
        );


        return;
      }

      if (type === "answer") {

        if (!senderId) {
          return;
        }

        await handleAnswer(
          payload,
          senderId
        );

        return;
      }

      if (type === "icecandidate") {

        if (!senderId) {
          return;
        }

        await handleIceCandidate(
          payload,
          senderId
        );

        return;
      }

    } catch (error) {

      console.error(
        "❌ MESSAGE ERROR:",
        error
      );
    }
  };


  useEffect(() => {

    let cancelled = false;


    const initialize = async () => {

      try {

        createPeerConnection();

        stream.current =
          await navigator.mediaDevices
            .getUserMedia({
              video: true,
              audio: false
            });


        if (cancelled) {

          stream.current
            ?.getTracks()
            .forEach(track =>
              track.stop()
            );

          return;
        }



        if (localVideo.current) {

          localVideo.current
            .srcObject =
            stream.current;
        }

        addLocalTracks();


        const ws =
          new WebSocket(
            "ws://localhost:8800"
          );


        socket.current = ws;


        ws.onopen = () => {

          console.log(
            "✅ CLIENT: WebSocket connected"
          );


          send({
            type: "join"
          });
        };

        ws.onmessage =
          handleMessage;

        ws.onerror = error => {

          console.error(
            "❌ CLIENT: WebSocket error:",
            error
          );
        };

        ws.onclose = event => {

          console.log(
            "❌ CLIENT: WebSocket closed:",
            event.code
          );
        };

      } catch (error) {
        console.error(
          "❌ INITIALIZATION ERROR:",
          error
        );
      }
    };

    initialize();



    return () => {

      console.log(
        "🧹 COMPONENT CLEANUP"
      );

      cancelled = true;

      if (socket.current) {
        socket.current.close();
        socket.current = null;
      }


      if (stream.current) {
        stream.current
          .getTracks()
          .forEach(track => {
            track.stop();
          });

        stream.current = null;
      }


      if (peer.current) {
        peer.current.close();
        peer.current = null;
      }

      pendingCandidates.current = [];
      remotePeerId.current = null;


      if (localVideo.current) {
        localVideo.current.srcObject =
          null;
      }


      if (remoteVideo.current) {
        remoteVideo.current.srcObject =
          null;
      }
    };

  }, [id]);


  return (

    <main className="test">

      <section className="container">

        <div className="videos">

          <video
            ref={localVideo}
            className="video"
            autoPlay
            playsInline
            muted
          />

          <video
            ref={remoteVideo}
            className="video"
            autoPlay
            playsInline
          />

        </div>


        {toggle && (

          <div className="chat">

            <p>Chats</p>

          </div>

        )}

      </section>


      <section className="controls">

        <button>
          Audio
        </button>

        <button>
          Video
        </button>

        <button>
          Screen
        </button>

        <button>
          End
        </button>

        <button
          onClick={() =>
            setToggle(
              previous => !previous
            )
          }
        >
          Chat
        </button>

      </section>

    </main>
  );
}