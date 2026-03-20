import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { Shield, Home, Database, Activity, FileText } from "lucide-react";
import Dashboard from "./pages/Dashboard";
import Assets from "./pages/Assets";
import Scanning from "./pages/Scanning";
import Results from "./pages/Results";
import "./App.css";

function App() {
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
