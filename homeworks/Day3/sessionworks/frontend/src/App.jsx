import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { Shield, Home, Database, Activity, FileText, Bell, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import Dashboard from "./pages/Dashboard";
import Assets from "./pages/Assets";
import Scanning from "./pages/Scanning";
import Results from "./pages/Results";
import Alerts from "./pages/Alerts";
import Schedules from "./pages/Schedules";
import { alertsAPI } from "./services/api";
import "./App.css";

function App() {
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    const fetchCount = () => alertsAPI.count().then(setAlertCount).catch(() => {});
    fetchCount();
    const id = setInterval(fetchCount, 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <BrowserRouter>
      <div className="app">
        <nav className="navbar">
          <div className="container">
            <div className="nav-content">
              <NavLink to="/" className="nav-brand">
                <Shield className="nav-icon" />
                <span>EASM Platform</span>
              </NavLink>
              <div className="nav-links">
                <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
                  <Home size={18} />
                  Dashboard
                </NavLink>
                <NavLink to="/assets" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
                  <Database size={18} />
                  Assets
                </NavLink>
                <NavLink to="/scanning" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
                  <Activity size={18} />
                  Scanning
                </NavLink>
                <NavLink to="/results" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
                  <FileText size={18} />
                  Results
                </NavLink>
                <NavLink to="/schedules" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
                  <Clock size={18} />
                  Schedules
                </NavLink>
                <NavLink to="/alerts" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} style={{ position: "relative" }}>
                  <Bell size={18} />
                  Alerts
                  {alertCount > 0 && (
                    <span style={{
                      position: "absolute", top: "-4px", right: "-8px",
                      background: "#ef4444", color: "white",
                      borderRadius: "9999px", fontSize: "0.65rem",
                      padding: "1px 5px", lineHeight: 1.4,
                    }}>
                      {alertCount}
                    </span>
                  )}
                </NavLink>
              </div>
            </div>
          </div>
        </nav>

        <main className="main-content">
          <div className="container">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/assets" element={<Assets />} />
              <Route path="/scanning" element={<Scanning />} />
              <Route path="/results" element={<Results />} />
              <Route path="/schedules" element={<Schedules />} />
              <Route path="/alerts" element={<Alerts />} />
            </Routes>
          </div>
        </main>

        <footer className="footer">
          <div className="container">
            <p className="text-muted text-sm">
              © 2026 EASM Platform - CMC Intern Program
            </p>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
