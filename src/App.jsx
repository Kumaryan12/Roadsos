import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./auth/AuthProvider";
import AdminAuthGate from "./components/AdminAuthGate";
import CitizenAuthGate from "./components/CitizenAuthGate";
import Home from "./pages/Home";
import CitizenPortal from "./pages/CitizenPortal";
import PersonalSafety from "./pages/PersonalSafety";
import BystanderReport from "./pages/BystanderReport";
import AdminDashboard from "./pages/AdminDashboard";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/citizen"
            element={
              <CitizenAuthGate>
                <CitizenPortal />
              </CitizenAuthGate>
            }
          />
          <Route
            path="/safety"
            element={
              <CitizenAuthGate>
                <PersonalSafety />
              </CitizenAuthGate>
            }
          />
          <Route
            path="/report"
            element={
              <CitizenAuthGate>
                <BystanderReport />
              </CitizenAuthGate>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminAuthGate>
                <AdminDashboard />
              </AdminAuthGate>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
