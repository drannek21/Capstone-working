import React, { useState, useEffect } from 'react';
import './ForumRoom.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faThumbsUp, faComment, faTimes } from '@fortawesome/free-solid-svg-icons';
import defaultAvatar from '../assets/avatar.jpg';

const ForumRoom = () => {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState({ title: '', content: '' });
  const [comments, setComments] = useState({});
  const [newComments, setNewComments] = useState({});
  const [currentUser, setCurrentUser] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [expandedComments, setExpandedComments] = useState({});

  const loggedInUserId = localStorage.getItem("UserId");
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081';

  // Fetch user data
  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!loggedInUserId) {
        console.log("No logged-in user found");
        setCurrentUser({ id: 'guest', name: 'Anonymous', profilePic: defaultAvatar });
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/getUserDetails`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: loggedInUserId }),
        });

        const data = await response.json();

        if (response.ok) {
          setCurrentUser({
            id: loggedInUserId,
            name: data.first_name && data.last_name 
              ? `${data.first_name} ${data.last_name}` 
              : data.name || 'Anonymous',
            profilePic: data.profilePic || defaultAvatar
          });
        } else {
          console.error("Error fetching user data:", data.message);
          setCurrentUser({ id: loggedInUserId, name: 'Anonymous', profilePic: defaultAvatar });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setCurrentUser({ id: loggedInUserId, name: 'Anonymous', profilePic: defaultAvatar });
      }
    };

    fetchUserDetails();
  }, [loggedInUserId, API_BASE_URL]);

  // Fetch posts
  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE_URL}/api/forum/posts`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch posts');
        }
        return response.json();
      })
      .then(data => {
        console.log('Posts data:', data);
        setPosts(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching posts:', error);
        // Use mock data as fallback
        const mockPosts = [
          {
            id: 1,
            title: 'Welcome to our Forum!',
            content: 'This is a place to discuss topics related to our platform.',
            author: 'Admin',
            profilePic: defaultAvatar,
            created_at: '2025-04-25',
            likes: 15
          },
          {
            id: 2,
            title: 'Tips for New Users',
            content: 'Here are some helpful tips to get started with our platform...',
            author: 'Moderator',
            profilePic: defaultAvatar,
            created_at: '2025-04-24',
            likes: 8
          },
          {
            id: 3,
            title: 'Introducing New Features',
            content: 'We have added several new features to enhance your experience.',
            author: 'Developer',
            profilePic: defaultAvatar,
            created_at: '2025-04-23',
            likes: 12
          }
        ];
        setPosts(mockPosts);
        setLoading(false);
      });
  }, [API_BASE_URL]);

  // Fetch comments for each post
  useEffect(() => {
    if (posts.length > 0) {
      const fetchComments = async () => {
        const commentsObj = {};
        
        for (const post of posts) {
          try {
            const response = await fetch(`${API_BASE_URL}/api/forum/posts/${post.id}/comments`);
            if (!response.ok) {
              throw new Error(`Failed to fetch comments for post ${post.id}`);
            }
            const data = await response.json();
            commentsObj[post.id] = data.map(comment => ({ ...comment, profilePic: comment.authorProfilePic }));
          } catch (error) {
            console.error(`Error fetching comments for post ${post.id}:`, error);
            // Use mock comments as fallback
            if (post.id === 1) {
              commentsObj[post.id] = [
                { id: 1, author: 'User1', authorProfilePic: defaultAvatar, content: 'Great to be here!', created_at: '2025-04-25' },
                { id: 2, author: 'User2', authorProfilePic: defaultAvatar, content: 'Looking forward to the discussions.', created_at: '2025-04-26' }
              ];
            } else if (post.id === 2) {
              commentsObj[post.id] = [
                { id: 1, author: 'User3', authorProfilePic: defaultAvatar, content: 'These tips are really helpful!', created_at: '2025-04-24' }
              ];
            } else {
              commentsObj[post.id] = [];
            }
          }
        }
        
        setComments(commentsObj);
      };
      
      fetchComments();
    }
  }, [posts, API_BASE_URL]);

  const handlePostChange = (e) => {
    const { name, value } = e.target;
    setNewPost(prev => ({ ...prev, [name]: value }));
  };

  const handleCommentChange = (postId, value) => {
    setNewComments(prev => ({ ...prev, [postId]: value }));
  };

  const submitPost = async (e) => {
    e.preventDefault();
    
    if (!newPost.title || !newPost.content) {
      return;
    }
    
    try {
      // Create a new post directly in the UI first for immediate feedback
      const tempPost = {
        id: `temp-${Date.now()}`,
        title: newPost.title,
        content: newPost.content,
        author: currentUser.name,
        authorProfilePic: currentUser.profilePic || defaultAvatar,
        created_at: new Date().toISOString(),
        likes: 0
      };
      
      // Add the temporary post to the UI
      setPosts(prevPosts => [tempPost, ...prevPosts]);
      
      // Clear the form and close the modal
      setNewPost({ title: '', content: '' });
      setShowCreatePost(false);
      
      // Send the post to the server
      const response = await fetch(`${API_BASE_URL}/api/forum/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newPost.title,
          content: newPost.content,
          userId: currentUser.id,
          author: currentUser.name,
          authorProfilePic: currentUser.profilePic || defaultAvatar
        }),
      });
      
      if (!response.ok) {
        console.error('Server returned error:', await response.text());
        throw new Error('Failed to create post');
      }
      
      const createdPost = await response.json();
      
      // Replace the temporary post with the real one from the server
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === tempPost.id ? createdPost : post
        )
      );
    } catch (error) {
      console.error('Error creating post:', error);
      // The temporary post is already in the UI, so no need to add a mock post
    }
  };

  const submitComment = async (postId) => {
    if (!newComments[postId]) return;
    
    try {
      // Create a temporary comment for immediate UI feedback
      const tempComment = {
        id: `temp-${Date.now()}`,
        content: newComments[postId],
        author: currentUser.name,
        authorProfilePic: currentUser.profilePic || defaultAvatar,
        created_at: new Date().toISOString()
      };
      
      // Add the temporary comment to the UI
      setComments(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), tempComment]
      }));
      
      // Clear the comment input
      setNewComments(prev => ({ ...prev, [postId]: '' }));
      
      // Send the comment to the server
      const response = await fetch(`${API_BASE_URL}/api/forum/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComments[postId],
          userId: currentUser.id,
          author: currentUser.name,
          authorProfilePic: currentUser.profilePic || defaultAvatar,
          postId: postId
        }),
      });
      
      if (!response.ok) {
        console.error('Server returned error:', await response.text());
        throw new Error('Failed to add comment');
      }
      
      const createdComment = await response.json();
      
      // Replace the temporary comment with the real one from the server
      setComments(prev => ({
        ...prev,
        [postId]: prev[postId].map(comment => 
          comment.id === tempComment.id ? createdComment : comment
        )
      }));
    } catch (error) {
      console.error('Error adding comment:', error);
      // The temporary comment is already in the UI, so no need to add a mock comment
    }
  };

  const likePost = async (postId) => {
    try {
      // Update likes locally for immediate UI feedback
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId ? { ...post, likes: (post.likes || 0) + 1 } : post
        )
      );
      
      // Send the like to the server
      const response = await fetch(`${API_BASE_URL}/api/forum/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser.id
        }),
      });
      
      if (!response.ok) {
        console.error('Server returned error:', await response.text());
        throw new Error('Failed to like post');
      }
      
      const updatedPost = await response.json();
      
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId ? updatedPost : post
        )
      );
    } catch (error) {
      console.error('Error liking post:', error);
      // The like is already reflected in the UI, so no need for additional fallback
    }
  };

  const toggleComments = (postId) => {
    setExpandedComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const closeModal = () => {
    setShowCreatePost(false);
  };

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('forum-room-modal-overlay')) {
      closeModal();
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) return <div className="forum-room-loading">Loading forum...</div>;
  if (error) return <div className="forum-room-error">Error: {error}</div>;

  return (
    <div className="forum-room-container">
      <h1 className="forum-room-title">Community Forum</h1>
      
      <div className="forum-room-posts-section">
        <div className="forum-room-header">
          <h2>Recent Posts</h2>
          <button 
            className="forum-room-create-btn"
            onClick={() => setShowCreatePost(true)}
            aria-label="Create new post"
          >
            <span className="forum-room-btn-icon">+</span>
            <span>Create Post</span>
          </button>
        </div>
        
        {posts.length === 0 ? (
          <p className="forum-room-no-posts">No posts yet. Be the first to post!</p>
        ) : (
          <div className="forum-room-posts-list">
            {posts.map(post => (
              <div key={post.id} className="forum-room-post-card">
                <div className="forum-room-post-header">
                  <h3 className="forum-room-post-title">{post.title}</h3>
                  <div className="forum-room-post-meta">
                    <div className="forum-room-post-author">
                      <span>Posted by {post.author}</span>
                      <img 
                        src={post.profilePic || defaultAvatar} 
                        alt="Author" 
                        className="forum-room-author-image"
                        onError={(e) => e.target.src = defaultAvatar}
                      />
                    </div>
                    <span>{formatDate(post.created_at)}</span>
                  </div>
                </div>
                
                <div className="forum-room-post-content">{post.content}</div>
                
                <div className="forum-room-post-actions">
                  <button 
                    onClick={() => likePost(post.id)} 
                    className="forum-room-like-button"
                  >
                    <FontAwesomeIcon icon={faThumbsUp} /> {post.likes || 0}
                  </button>
                  
                  <button 
                    onClick={() => toggleComments(post.id)} 
                    className="forum-room-comments-toggle"
                  >
                    <FontAwesomeIcon icon={faComment} />
                    {expandedComments[post.id] ? ' Hide Comments' : ` Show Comments (${comments[post.id]?.length || 0})`}
                  </button>
                </div>

                {expandedComments[post.id] && (
                  <div className="forum-room-comments-section">
                    <div className="forum-room-add-comment">
                      <textarea
                        placeholder="Write a comment..."
                        value={newComments[post.id] || ''}
                        onChange={(e) => handleCommentChange(post.id, e.target.value)}
                        className="forum-room-comment-textarea"
                      />
                      <button 
                        onClick={() => submitComment(post.id)}
                        className="forum-room-comment-submit-btn"
                        disabled={!newComments[post.id]}
                      >
                        Add Comment
                      </button>
                    </div>

                    <div className="forum-room-comments-list">
                      {comments[post.id]?.length > 0 ? (
                        comments[post.id].map(comment => (
                          <div key={comment.id} className="forum-room-comment-item">
                            <div className="forum-room-comment-header">
                              <div className="forum-room-comment-author">
                                <img 
                                  src={comment.profilePic || defaultAvatar} 
                                  alt="Author" 
                                  className="forum-room-comment-author-image"
                                  onError={(e) => e.target.src = defaultAvatar}
                                />
                                <span>{comment.author}</span>
                              </div>
                              <span className="forum-room-comment-date">{formatDate(comment.created_at)}</span>
                            </div>
                            <div className="forum-room-comment-content">{comment.content}</div>
                          </div>
                        ))
                      ) : (
                        <p className="forum-room-no-comments">No comments yet.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {showCreatePost && (
        <div className="forum-room-modal-overlay" onClick={handleOverlayClick}>
          <div className="forum-room-modal">
            <div className="forum-room-modal-header">
              <h2>Create a New Post</h2>
              <button 
                className="forum-room-modal-close" 
                onClick={closeModal}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="forum-room-post-author-info">
              <img 
                src={currentUser.profilePic || defaultAvatar} 
                alt="Your Profile" 
                className="forum-room-author-image"
                onError={(e) => e.target.src = defaultAvatar}
              />
              <span>Posting as <strong>{currentUser.name}</strong></span>
            </div>
            <form onSubmit={submitPost} className="forum-room-post-form">
              <input
                type="text"
                name="title"
                placeholder="Post Title"
                value={newPost.title}
                onChange={handlePostChange}
                className="forum-room-post-input"
                required
              />
              <textarea
                name="content"
                placeholder="Write your post here..."
                value={newPost.content}
                onChange={handlePostChange}
                className="forum-room-post-textarea"
                required
              />
              <div className="forum-room-modal-footer">
                <button 
                  type="button" 
                  className="forum-room-cancel-btn"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="forum-room-post-submit-btn"
                >
                  Submit Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForumRoom;
