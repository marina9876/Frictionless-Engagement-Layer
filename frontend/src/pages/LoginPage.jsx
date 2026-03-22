import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function LoginPage() {
  const { loginWithMagicLink, user } = useAuth();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(null); // 'loading', 'sent', 'error'
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  let redirect = searchParams.get('redirect');
  if (redirect) {
    if (!redirect.startsWith('http')) {
      redirect = `${window.location.origin}${redirect.startsWith('/') ? '' : '/'}${redirect}`;
    }
  } else {
    redirect = `${window.location.origin}/dashboard`;
  }

  useEffect(() => {
    if (user) {
      if (searchParams.get('redirect')) {
        window.location.href = searchParams.get('redirect');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, navigate, searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    try {
      await loginWithMagicLink(email, redirect);
      setStatus('sent');
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  };

  if (user) return null;

  return (
    <div className="card animate-fade" style={{maxWidth: '420px', margin: '6rem auto'}}>
      <h2 className="text-center" style={{marginBottom: '0.5rem'}}>Welcome Back</h2>
      <p className="text-center text-muted mb-6">Sign in using a passwordless link.</p>
      
      {status === 'sent' ? (
        <div className="text-center" style={{padding: '1rem', background: 'var(--gold-hover)', borderRadius: '8px', color: 'var(--primary-gold)'}}>
          Check your email ({email}) for the secure login link.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="form-group">
          <label className="form-label">Email Address</label>
          <input 
            type="email" 
            className="form-input" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@domain.com"
          />
          <button type="submit" className="btn btn-primary mt-6" disabled={status === 'loading'} style={{width: '100%', padding: '0.75rem'}}>
            {status === 'loading' ? 'Sending...' : 'Send Link'}
          </button>
          {status === 'error' && (
            <p className="text-center mt-4" style={{color: 'var(--danger-soft)'}}>
              Error sending email. Please try again.
            </p>
          )}
        </form>
      )}
    </div>
  );
}
