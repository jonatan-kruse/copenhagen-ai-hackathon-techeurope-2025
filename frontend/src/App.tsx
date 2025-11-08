import { Routes, Route } from "react-router-dom";
import { ChatPage } from "./pages/ChatPage";
import { ConsultantResultsPage } from "./pages/ConsultantResultsPage";
import { AdminPage } from "./pages/AdminPage";
import { Navbar } from "./components/Navbar";
import "./index.css";

export function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<ChatPage />} />
        <Route path="/results" element={<ConsultantResultsPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </>
  );
}

export default App;
