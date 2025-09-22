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
  Alert,
  Divider
} from '@mui/material'
import { Search, Public, Person, Refresh } from '@mui/icons-material'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '../store/store'
import { fetchExternalPosts, clearError } from '../store/slices/externalPostsSlice'

const ExternalPostsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { posts, isLoading, error, lastFetched } = useSelector(
    (state: RootState) => state.externalPosts
  )

  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const postsPerPage = 12

  useEffect(() => {
    if (posts.length === 0) {
      dispatch(fetchExternalPosts(100))
    }
  }, [dispatch, posts.length])

  const handleRefresh = () => {
    dispatch(fetchExternalPosts(100))
  }

  const handleClearError = () => {
    dispatch(clearError())
  }

  const filteredPosts = posts.filter(
    (post) =>
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.body.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const paginatedPosts = filteredPosts.slice((page - 1) * postsPerPage, page * postsPerPage)

  const totalPages = Math.ceil(filteredPosts.length / postsPerPage)

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text
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
        <Typography variant="h4" component="h1" display="flex" alignItems="center" gap={1}>
          <Public color="primary" />
          External Posts
        </Typography>
        <Box display="flex" gap={2} alignItems="center">
          <Chip label={`${filteredPosts.length} posts`} color="primary" variant="outlined" />
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleRefresh}
            disabled={isLoading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      <Typography variant="body2" color="text.secondary" mb={2}>
        Posts fetched from JSONPlaceholder API - an external demo service
      </Typography>

      {lastFetched && (
        <Typography variant="caption" color="text.secondary" mb={3} display="block">
          Last updated: {new Date(lastFetched).toLocaleString()}
        </Typography>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={handleClearError}>
          {error}
        </Alert>
      )}

      <TextField
        fullWidth
        placeholder="Search external posts..."
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
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 3
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                  <Chip
                    label={`Post #${post.id}`}
                    size="small"
                    color="secondary"
                    variant="outlined"
                  />
                  <Chip
                    icon={<Person />}
                    label={`User ${post.userId}`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </Box>

                <Typography
                  variant="h6"
                  component="h2"
                  gutterBottom
                  sx={{
                    fontWeight: 600,
                    lineHeight: 1.2,
                    textTransform: 'capitalize'
                  }}
                >
                  {truncateText(post.title, 60)}
                </Typography>

                <Divider sx={{ my: 1 }} />

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    lineHeight: 1.5,
                    textAlign: 'justify'
                  }}
                >
                  {truncateText(post.body, 120)}
                </Typography>
              </CardContent>

              <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                <Button
                  size="small"
                  color="primary"
                  onClick={() =>
                    window.open(`https://jsonplaceholder.typicode.com/posts/${post.id}`, '_blank')
                  }
                >
                  View Original
                </Button>
                <Typography variant="caption" color="text.secondary">
                  External API
                </Typography>
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
          <Typography variant="body2" color="text.secondary">
            {searchTerm ? 'Try adjusting your search terms' : 'No external posts available'}
          </Typography>
        </Box>
      )}

      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={4}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, newPage) => setPage(newPage)}
            color="primary"
            size="large"
          />
        </Box>
      )}

      <Box mt={4} p={2} bgcolor="grey.50" borderRadius={1}>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          <strong>About JSONPlaceholder:</strong> This is a demo showing integration with external
          APIs. JSONPlaceholder is a free fake online REST API for testing and prototyping.
        </Typography>
      </Box>
    </Box>
  )
}

export default ExternalPostsPage
