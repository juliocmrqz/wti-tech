import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress
} from '@mui/material'
import { Save, ArrowBack } from '@mui/icons-material'
import { useNavigate, useParams } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '../store/store'
import {
  updatePost,
  fetchPost,
  clearCurrentPost,
  clearSuccessMessage
} from '../store/slices/postsSlice'
import { POST_CATEGORIES, POST_VALIDATION } from '../utils/constants'

const EditPostPage: React.FC = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()
  const { id } = useParams<{ id: string }>()
  const { currentPost, isLoading, error, successMessage } = useSelector(
    (state: RootState) => state.posts
  )
  const { user } = useSelector((state: RootState) => state.auth)

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category_id: ''
  })
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (id) {
      dispatch(fetchPost(Number(id)))
    }

    return () => {
      dispatch(clearCurrentPost())
      dispatch(clearSuccessMessage())
    }
  }, [dispatch, id])

  useEffect(() => {
    if (currentPost) {
      // Check if current user is the author
      if (user?.id !== currentPost.user_id) {
        navigate('/posts')
        return
      }

      setFormData({
        title: currentPost.title,
        content: currentPost.content,
        category_id: currentPost.category_id?.toString() || ''
      })
    }
  }, [currentPost, user, navigate])

  // Auto-clear success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout((): void => {
        dispatch(clearSuccessMessage())
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [successMessage, dispatch])

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.title.trim()) {
      errors.title = 'Title is required'
    } else if (formData.title.length < POST_VALIDATION.TITLE_MIN_LENGTH) {
      errors.title = `Title must be at least ${POST_VALIDATION.TITLE_MIN_LENGTH} characters`
    } else if (formData.title.length > POST_VALIDATION.TITLE_MAX_LENGTH) {
      errors.title = `Title must be less than ${POST_VALIDATION.TITLE_MAX_LENGTH} characters`
    }

    if (!formData.content.trim()) {
      errors.content = 'Content is required'
    } else if (formData.content.length < POST_VALIDATION.CONTENT_MIN_LENGTH) {
      errors.content = `Content must be at least ${POST_VALIDATION.CONTENT_MIN_LENGTH} characters`
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm() || !id) {
      return
    }

    setIsSubmitting(true)

    const updateData = {
      id: Number(id),
      title: formData.title.trim(),
      content: formData.content.trim(),
      category_id: formData.category_id ? parseInt(formData.category_id) : undefined
    }

    try {
      await dispatch(updatePost(updateData)).unwrap()
      // navigate('/posts')
    } catch (error) {
      console.error('Failed to update post:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }))

    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  if (!currentPost) {
    return (
      <Box>
        <Alert severity="error">
          Post not found or you don't have permission to edit this post.
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/posts')}
          sx={{ mt: 2 }}
        >
          Back to Posts
        </Button>
      </Box>
    )
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/posts')}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4" component="h1">
          Edit Post
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => dispatch(clearSuccessMessage())}>
          {successMessage}
        </Alert>
      )}

      <Paper elevation={3} sx={{ p: 4 }}>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Title"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            error={!!validationErrors.title}
            helperText={validationErrors.title}
            margin="normal"
            required
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>Category (Optional)</InputLabel>
            <Select
              value={formData.category_id}
              label="Category (Optional)"
              onChange={(e) => handleInputChange('category_id', e.target.value)}
            >
              <MenuItem value="">
                <em>No Category</em>
              </MenuItem>
              {POST_CATEGORIES.map((category) => (
                <MenuItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Content"
            value={formData.content}
            onChange={(e) => handleInputChange('content', e.target.value)}
            error={!!validationErrors.content}
            helperText={validationErrors.content}
            margin="normal"
            multiline
            rows={12}
            required
          />

          <Box mt={3} display="flex" gap={2}>
            <Button
              type="submit"
              variant="contained"
              startIcon={<Save />}
              disabled={isSubmitting}
              size="large"
            >
              {isSubmitting ? <CircularProgress size={20} /> : 'Update Post'}
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/posts')}
              disabled={isSubmitting}
              size="large"
            >
              Cancel
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  )
}

export default EditPostPage
