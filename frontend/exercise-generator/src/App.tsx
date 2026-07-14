import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import GeneratorPage from "./pages/GeneratorPage";
import TrendAnalysisPage from "./pages/TrendAnalysisPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import MyExercisesPage from "./pages/MyExercisesPage";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface">
      <Navbar />
      <Routes>
        <Route path="/" element={<GeneratorPage />} />
        <Route path="/trends" element={<TrendAnalysisPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/my-exercises" element={<MyExercisesPage />} />
      </Routes>
    </div>
  );
}