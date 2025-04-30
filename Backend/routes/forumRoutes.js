const express = require('express');
const router = express.Router();
const { pool, queryDatabase } = require('../database');

// Get all posts
router.get('/posts', async (req, res) => {
  try {
    // Get posts with status Verified or if no status, treat as Verified (for backward compatibility)
    const posts = await queryDatabase(`
      SELECT p.*, 
             COUNT(DISTINCT l.id) as likes,
             GROUP_CONCAT(DISTINCT l.user_id) as liked_by_users,
             u.profilePic
      FROM forum_posts p
      LEFT JOIN forum_likes l ON p.id = l.post_id
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.status = 'Verified' OR p.status IS NULL
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `);
    
    // Format the liked_by_users field for each post
    posts.forEach(post => {
      post.liked_by_users = post.liked_by_users ? post.liked_by_users.split(',') : [];
      
      // Ensure profilePic is properly set
      if (!post.profilePic) {
        console.log(`No profile pic for post ${post.id}, author: ${post.author}`);
      } else {
        console.log(`Profile pic found for post ${post.id}: ${post.profilePic}`);
      }
    });
    
    console.log(`Returning ${posts.length} posts`);
    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific post
router.get('/posts/:id', async (req, res) => {
  try {
    const [post] = await queryDatabase(`
      SELECT p.*, 
             COUNT(DISTINCT l.id) as likes,
             GROUP_CONCAT(DISTINCT l.user_id) as liked_by_users,
             u.profilePic
      FROM forum_posts p
      LEFT JOIN forum_likes l ON p.id = l.post_id
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.id = ? AND (p.status = 'Verified' OR p.status IS NULL)
      GROUP BY p.id
    `, [req.params.id]);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Format the liked_by_users field
    post.liked_by_users = post.liked_by_users ? post.liked_by_users.split(',') : [];
    
    res.json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new post
router.post('/posts', async (req, res) => {
  try {
    const { title, content, author, user_id } = req.body;
    
    const result = await queryDatabase(
      'INSERT INTO forum_posts (title, content, author, user_id, status) VALUES (?, ?, ?, ?, ?)',
      [title, content, author, user_id, 'Pending']
    );
    
    const newPost = await queryDatabase(
      'SELECT * FROM forum_posts WHERE id = ?',
      [result.insertId]
    );
    
    res.status(201).json({
      success: true,
      message: 'Post created successfully. Waiting for admin approval.',
      post: newPost[0]
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ success: false, error: 'Failed to create post' });
  }
});

// Like a post
router.post('/posts/:id/like', async (req, res) => {
  try {
    const { userId } = req.body;
    const postId = req.params.id;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    // Check if the post exists
    const [post] = await queryDatabase(`
      SELECT * FROM forum_posts WHERE id = ? AND (status = 'Verified' OR status IS NULL)
    `, [postId]);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Check if user already liked the post
    const [existingLike] = await queryDatabase(`
      SELECT * FROM forum_likes WHERE post_id = ? AND user_id = ?
    `, [postId, userId]);
    
    if (existingLike) {
      // Unlike the post
      await queryDatabase(`
        DELETE FROM forum_likes WHERE post_id = ? AND user_id = ?
      `, [postId, userId]);
    } else {
      // Like the post
      await queryDatabase(`
        INSERT INTO forum_likes (post_id, user_id, created_at)
        VALUES (?, ?, NOW())
      `, [postId, userId]);
    }
    
    // Get updated post with likes count
    const [updatedPost] = await queryDatabase(`
      SELECT p.*, 
             COUNT(DISTINCT l.id) as likes,
             GROUP_CONCAT(DISTINCT l.user_id) as liked_by_users,
             u.profilePic
      FROM forum_posts p
      LEFT JOIN forum_likes l ON p.id = l.post_id
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.id = ? AND (p.status = 'Verified' OR p.status IS NULL)
      GROUP BY p.id
    `, [postId]);
    
    // Format the liked_by_users field
    updatedPost.liked_by_users = updatedPost.liked_by_users ? updatedPost.liked_by_users.split(',') : [];
    
    res.json(updatedPost);
  } catch (error) {
    console.error('Error liking post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get comments for a post
router.get('/posts/:id/comments', async (req, res) => {
  try {
    const postId = req.params.id;
    console.log(`Fetching comments for post ${postId}`);
    
    // Check if the post ID is a temporary ID (client-side generated)
    if (postId.toString().startsWith('temp-')) {
      console.log(`Temporary post ID detected: ${postId}`);
      return res.status(404).json({ 
        message: 'Cannot fetch comments for temporary posts' 
      });
    }
    
    // First check if the post exists and is accessible
    const [post] = await queryDatabase(`
      SELECT * FROM forum_posts WHERE id = ?
    `, [postId]);
    
    if (!post) {
      console.log(`Post not found: ${postId}`);
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // For admin endpoints, we'll allow viewing comments on any post regardless of status
    // For regular users, only show comments on verified posts
    const isAdminRequest = req.path.includes('/admin/');
    if (!isAdminRequest && post.status !== 'Verified' && post.status !== null) {
      console.log(`Post ${postId} has status ${post.status}, not accessible to regular users`);
      return res.status(403).json({ message: 'Post is not accessible' });
    }
    
    const comments = await queryDatabase(`
      SELECT c.*, u.profilePic as authorProfilePic
      FROM forum_comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
    `, [postId]);
    
    // Log comment data for debugging
    console.log(`Returning ${comments.length} comments for post ${postId}`);
    
    // Always return the comments array, even if empty
    res.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a comment to a post
router.post('/posts/:id/comments', async (req, res) => {
  try {
    const { content, userId, author } = req.body;
    const postId = req.params.id;
    
    if (!content || !userId || !postId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    const [post] = await queryDatabase(`
      SELECT * FROM forum_posts WHERE id = ? AND (status = 'Verified' OR status IS NULL)
    `, [postId]);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    const result = await queryDatabase(`
      INSERT INTO forum_comments (content, author, user_id, post_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, NOW(), NOW())
    `, [content, author, userId, postId]);
    
    // Get the new comment with user profile image
    const [newComment] = await queryDatabase(`
      SELECT c.*, u.profilePic as authorProfilePic
      FROM forum_comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `, [result.insertId]);
    
    res.status(201).json(newComment);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a post (only by the author)
router.delete('/posts/:id', async (req, res) => {
  try {
    const { userId } = req.body;
    const postId = req.params.id;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    // Check if the post exists and if the user is the author
    const [post] = await queryDatabase(`
      SELECT * FROM forum_posts WHERE id = ? AND user_id = ?
    `, [postId, userId]);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found or you are not authorized to delete it' });
    }
    
    // Start a transaction
    await queryDatabase('START TRANSACTION');
    
    try {
      // Delete all comments for the post
      await queryDatabase(`
        DELETE FROM forum_comments WHERE post_id = ?
      `, [postId]);
      
      // Delete all likes for the post
      await queryDatabase(`
        DELETE FROM forum_likes WHERE post_id = ?
      `, [postId]);
      
      // Delete the post
      await queryDatabase(`
        DELETE FROM forum_posts WHERE id = ?
      `, [postId]);
      
      // Commit the transaction
      await queryDatabase('COMMIT');
      
      res.json({ message: 'Post and related data deleted successfully' });
    } catch (error) {
      // Rollback the transaction in case of error
      await queryDatabase('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update post status
router.put('/posts/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Validate status input
    const validStatuses = ['Pending', 'Verified', 'Declined', 'Deleted'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    
    // Update post status
    await queryDatabase(
      `UPDATE forum_posts SET status = ? WHERE id = ?`,
      [status, id]
    );
    
    // Return updated post
    const [updatedPost] = await queryDatabase(
      `SELECT * FROM forum_posts WHERE id = ?`,
      [id]
    );
    
    res.json(updatedPost);
  } catch (error) {
    console.error('Error updating post status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin endpoint to get all posts including pending ones
router.get('/admin/posts', async (req, res) => {
  try {
    const posts = await queryDatabase(`
      SELECT p.*, 
             COUNT(DISTINCT l.id) as likes,
             GROUP_CONCAT(DISTINCT l.user_id) as liked_by_users,
             u.profilePic
      FROM forum_posts p
      LEFT JOIN forum_likes l ON p.id = l.post_id
      LEFT JOIN users u ON p.user_id = u.id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `);
    
    // Format the liked_by_users field for each post
    posts.forEach(post => {
      post.liked_by_users = post.liked_by_users ? post.liked_by_users.split(',') : [];
    });
    
    res.json(posts);
  } catch (error) {
    console.error('Error fetching admin posts:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin endpoint to get comments for a post (regardless of post status)
router.get('/admin/posts/:id/comments', async (req, res) => {
  try {
    const postId = req.params.id;
    console.log(`Admin fetching comments for post ${postId}`);
    
    // Check if the post ID is a temporary ID
    if (postId.toString().startsWith('temp-')) {
      console.log(`Temporary post ID detected: ${postId}`);
      return res.status(404).json({ 
        message: 'Cannot fetch comments for temporary posts' 
      });
    }
    
    // First check if the post exists
    const [post] = await queryDatabase(`
      SELECT * FROM forum_posts WHERE id = ?
    `, [postId]);
    
    if (!post) {
      console.log(`Post not found: ${postId}`);
      return res.status(404).json({ message: 'Post not found' });
    }
    
    const comments = await queryDatabase(`
      SELECT c.*, u.profilePic as authorProfilePic
      FROM forum_comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
    `, [postId]);
    
    console.log(`Admin: Returning ${comments.length} comments for post ${postId}`);
    
    // Always return the comments array, even if empty
    res.json(comments);
  } catch (error) {
    console.error('Error fetching admin comments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
