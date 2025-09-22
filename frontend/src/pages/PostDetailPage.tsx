import React, { useEffect, useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  IconButton,
  CircularProgress,
  Alert,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material'
import { ArrowBack, Edit, Delete, Comment, Send } from '@mui/icons-material'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '../store/store'
import { fetchPost, deletePost } from '../store/slices/postsSlice'

const PostDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()
  const { currentPost, isLoading, error } = useSelector((state: RootState) => state.posts)
  const { user } = useSelector((state: RootState) => state.auth)

  const [commentDialogOpen, setCommentDialogOpen] = useState(false)
  const [newComment, setNewComment] = useState('')

  useEffect(() => {
    if (id) {
      dispatch(fetchPost(parseInt(id)))
    }
  }, [id, dispatch])

  const handleDeletePost = async () => {
    if (currentPost && window.confirm('Are you sure you want to delete this post?')) {
      await dispatch(deletePost(currentPost.id))
      navigate('/posts')
    }
  }

  const handleAddComment = () => {
    // TODO: Implement comment functionality
    console.log('Add comment:', newComment)
    setNewComment('')
    setCommentDialogOpen(false)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/posts')}>
          Back to Posts
        </Button>
      </Box>
    )
  }

  if (!currentPost) {
    return (
      <Box>
        <Alert severity="warning" sx={{ mb: 3 }}>
          Post not found
        </Alert>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/posts')}>
          Back to Posts
        </Button>
      </Box>
    )
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate('/posts')} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" component="h1" flexGrow={1}>
          Post Details
        </Typography>
        {user?.id === currentPost.user_id && (
          <Box>
            <Button
              variant="outlined"
              startIcon={<Edit />}
              onClick={() => navigate(`/edit-post/${currentPost.id}`)}
              sx={{ mr: 2 }}
            >
              Edit
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<Delete />}
              onClick={handleDeletePost}
            >
              Delete
            </Button>
          </Box>
        )}
      </Box>

      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          {currentPost.title}
        </Typography>

        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <Chip
            label={`By: ${currentPost.author_name || 'Unknown'}`}
            color="primary"
            variant="outlined"
          />
          {currentPost.category_name && (
            <Chip label={currentPost.category_name} color="secondary" variant="outlined" />
          )}
          <Typography variant="body2" color="text.secondary">
            Published: {formatDate(currentPost.created_at)}
          </Typography>
          {currentPost.updated_at !== currentPost.created_at && (
            <Typography variant="body2" color="text.secondary">
              Updated: {formatDate(currentPost.updated_at)}
            </Typography>
          )}
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Typography variant="body1" sx={{ lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
          {currentPost.content}
        </Typography>

        <Divider sx={{ mt: 4, mb: 3 }} />

        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Comments</Typography>
          <Button
            variant="contained"
            startIcon={<Comment />}
            onClick={() => setCommentDialogOpen(true)}
          >
            Add Comment
          </Button>
        </Box>

        <Box mt={2}>
          <Typography variant="body2" color="text.secondary">
            Comments feature coming soon...
          </Typography>
        </Box>
      </Paper>

      {/* Comment Dialog */}
      <Dialog
        open={commentDialogOpen}
        onClose={() => setCommentDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Comment</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Your comment"
            multiline
            rows={4}
            fullWidth
            variant="outlined"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCommentDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAddComment}
            variant="contained"
            startIcon={<Send />}
            disabled={!newComment.trim()}
          >
            Post Comment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default PostDetailPage
