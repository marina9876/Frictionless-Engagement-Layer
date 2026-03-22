import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Logo() {
  return (
    <svg width="24" height="24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="45" stroke="var(--primary-gold)" strokeWidth="3"/>
      <circle cx="50" cy="54" r="33" stroke="var(--primary-gold)" strokeWidth="4"/>
      <circle cx="50" cy="58" r="21" stroke="var(--primary-gold)" strokeWidth="5"/>
      <circle cx="50" cy="62" r="9" fill="var(--primary-gold)"/>
    </svg>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <Logo />
        <span>EchoLayer</span>
      </Link>
      <div className="nav-links">
        {user ? (
          <>
            <Link to="/dashboard" className="btn">Dashboard</Link>
            <Link to="/create" className="btn">Create Post</Link>
            <button onClick={logout} className="btn">Logout</button>
          </>
        ) : (
          <Link to="/login" className="btn">Login</Link>
        )}
      </div>
    </nav>
  );
}
