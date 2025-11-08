import { Routes, Route } from "react-router-dom";
import { ProjectDescriptionPage } from "./pages/ProjectDescriptionPage";
import { ConsultantResultsPage } from "./pages/ConsultantResultsPage";
import { AdminPage } from "./pages/AdminPage";
import { Navbar } from "./components/Navbar";
import "./index.css";

export function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<ProjectDescriptionPage />} />
        <Route path="/results" element={<ConsultantResultsPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </>
  );
}

export default App;
