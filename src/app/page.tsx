"use client"
import { useState } from "react";
import styles from "./home.module.css";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Logo from "../../public/logo.png"


export default () => {

  const [id , setId] = useState("")
  const router = useRouter()


  const submit = () => {
    router.push(`/room/${id}`)
    setId("")
  }

  return (
    <main className={styles.home}>

      <section className={styles.content}>
        <Image 
          src={Logo}
          alt="Website logo"
          width={50}
          height={50}
          loading="eager"
        />
        <h2>Pearco</h2>

        <input
          type="text"
          placeholder="Enter a room name"
          onChange={(e) => setId(e.target.value)}
          value={id}
          required
          />

        <input
          className={styles.btn}
          type="submit"
          value="Join"
          onClick={() => submit()}
          />

      </section>
    </main>
  )
}
