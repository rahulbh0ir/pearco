import Room from "./Room"

export default async ({
  params
}: {
  params: Promise<{ id: string }>
}) => {

  const { id } = await params

  console.log(id);

  return (
    <Room id={id} />
  )
}
