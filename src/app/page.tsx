"use client"

import { useState } from "react";
import styles from "./home.module.css"
import { useRouter } from "next/navigation";


export default function Home() {

  const [id, setId] = useState("");
  const router = useRouter();

  const handleClick = () => {  
    router.push(`/room/${id}`);
    setId("");
  }

  return (
    <main className={styles.home}>

      <section className={styles.content}>
        <h2>Pearcall</h2>
        <input
          id="roomId"
          type="text"
          placeholder="Enter a room name"
          onChange={(e) => setId(e.target.value)}
          value={id}
        />
        <button onClick={handleClick}>Join</button>
      </section>

    </main>
  );
}
