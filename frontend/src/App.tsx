import { Routes, Route } from "react-router-dom";
import { ChatPage } from "./pages/ChatPage";
import { ConsultantResultsPage } from "./pages/ConsultantResultsPage";
import { AdminPage } from "./pages/AdminPage";
import { Navbar } from "./components/Navbar";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./index.css";

export function App() {
  return (
    <ErrorBoundary>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<ChatPage />} />
            <Route path="/results" element={<ConsultantResultsPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </main>
      </div>
    </ErrorBoundary>
  );
}

export default App;
