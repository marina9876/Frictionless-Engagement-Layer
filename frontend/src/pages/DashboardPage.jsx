import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, MessageSquare, ExternalLink } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    const fetchPosts = async () => {
      const q = query(collection(db, 'posts'), where("creatorId", "==", user.uid));
      const snap = await getDocs(q);
      const fetched = snap.docs.map(d => ({ postId: d.id, ...d.data() }));
      fetched.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setPosts(fetched);
      setLoading(false);
    };

    fetchPosts();
  }, [user, navigate]);

  const toggleModeration = async (postId, currentVal) => {
    const newVal = !currentVal;
    await updateDoc(doc(db, 'posts', postId), { moderationEnabled: newVal });
    setPosts(posts.map(p => p.postId === postId ? { ...p, moderationEnabled: newVal } : p));
  };

  const deletePost = async (postId) => {
    if (!window.confirm("Are you sure? This will delete the post. Comments and reactions will be orphaned but inaccessible.")) return;
    await deleteDoc(doc(db, 'posts', postId));
    setPosts(posts.filter(p => p.postId !== postId));
  };

  if (loading) return <div className="text-center mt-8">Loading posts...</div>;

  return (
    <div className="container animate-fade">
      <div className="flex justify-between items-center mb-8">
        <h2>Your Posts</h2>
      </div>

      {posts.length === 0 ? (
        <div className="card text-center">
          <p className="mb-4">No engagement pages created yet.</p>
          <Link to="/create" className="btn btn-primary">Create Your First Post</Link>
        </div>
      ) : (
        posts.map(post => (
          <PostDashboardItem 
            key={post.postId} 
            post={post} 
            onToggleMod={() => toggleModeration(post.postId, post.moderationEnabled)}
            onDelete={() => deletePost(post.postId)}
          />
        ))
      )}
    </div>
  );
}

function PostDashboardItem({ post, onToggleMod, onDelete }) {
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(false);
  
  const fetchComments = async () => {
    if (showComments) {
      setShowComments(false);
      return;
    }
    const q = query(collection(db, 'comments'), where("postId", "==", post.postId));
    const snap = await getDocs(q);
    const cmts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    cmts.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    setComments(cmts);
    setShowComments(true);
  };

  const updateCommentStatus = async (id, newStatus) => {
    await updateDoc(doc(db, 'comments', id), { status: newStatus });
    setComments(comments.map(c => c.id === id ? { ...c, status: newStatus } : c));
  };

  const deleteComment = async (id) => {
    await deleteDoc(doc(db, 'comments', id));
    setComments(comments.filter(c => c.id !== id));
  };

  return (
    <div className="card mb-6 animate-fade">
      <div className="flex justify-between card-header-stack" style={{flexWrap: 'wrap', gap: '1rem'}}>
        <div style={{ wordBreak: 'break-all', maxWidth: '100%' }}>
          <h3 className="text-gold" style={{marginBottom: '0.25rem', fontSize: '1.125rem'}}>
            <a href={post.originalUrl} target="_blank" rel="noreferrer" style={{color: 'inherit', textDecoration: 'none'}}>
              {post.originalUrl}
            </a>
          </h3>
          <span style={{fontSize: '0.875rem', color: 'var(--text-grey)'}}>
            Share link: <a href={`${window.location.origin}/p/${post.postId}`} target="_blank" rel="noreferrer" className="share-link">
              {window.location.origin}/p/{post.postId}
            </a>
          </span>
        </div>
        <div className="flex gap-2 dashboard-actions">
          <Link to={`/p/${post.postId}`} className="btn">
            <ExternalLink size={16} /> View Post
          </Link>
          <button className="btn" onClick={fetchComments}>
            <MessageSquare size={16} /> Moderation
          </button>
          <button className="btn btn-danger" onClick={onDelete}>
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </div>

      <div className="mt-4 pt-4 flex items-center" style={{borderTop: '1px solid var(--divider)'}}>
        <input 
          type="checkbox" 
          className="toggle-checkbox" 
          checked={post.moderationEnabled} 
          onChange={onToggleMod} 
          style={{display: 'none'}} 
          id={`mod-${post.postId}`}
        />
        <label htmlFor={`mod-${post.postId}`} className="toggle-wrapper">
          <div className="toggle-switch"></div>
          <span style={{fontSize: '0.875rem'}}>Require approval for new comments</span>
        </label>
      </div>

      {showComments && (
        <div className="mt-6">
          <h4 style={{marginBottom: '1rem'}}>Comments Control</h4>
          {comments.length === 0 && <p className="text-muted">No comments yet.</p>}
          <div className="flex-col gap-4">
            {comments.map(c => (
              <div key={c.id} className="card" style={{padding: '16px', background: 'rgba(0,0,0,0.2)'}}>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <strong className="text-gold">{c.commenterName}</strong>
                    <span className="text-muted" style={{fontSize: '0.875rem'}}>({c.commenterEmail})</span>
                  </div>
                  <span className={`status-badge status-${c.status}`}>
                    {c.status.toUpperCase()}
                  </span>
                </div>
                <p style={{color: 'var(--text-light)', whiteSpace: 'pre-wrap', marginBottom: '1rem'}}>{c.content}</p>
                <div className="flex gap-2 mt-2">
                  {c.status === 'pending' && (
                     <button className="btn btn-primary" onClick={() => updateCommentStatus(c.id, 'published')}>
                       Approve
                     </button>
                  )}
                  {c.status === 'published' && (
                     <button className="btn" onClick={() => updateCommentStatus(c.id, 'pending')}>
                       Revoke
                     </button>
                  )}
                  <button className="btn btn-danger" onClick={() => deleteComment(c.id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
