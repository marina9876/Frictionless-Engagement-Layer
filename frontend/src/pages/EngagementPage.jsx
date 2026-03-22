import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc, addDoc, onSnapshot } from 'firebase/firestore';
import { ExternalLink, MessageSquare } from 'lucide-react';

const REACTION_TYPES = [
  { id: 'like', icon: '👍', label: 'Like' },
  { id: 'love', icon: '❤️', label: 'Love' },
  { id: 'fire', icon: '🔥', label: 'Fire' },
  { id: 'clap', icon: '👏', label: 'Clap' }
];

export default function EngagementPage() {
  const { postId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reactions, setReactions] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const getAnonId = () => {
    let id = localStorage.getItem('anon_user_id');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('anon_user_id', id);
    }
    return id;
  };
  const anonUserId = getAnonId();

  useEffect(() => {
    const fetchPost = async () => {
      const pRef = doc(db, 'posts', postId);
      const pSnap = await getDoc(pRef);
      if (pSnap.exists()) {
        setPost({ id: pSnap.id, ...pSnap.data() });
      }
      setLoading(false);
    };
    fetchPost();
  }, [postId]);

  useEffect(() => {
    if (!postId) return;
    const q = query(collection(db, 'reactions'), where('postId', '==', postId));
    const unsub = onSnapshot(q, (snap) => {
      setReactions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [postId]);

  useEffect(() => {
    if (!postId) return;
    const q = query(collection(db, 'comments'), where('postId', '==', postId), where('status', '==', 'published'));
    const unsub = onSnapshot(q, (snap) => {
      const c = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      c.sort((a,b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setComments(c);
    });
    return unsub;
  }, [postId]);

  useEffect(() => {
    if (user && !displayName && user.displayName) {
      setDisplayName(user.displayName);
    }
  }, [user, displayName]);

  const handleReact = async (rType) => {
    const q = query(
      collection(db, 'reactions'), 
      where('postId', '==', postId), 
      where('anonUserId', '==', anonUserId)
    );
    const snap = await getDocs(q);
    
    if (!snap.empty) {
      setErrorMsg("You've already reacted to this composition.");
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }
    
    await addDoc(collection(db, 'reactions'), {
      postId,
      anonUserId,
      reactionType: rType,
      createdAt: new Date().toISOString()
    });
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
      return;
    }
    if (!newComment.trim()) return;
    
    setSubmittingComment(true);
    setErrorMsg('');
    try {
      const status = post.moderationEnabled ? 'pending' : 'published';
      await addDoc(collection(db, 'comments'), {
        postId,
        commenterEmail: user.email,
        commenterName: displayName || user.email.split('@')[0],
        content: newComment,
        status: status,
        createdAt: new Date().toISOString()
      });
      setNewComment('');
      if (status === 'pending') {
        setErrorMsg("Your comment is submitted and pending creator approval.");
        setTimeout(() => setErrorMsg(''), 4000);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to submit comment. Please ensure your connection is active and you are logged in.");
      setTimeout(() => setErrorMsg(''), 4000);
    }
    setSubmittingComment(false);
  };

  if (loading) return <div className="text-center mt-8">Loading...</div>;
  if (!post) return <div className="text-center mt-8 text-muted">Post not found.</div>;

  const reactionCounts = {};
  REACTION_TYPES.forEach(rt => reactionCounts[rt.id] = 0);
  reactions.forEach(r => {
    if (reactionCounts[r.reactionType] !== undefined) {
      reactionCounts[r.reactionType]++;
    }
  });

  const hasReactedType = reactions.find(r => r.anonUserId === anonUserId)?.reactionType;

  return (
    <div className="container-narrow animate-fade">
      <div className="text-center">
        <h1 style={{fontSize: '28px', color: 'var(--primary-gold)', marginBottom: '4px'}}>EchoLayer</h1>
        <p className="text-muted" style={{fontSize: '14px', marginBottom: '24px'}}>Join the conversation</p>
      </div>

      <div className="card items-center justify-center flex text-center">
        <a href={post.originalUrl} target="_blank" rel="noreferrer" className="target-link">
          {post.originalUrl} <ExternalLink size={14} />
        </a>
      </div>

      <div className="reactions-row">
        {REACTION_TYPES.map(rt => (
          <button 
            key={rt.id}
            className={`reaction-pill ${hasReactedType === rt.id ? 'active' : ''}`}
            onClick={() => handleReact(rt.id)}
            title={hasReactedType && hasReactedType !== rt.id ? "You already reacted" : ""}
          >
            <span style={{fontSize: '1.25rem'}}>{rt.icon}</span> 
            <span style={{fontWeight: '500'}}>{reactionCounts[rt.id]}</span>
          </button>
        ))}
      </div>

      {errorMsg && <div className="text-center mb-4" style={{color: 'var(--primary-gold)', fontSize: '0.875rem'}}>{errorMsg}</div>}
      <div className="divider" style={{marginTop: '0'}}></div>

      <div>
        <h3 style={{fontSize: '18px', color: 'var(--primary-gold)', marginBottom: '16px'}}>
          Comments
        </h3>
        
        <form onSubmit={handleCommentSubmit} className="card form-group mb-6">
          {user && (
            <div className="mb-2">
               <input 
                 type="text" 
                 className="form-input" 
                 value={displayName} 
                 onChange={e => setDisplayName(e.target.value)}
                 placeholder="Display Name (Optional)"
               />
            </div>
          )}
          <textarea 
            className="form-textarea mb-4" 
            placeholder="Share your thoughts..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <div className="flex justify-between items-center" style={{marginTop: '0.5rem'}}>
            <span className="text-muted" style={{fontSize: '0.875rem'}}>
              {user ? `Posting as ${user.email}` : 'Login with magic link to comment'}
            </span>
            <button type="submit" className="btn btn-primary" disabled={submittingComment || (user && !newComment.trim())}>
              {user ? (submittingComment ? 'Posting...' : 'Post') : 'Login'}
            </button>
          </div>
        </form>

        <div className="flex-col gap-4">
          {comments.length === 0 ? (
             <p className="text-muted text-center pt-8 pb-8">No comments yet. Start the conversation!</p>
          ) : (
             comments.map(c => (
              <div key={c.id} className="card" style={{marginBottom: '0', padding: '16px'}}>
                <div className="flex justify-between items-end mb-2">
                  <strong className="text-gold">{c.commenterName}</strong>
                  <span className="text-muted" style={{fontSize: '0.75rem'}}>
                    {new Date(c.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p style={{color: 'var(--text-light)', whiteSpace: 'pre-wrap'}}>{c.content}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
