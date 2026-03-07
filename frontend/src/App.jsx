import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import useAlertWebSocket from "./hooks/useAlertWebSocket";

import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";

function App() {
  // Ignite the live socket stream handler
  useAlertWebSocket();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
