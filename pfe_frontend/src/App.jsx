import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';

import UploadPage from './components/Uploadpage'; // أضفنا مجلد components
import Dashboard from './components/Dashboard';    // أضفنا مجلد components



function NavBar() {
  const location = useLocation();
  const linkStyle = (path) => ({
    padding: '10px 20px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '14px',
    color: location.pathname === path ? '#fff' : '#334155',
    backgroundColor: location.pathname === path ? '#2563eb' : 'transparent',
  });

  return (
    <nav style={{ display: 'flex', justifyContent: 'center', gap: '10px', padding: '14px', backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0' }}>
      <Link to="/" style={linkStyle('/')}>📄 Analyse de Documents</Link>
      <Link to="/dashboard" style={linkStyle('/dashboard')}>📊 Dashboard</Link>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <NavBar />
      <Routes>
        <Route path="/" element={<UploadPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;