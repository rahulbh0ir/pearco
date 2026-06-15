
export default async ({params} : {params : Promise<{id : string}>}) => {

  const { id } = await params;

  return (
    <>
      <h2>Room : {id}</h2>
    </>
  )
}
