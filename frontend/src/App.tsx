import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import Dashboard from "./pages/Dashboard";
import Sender from "./utils/Sender";

function App() {
  const { name, mode, roomId } = Sender();
  const canOpenDashboard = Boolean(name && mode && (mode === "lobby" || roomId));

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/dashboard"
          element={canOpenDashboard ? <Dashboard /> : <Navigate to="/" replace />}
        />
        <Route path="/room/:id" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
