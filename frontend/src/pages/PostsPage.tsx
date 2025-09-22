import React, { useEffect, useState } from 'react'
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  TextField,
  InputAdornment,
  Pagination,
  CircularProgress,
  Alert
} from '@mui/material'
import { Search, Add, Edit, Delete } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '../store/store'
import { fetchPosts, deletePost } from '../store/slices/postsSlice'

const PostsPage: React.FC = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()
  const { posts, isLoading, error } = useSelector((state: RootState) => state.posts)
  const { user } = useSelector((state: RootState) => state.auth)

  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const postsPerPage = 6

  useEffect(() => {
    dispatch(fetchPosts({ skip: 0, limit: 100 }))
  }, [dispatch])

  const filteredPosts = posts.filter(
    (post) =>
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const paginatedPosts = filteredPosts.slice((page - 1) * postsPerPage, page * postsPerPage)

  const totalPages = Math.ceil(filteredPosts.length / postsPerPage)

  const handleDeletePost = async (postId: number) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      await dispatch(deletePost(postId))
      dispatch(fetchPosts({ skip: 0, limit: 100 }))
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Posts
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/create-post')}>
          Create Post
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <TextField
        fullWidth
        placeholder="Search posts..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          )
        }}
        sx={{ mb: 3 }}
      />

      <Grid container spacing={3}>
        {paginatedPosts.map((post) => (
          <Grid item xs={12} sm={6} md={4} key={post.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" component="h2" gutterBottom>
                  {post.title}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical'
                  }}
                >
                  {post.content}
                </Typography>
                <Box mt={2}>
                  <Chip
                    label={`By: ${post.author_name || 'Unknown'}`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                  <Typography variant="caption" display="block" mt={1}>
                    {formatDate(post.created_at)}
                  </Typography>
                </Box>
              </CardContent>
              <CardActions>
                <Button size="small" onClick={() => navigate(`/posts/${post.id}`)}>
                  Read More
                </Button>
                {user?.id === post.user_id && (
                  <>
                    <Button
                      size="small"
                      startIcon={<Edit />}
                      onClick={() => navigate(`/edit-post/${post.id}`)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<Delete />}
                      onClick={() => handleDeletePost(post.id)}
                    >
                      Delete
                    </Button>
                  </>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredPosts.length === 0 && !isLoading && (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="text.secondary">
            No posts found
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {searchTerm ? 'Try adjusting your search terms' : 'Be the first to create a post!'}
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/create-post')}>
            Create Post
          </Button>
        </Box>
      )}

      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={4}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, newPage) => setPage(newPage)}
            color="primary"
          />
        </Box>
      )}
    </Box>
  )
}

export default PostsPage
