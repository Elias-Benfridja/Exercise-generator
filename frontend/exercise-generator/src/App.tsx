import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import GeneratorPage from "./pages/GeneratorPage";
import TrendAnalysisPage from "./pages/TrendAnalysisPage";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface">
      <Navbar />
      <Routes>
        <Route path="/" element={<GeneratorPage />} />
        <Route path="/trends" element={<TrendAnalysisPage />} />
      </Routes>
    </div>
  );
}