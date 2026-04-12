import { BrowserRouter,Navigate,Route,Routes } from "react-router-dom"
import HomePage from "./pages/HomePage"
import Dashboard from "./pages/Dashboard"
import Sender from "./utils/Sender"
import RoomPage from "./pages/RoomPage"

function App() {
  const {name}=Sender()


  return (
    <BrowserRouter>
    <Routes>
      <Route path="/" element={<HomePage/>}/>
      <Route path="/dashboard"  element={name?<Dashboard/>:<Navigate to={"/"}/>}/>
      {/* <Route path="/user/:id" element={<CallPage/>}/> */}
      <Route path="/room/:id" element={<RoomPage/>}/>
    </Routes>
    
    </BrowserRouter>
    
  )
}

export default App
