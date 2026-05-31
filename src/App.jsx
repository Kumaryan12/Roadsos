import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import CitizenPortal from "./pages/CitizenPortal";
import PersonalSafety from "./pages/PersonalSafety";
import BystanderReport from "./pages/BystanderReport";
import AdminDashboard from "./pages/AdminDashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/citizen" element={<CitizenPortal />} />
        <Route path="/safety" element={<PersonalSafety />} />
        <Route path="/report" element={<BystanderReport />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;