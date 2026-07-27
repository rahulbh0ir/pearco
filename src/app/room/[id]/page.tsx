import Room from "./Room"
import Test from './test'

export default async ({
  params }: {
    params: Promise<{ id: string }>
  }) => {

  const { id } = await params;

  return (
    // <Room id = {id}/>
    < Test />
  )
}

