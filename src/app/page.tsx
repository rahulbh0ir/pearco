"use client"


import { useState } from "react";
import styles from "./home.module.css"


export default function Home() {

  const [id, setId] = useState("");

  const handleClick = () => {
    console.log(id)
    setId("")
  }

  return (
    <div className={styles.home}>

      <div className={styles.content}>
        <h2>Pearcall</h2>
        <input
          id="roomId"
          type="text"
          placeholder="Enter a room name"
          onChange={(e) => setId(e.target.value)}
          value={id}
        />
        <button onClick={handleClick}>Join</button>
      </div>

    </div>
  );
}
