import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const { user } = useAuth();
  return (
    <div className="flex-col items-center justify-center text-center mt-8 animate-fade" style={{minHeight: '60vh'}}>
      <h1 style={{fontSize: '3rem', marginBottom: '1.5rem'}}>
        EchoLayer
      </h1>
      <p style={{maxWidth: '600px', margin: '0 auto 2.5rem', fontSize: '1.125rem'}}>
        A premium engagement layer for your content. Reduce authentication friction 
        while maintaining accountability and an elegant presence.
      </p>
      {user ? (
        <Link to="/dashboard" className="btn btn-primary" style={{fontSize: '1.125rem', padding: '0.75rem 1.5rem'}}>
          Enter Dashboard
        </Link>
      ) : (
        <Link to="/login" className="btn btn-primary" style={{fontSize: '1.125rem', padding: '0.75rem 1.5rem'}}>
          Get Started
        </Link>
      )}
    </div>
  );
}
