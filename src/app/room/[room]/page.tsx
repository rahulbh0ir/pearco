
export default async ({params} : {params : Promise<{room : string}>}) => {

  const { room } = await params

  console.log(room)

  return (
    <>
      <h2>Room : {room}</h2>
    </>
  )
}
