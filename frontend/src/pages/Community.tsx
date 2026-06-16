import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { SkeletonLoader } from '../components/SkeletonLoader';
import './Community.css';

interface Comment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
}

interface Post {
  id: string;
  userId: string;
  userName: string;
  content: string;
  likes: string[]; // userIds
  comments: Comment[];
  badgeShared?: string;
  createdAt: string;
}

interface UserBadge {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export const Community: React.FC = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedBadge, setSelectedBadge] = useState('');
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);

  const fetchFeedAndBadges = async () => {
    setLoading(true);
    setError(null);
    try {
      const [feedRes, gameRes] = await Promise.all([
        apiRequest('/community/feed'),
        apiRequest('/gamification')
      ]);

      if (feedRes.success) setPosts(feedRes.data);
      if (gameRes.success) setUserBadges(gameRes.data.badges);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch community feed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedAndBadges();
  }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    setIsSubmittingPost(true);
    try {
      const res = await apiRequest('/community/feed', {
        method: 'POST',
        body: JSON.stringify({
          content: newPostContent,
          badgeShared: selectedBadge || undefined
        })
      });

      if (res.success) {
        setNewPostContent('');
        setSelectedBadge('');
        // Insert new post at top of list
        setPosts((prev) => [res.data, ...prev]);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create post');
    } finally {
      setIsSubmittingPost(false);
    }
  };

  const handleLikePost = async (postId: string) => {
    try {
      const res = await apiRequest(`/community/feed/${postId}/like`, {
        method: 'POST'
      });

      if (res.success) {
        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, likes: res.data.likes } : p))
        );
      }
    } catch (err: any) {
      console.error('Like toggle failed', err);
    }
  };

  const handleCommentChange = (postId: string, val: string) => {
    setCommentInputs((prev) => ({ ...prev, [postId]: val }));
  };

  const handleAddComment = async (postId: string, e: React.FormEvent) => {
    e.preventDefault();
    const commentText = commentInputs[postId] || '';
    if (!commentText.trim()) return;

    try {
      const res = await apiRequest(`/community/feed/${postId}/comment`, {
        method: 'POST',
        body: JSON.stringify({ content: commentText })
      });

      if (res.success) {
        // Clear comment box
        setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
        // Add comment locally
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, comments: [...p.comments, res.data] } : p
          )
        );
      }
    } catch (err: any) {
      alert(err.message || 'Failed to submit comment');
    }
  };

  const toggleCommentsExpansion = (postId: string) => {
    setActiveCommentsPostId((prev) => (prev === postId ? null : postId));
  };

  if (loading) {
    return (
      <main className="container" id="main-content">
        <div style={{ padding: '2rem 0' }}>
          <SkeletonLoader type="text" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginTop: '2rem' }}>
            <SkeletonLoader type="list" />
            <SkeletonLoader type="card" />
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="container" id="main-content" role="alert">
        <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', border: '1px solid var(--danger-color)' }}>
          <h2>Failed to load Community Feed</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '1rem 0' }}>{error}</p>
          <button className="btn btn-primary" onClick={fetchFeedAndBadges}>Try Again</button>
        </div>
      </main>
    );
  }

  return (
    <main className="container" id="main-content">
      <div className="community-header">
        <h1 className="community-title">Sustainability Community</h1>
        <p className="community-subtitle">
          Connect with other environmental advocates, share your badge achievements, and discuss sustainable habits.
        </p>
      </div>

      <div className="community-layout">
        {/* Post Composition Card */}
        <section className="glass-card post-compose-card" aria-label="Write a community post">
          <form onSubmit={handleCreatePost}>
            <div className="form-group">
              <label htmlFor="post-content" className="screen-reader-only">Write your thoughts or achievements</label>
              <textarea
                id="post-content"
                className="form-input compose-textarea"
                rows={3}
                placeholder="What green choices did you make today? Share updates or achievements..."
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                required
              ></textarea>
            </div>

            <div className="compose-options">
              {/* Badge attacher selector */}
              {userBadges.length > 0 && (
                <div className="badge-select-wrapper">
                  <label htmlFor="badge-attach-select" className="badge-select-label">Attach Earned Badge:</label>
                  <select
                    id="badge-attach-select"
                    className="form-input badge-select-control"
                    value={selectedBadge}
                    onChange={(e) => setSelectedBadge(e.target.value)}
                  >
                    <option value="">-- No badge attached --</option>
                    {userBadges.map((badge) => (
                      <option key={badge.id} value={badge.name}>
                        {badge.icon} {badge.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary post-btn"
                disabled={isSubmittingPost || !newPostContent.trim()}
              >
                {isSubmittingPost ? 'Posting...' : 'Publish Post'}
              </button>
            </div>
          </form>
        </section>

        {/* Community Feed posts list */}
        <section className="feed-posts-list" aria-label="Community feed activity stream">
          {posts.length === 0 ? (
            <div className="empty-feed-view glass-card">
              <span style={{ fontSize: '3rem', display: 'block', marginBottom: '0.5rem' }} role="img" aria-hidden="true">
                💬
              </span>
              <h3>No posts in feed yet</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Be the first one to share an update!</p>
            </div>
          ) : (
            posts.map((post) => {
              const hasLiked = user && post.likes.includes(user.id);
              const isCommentsActive = activeCommentsPostId === post.id;
              
              return (
                <article key={post.id} className="feed-post-card glass-card animate-fade-in">
                  {/* Author Header */}
                  <div className="post-author-row">
                    <div className="author-avatar-circle">
                      {post.userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="author-meta">
                      <h3 className="author-name">{post.userName}</h3>
                      <span className="post-date">
                        {new Date(post.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </div>
                  </div>

                  {/* Post Content */}
                  <div className="post-body-content">
                    <p className="post-text">{post.content}</p>
                    
                    {/* Render attached badge */}
                    {post.badgeShared && (
                      <div className="post-badge-callout" role="presentation">
                        <span className="post-badge-icon" role="img" aria-label="Award medal badge">🎖️</span>
                        <div>
                          <p className="post-badge-title">Shared Badge Achievement: "{post.badgeShared}"</p>
                          <p className="post-badge-desc">Unlocked for eco contribution accomplishments.</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Interactions (Like, Comment counts) */}
                  <div className="post-interactions-row">
                    <button
                      className={`interaction-btn like-btn ${hasLiked ? 'liked' : ''}`}
                      onClick={() => handleLikePost(post.id)}
                      aria-label={`${hasLiked ? 'Unlike' : 'Like'} post by ${post.userName}`}
                    >
                      <span className="inter-icon" role="img" aria-hidden="true">💚</span>
                      <span className="inter-count">{post.likes.length} Likes</span>
                    </button>

                    <button
                      className={`interaction-btn comment-toggle-btn ${isCommentsActive ? 'active' : ''}`}
                      onClick={() => toggleCommentsExpansion(post.id)}
                      aria-expanded={isCommentsActive}
                      aria-label="Toggle comments panel"
                    >
                      <span className="inter-icon" role="img" aria-hidden="true">💬</span>
                      <span className="inter-count">{post.comments.length} Comments</span>
                    </button>
                  </div>

                  {/* Expandable Comments panel */}
                  {isCommentsActive && (
                    <div className="comments-panel-container">
                      {post.comments.length > 0 && (
                        <ul className="comments-list">
                          {post.comments.map((comment) => (
                            <li key={comment.id} className="comment-item">
                              <div className="comment-avatar-circle">
                                {comment.userName.charAt(0).toUpperCase()}
                              </div>
                              <div className="comment-content-box">
                                <div className="comment-header-row">
                                  <span className="comment-author">{comment.userName}</span>
                                  <span className="comment-date">
                                    {new Date(comment.createdAt).toLocaleDateString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                                  </span>
                                </div>
                                <p className="comment-text">{comment.content}</p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* Add comment form */}
                      <form onSubmit={(e) => handleAddComment(post.id, e)} className="comment-form-row">
                        <div className="form-group flex-grow">
                          <label htmlFor={`comment-input-${post.id}`} className="screen-reader-only">Write comment reply</label>
                          <input
                            id={`comment-input-${post.id}`}
                            type="text"
                            className="form-input comment-input-control"
                            placeholder="Write a reply..."
                            value={commentInputs[post.id] || ''}
                            onChange={(e) => handleCommentChange(post.id, e.target.value)}
                            required
                          />
                        </div>
                        <button
                          type="submit"
                          className="btn btn-secondary comment-submit-btn"
                          disabled={!(commentInputs[post.id] || '').trim()}
                        >
                          Reply
                        </button>
                      </form>
                    </div>
                  )}
                </article>
              );
            })
          )}
        </section>
      </div>
    </main>
  );
};
export default Community;
