import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CreatePage from './pages/CreatePage';
import EngagementPage from './pages/EngagementPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <main className="container animate-fade-in">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/create" element={<CreatePage />} />
            <Route path="/p/:postId" element={<EngagementPage />} />
          </Routes>
        </main>
      </Router>
    </AuthProvider>
  );
}

export default App;
