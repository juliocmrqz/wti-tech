import React, { useState } from 'react'
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
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '../store/store'
import { createPost } from '../store/slices/postsSlice'
import { POST_CATEGORIES, POST_VALIDATION } from '../utils/constants'

const CreatePostPage: React.FC = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()
  const { isLoading, error } = useSelector((state: RootState) => state.posts)
  const { user } = useSelector((state: RootState) => state.auth)

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category_id: ''
  })
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

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

    if (!validateForm()) {
      return
    }

    if (!user) {
      return
    }

    const postData = {
      title: formData.title.trim(),
      content: formData.content.trim(),
      user_id: user.id,
      category_id: formData.category_id ? parseInt(formData.category_id) : undefined
    }

    try {
      await dispatch(createPost(postData)).unwrap()
      navigate('/posts')
    } catch (error) {
      console.error('Failed to create post:', error)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }))

    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  if (!user) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 3 }}>
          You must be logged in to create a post.
        </Alert>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/login')}>
          Go to Login
        </Button>
      </Box>
    )
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/posts')} sx={{ mr: 2 }}>
          Back
        </Button>
        <Typography variant="h4" component="h1">
          Create New Post
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={3} sx={{ p: 4 }}>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Post Title"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            error={!!validationErrors.title}
            helperText={validationErrors.title}
            margin="normal"
            required
            placeholder="Enter a compelling title for your post"
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>Category</InputLabel>
            <Select
              value={formData.category_id}
              onChange={(e) => handleInputChange('category_id', e.target.value)}
              label="Category"
            >
              <MenuItem value="">
                <em>None</em>
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
            required
            multiline
            rows={12}
            placeholder="Write your post content here..."
            sx={{
              '& .MuiInputBase-root': {
                alignItems: 'flex-start'
              }
            }}
          />

          <Box mt={3} display="flex" gap={2}>
            <Button
              type="submit"
              variant="contained"
              size="large"
              startIcon={isLoading ? <CircularProgress size={20} /> : <Save />}
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Post'}
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/posts')}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  )
}

export default CreatePostPage
