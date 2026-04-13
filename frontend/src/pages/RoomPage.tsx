// import Sender from "@/utils/Sender"
import { useEffect } from "react"
import { useParams } from "react-router-dom"

const RoomPage = () => {
    const {id}=useParams()

    // const {setSocketIn}=Sender()

    useEffect(()=>{
      
    },[])
  return (
    <div>
      hii {id}
    </div>
  )
}

export default RoomPage
