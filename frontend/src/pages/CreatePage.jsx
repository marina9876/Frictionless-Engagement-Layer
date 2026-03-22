import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

export default function CreatePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [modEnabled, setModEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const postId = crypto.randomUUID().slice(0, 13);
      const postRef = doc(db, 'posts', postId);
      await setDoc(postRef, {
        postId,
        creatorId: user.uid,
        originalUrl: url,
        moderationEnabled: modEnabled,
        createdAt: new Date().toISOString()
      });
      navigate(`/dashboard`);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to create the engagement page. Please double check your internet connection and verify that you have proper permissions.');
    }
    setLoading(false);
  };

  return (
    <div className="card animate-fade" style={{maxWidth: '480px', margin: '4rem auto'}}>
      <h2 style={{marginBottom: '1.5rem'}}>Create Engagement Page</h2>
      <form onSubmit={handleSubmit} className="form-group">
        <label className="form-label">External Content Link</label>
        <input 
          type="url" 
          className="form-input" 
          value={url} 
          onChange={(e) => setUrl(e.target.value)} 
          placeholder="https://example.com/..."
          required
        />
        
        <label className="flex items-center gap-2 mt-6 cursor-pointer text-muted" style={{fontSize: '0.875rem'}}>
          <input 
            type="checkbox" 
            className="custom-checkbox"
            checked={modEnabled} 
            onChange={(e) => setModEnabled(e.target.checked)} 
          />
          Enable Comment Moderation (Manual Approval)
        </label>
        
        <button type="submit" className="btn btn-primary mt-8" disabled={loading} style={{width: '100%', padding: '0.75rem'}}>
          {loading ? 'Creating...' : 'Generate Page'}
        </button>
        {errorMsg && <p className="text-center mt-4" style={{color: 'var(--danger-soft)', fontSize: '0.875rem'}}>{errorMsg}</p>}
      </form>
    </div>
  );
}
