import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ForumManagement.css';
import { FaTrash, FaEdit, FaEye, FaCheck, FaTimes, FaFilter, FaComment, FaUser, FaCalendarAlt, FaThumbsUp } from 'react-icons/fa';

const ForumManagement = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPost, setSelectedPost] = useState(null);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsError, setCommentsError] = useState(null);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      // Use environment variable for API URL with fallback
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8081';
      
      // Special admin endpoint to get ALL posts including pending ones
      const response = await axios.get(`${apiUrl}/api/forum/admin/posts`);
      
      if (response.data && Array.isArray(response.data)) {
        setPosts(response.data);
        console.log('Posts fetched:', response.data);
      } else {
        console.error('Invalid response format:', response.data);
        setError('Invalid response format from server');
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError(`Failed to fetch forum posts: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (postId) => {
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8081';
    try {
      setCommentsLoading(true);
      // First try admin endpoint
      const response = await axios.get(`${apiUrl}/api/forum/admin/posts/${postId}/comments`);
      setComments(response.data);
      setCommentsError(null);
    } catch (adminError) {
      try {
        // Fallback to regular endpoint
        const regularResponse = await axios.get(`${apiUrl}/api/forum/posts/${postId}/comments`);
        setComments(regularResponse.data);
        setCommentsError(null);
      } catch (error) {
        // If both fail, check if it's a 404 (no comments)
        if (error.response?.status === 404) {
          setComments([]);
          setCommentsError('This post has no comments yet');
        } else {
          setComments([]);
          setCommentsError('Error loading comments');
          console.error('Error fetching comments for post', postId, error);
        }
      }
    } finally {
      setCommentsLoading(false);
    }
  };

  const updatePostStatus = async (postId, status) => {
    try {
      setLoading(true);
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/forum/posts/${postId}/status`, 
        { status }
      );
      
      // Update local state with the returned post
      setPosts(posts.map(post => 
        post.id === postId ? { ...post, status: response.data.status } : post
      ));
      
      setSuccessMessage(`Post status updated to ${status}`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update post status');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const deletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    
    try {
      await axios.delete(`http://localhost:3001/api/forum/posts/${postId}`);
      setPosts(posts.filter(post => post.id !== postId));
      setSuccessMessage('Post has been deleted');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Failed to delete post');
      setTimeout(() => setError(''), 3000);
    }
  };

  const deleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    
    try {
      await axios.delete(`http://localhost:3001/api/forum/comments/${commentId}`);
      setComments(comments.filter(comment => comment.id !== commentId));
      setSuccessMessage('Comment has been deleted');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Failed to delete comment');
      setTimeout(() => setError(''), 3000);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getFilteredPosts = () => {
    if (statusFilter === 'all') return posts;
    return posts.filter(post => post.status === statusFilter);
  };

  const getStatusBadgeClass = (status) => {
    switch(status?.toLowerCase()) {
      case 'verified': return 'status-verified';
      case 'declined': return 'status-declined';
      case 'deleted': return 'status-deleted';
      case 'pending': return 'status-pending';
      default: return 'status-pending';
    }
  };

  const filteredPosts = posts.filter(post => {
    if (statusFilter === 'all') return true;
    return post.status === statusFilter;
  });

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Pending':
        return <span className="status-badge pending">Pending</span>;
      case 'Verified':
        return <span className="status-badge verified">Verified</span>;
      case 'Declined':
        return <span className="status-badge declined">Declined</span>;
      case 'Deleted':
        return <span className="status-badge deleted">Deleted</span>;
      default:
        return <span className="status-badge pending">Pending</span>;
    }
  };

  if (loading) return <div className="forum-management">Loading...</div>;

  return (
    <div className="forum-management">
      <h2>Forum Management</h2>
      
      {successMessage && <div className="success-message">{successMessage}</div>}
      {error && <div className="error-message">{error}</div>}
      
      <div className="filter-controls">
        <div className="status-filter">
          <label><FaFilter /> Filter by Status: </label>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Posts</option>
            <option value="Pending">Pending</option>
            <option value="Verified">Verified</option>
            <option value="Declined">Declined</option>
            <option value="Deleted">Deleted</option>
          </select>
        </div>
      </div>

      <div className="forum-stats">
        <div className="stat-box">
          <h3>Total Posts</h3>
          <p>{posts.filter(post => 
            post.status?.toLowerCase() === 'pending' || 
            post.status?.toLowerCase() === 'verified' || 
            post.status?.toLowerCase() === 'declined'
          ).length}</p>
        </div>
        <div className="stat-box">
          <h3>Pending Review</h3>
          <p>{posts.filter(post => post.status?.toLowerCase() === 'pending').length}</p>
        </div>
        <div className="stat-box">
          <h3>Verified Posts</h3>
          <p>{posts.filter(post => post.status?.toLowerCase() === 'verified').length}</p>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading posts...</div>
      ) : (
        <div className="posts-container">
          {filteredPosts.length === 0 ? (
            <div className="no-posts">No posts found</div>
          ) : (
            <table className="posts-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPosts.map(post => (
                  <tr key={post.id} className={`post-row ${post.status?.toLowerCase() || 'pending'}`}>
                    <td>{post.id}</td>
                    <td>{post.title}</td>
                    <td>{post.author}</td>
                    <td>{new Date(post.created_at).toLocaleDateString()}</td>
                    <td>{getStatusBadge(post.status)}</td>
                    <td className="actions">
                      <button 
                        className="action-button view-button" 
                        onClick={() => {
                          setSelectedPost(post);
                          setShowComments(true);
                          console.log(`Post ${post.id} status: ${post.status}`);
                          if (post.status === 'Verified' || post.status === 'Deleted') {
                            fetchComments(post.id);
                          } else {
                            // Clear any previous comments for non-verified posts
                            setComments([]);
                            setCommentsError(null);
                            setCommentsLoading(false);
                          }
                        }}
                        title="View Post Details"
                      >
                        <FaEye /> View
                      </button>
                      
                      {post.status === 'Pending' && (
                        <button 
                          className="action-button approve-button" 
                          onClick={() => updatePostStatus(post.id, 'Verified')}
                          title="Approve Post"
                        >
                          <FaCheck /> Approve
                        </button>
                      )}
                      
                      {post.status === 'Pending' && (
                        <button 
                          className="action-button decline-button" 
                          onClick={() => updatePostStatus(post.id, 'Declined')}
                          title="Decline Post"
                        >
                          <FaTimes /> Decline
                        </button>
                      )}
                      
                      {(post.status === 'Declined' || post.status === 'Verified') && (
                        <button 
                          className="action-button delete-button" 
                          onClick={() => updatePostStatus(post.id, 'Deleted')}
                          title="Delete Post"
                        >
                          <FaTrash /> Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {selectedPost && showComments && (
        <div className="post-modal-overlay">
          <div className="post-modal">
            <div className="post-modal-header">
              <h3>Post Details</h3>
              <button 
                className="post-modal-close" 
                onClick={() => {
                  setShowComments(false);
                  setSelectedPost(null);
                }}
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="post-modal-content">
              <div className="post-details">
                <h4 className="post-title">{selectedPost.title}</h4>
                
                <div className="post-meta">
                  <div className="post-meta-item">
                    <FaUser /> <span>{selectedPost.author}</span>
                  </div>
                  <div className="post-meta-item">
                    <FaCalendarAlt /> <span>{new Date(selectedPost.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="post-meta-item">
                    <FaThumbsUp /> <span>{selectedPost.likes || 0} likes</span>
                  </div>
                  <div className="post-meta-item">
                    <span>{getStatusBadge(selectedPost.status)}</span>
                  </div>
                </div>
                
                <div className="post-content">
                  {selectedPost.content}
                </div>
              </div>
              
              <div className="post-actions-container">
                {selectedPost.status === 'Pending' && (
                  <button 
                    className="action-button approve-button" 
                    onClick={() => {
                      updatePostStatus(selectedPost.id, 'Verified');
                      setShowComments(false);
                      setSelectedPost(null);
                    }}
                  >
                    <FaCheck /> Approve
                  </button>
                )}
                
                {selectedPost.status === 'Pending' && (
                  <button 
                    className="action-button decline-button" 
                    onClick={() => {
                      updatePostStatus(selectedPost.id, 'Declined');
                      setShowComments(false);
                      setSelectedPost(null);
                    }}
                  >
                    <FaTimes /> Decline
                  </button>
                )}
                
                {(selectedPost.status === 'Verified' || selectedPost.status === 'Declined') && (
                  <button 
                    className="action-button delete-button" 
                    onClick={() => {
                      updatePostStatus(selectedPost.id, 'Deleted');
                      setShowComments(false);
                      setSelectedPost(null);
                    }}
                  >
                    <FaTrash /> Delete
                  </button>
                )}
              </div>
              
              {(selectedPost.status === 'Verified' || selectedPost.status === 'Deleted') && (
                <div className="post-comments">
                  <h4>Comments</h4>
                  {commentsLoading ? (
                    <div className="loading">Loading comments...</div>
                  ) : (
                    <div className="comments-list">
                      {comments.length > 0 ? (
                        comments.map(comment => (
                          <div key={comment.id} className="comment">
                            <div className="comment-author">{comment.author}</div>
                            <div className="comment-content">{comment.content}</div>
                            <div className="comment-date">{new Date(comment.created_at).toLocaleString()}</div>
                          </div>
                        ))
                      ) : (
                        <div className="no-comments">{commentsError || 'No comments yet'}</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForumManagement;
