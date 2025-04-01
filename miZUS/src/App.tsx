import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import WelcomeText from './components/welcomeTexts';
import './index.css';
import './App.css';
import StudentsPage from './students';
import Calendar from './calendar'
import Month from './month';

function NavButtons() {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', alignItems: 'center' }}>
      <button onClick={() => navigate('/students')}>Moji žiaci</button>
      <button onClick={() => navigate('/calendar')}>Kalendár</button>
    </div>
  );
}

function HomePage() {
  const [welcomeText] = useState(
    WelcomeText[Math.floor(Math.random() * WelcomeText.length)]
  );

  return (
    <div style={{padding: '0px', maxWidth: '100%'}}>
      <p>{welcomeText}</p>
      <NavButtons />
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/students" element={<StudentsPage />} />
      <Route path="/calendar" element={<Calendar/>} />
      <Route path="/month" element={<Month />} />
      <Route path="*" element={<div>404 - Stránka neexistuje</div>} />
    </Routes>
  );
}

function AppWrapper() {
  return (
    <Router  basename="/miZUS2.0">
      <App />
    </Router>
  );
}

export default AppWrapper;
