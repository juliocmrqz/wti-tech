import React, { useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  Chip,
  Alert,
  Tab,
  Tabs
} from '@mui/material'
import { Edit, Save, Cancel, Article, Email, CalendarToday } from '@mui/icons-material'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { RootState, AppDispatch } from '../store/store'
import { logout } from '../store/slices/authSlice'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

const ProfilePage: React.FC = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()
  const { user, isLoading } = useSelector((state: RootState) => state.auth)
  const { posts } = useSelector((state: RootState) => state.posts)

  const [tabValue, setTabValue] = useState(0)
  const [isEditing, setIsEditing] = useState(false)
  const [editFormData, setEditFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || ''
  })

  const userPosts = posts.filter((post) => post.user_id === user?.id)

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const handleEditToggle = () => {
    if (isEditing) {
      // Reset form data if canceling
      setEditFormData({
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        email: user?.email || ''
      })
    }
    setIsEditing(!isEditing)
  }

  const handleSaveProfile = () => {
    // TODO: Implement profile update API call
    console.log('Save profile:', editFormData)
    setIsEditing(false)
  }

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase()
  }

  if (!user) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 3 }}>
          You must be logged in to view your profile.
        </Alert>
        <Button onClick={() => navigate('/login')}>Go to Login</Button>
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        My Profile
      </Typography>

      <Grid container spacing={3}>
        {/* Profile Overview */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
            <Avatar
              sx={{
                width: 120,
                height: 120,
                mx: 'auto',
                mb: 2,
                fontSize: '2rem',
                bgcolor: 'primary.main'
              }}
            >
              {getInitials(user.first_name, user.last_name)}
            </Avatar>

            <Typography variant="h5" gutterBottom>
              {user.first_name} {user.last_name}
            </Typography>

            <Typography variant="body2" color="text.secondary" gutterBottom>
              @{user.username}
            </Typography>

            <Box display="flex" alignItems="center" justifyContent="center" mt={2} mb={1}>
              <Email sx={{ mr: 1, fontSize: 'small' }} />
              <Typography variant="body2">{user.email}</Typography>
            </Box>

            <Box display="flex" alignItems="center" justifyContent="center" mb={3}>
              <CalendarToday sx={{ mr: 1, fontSize: 'small' }} />
              <Typography variant="body2" color="text.secondary">
                Member since registration
              </Typography>
            </Box>

            <Box display="flex" justifyContent="center" gap={1} mb={2}>
              <Chip
                icon={<Article />}
                label={`${userPosts.length} Posts`}
                color="primary"
                variant="outlined"
              />
              <Chip
                label={user.is_active ? 'Active' : 'Inactive'}
                color={user.is_active ? 'success' : 'default'}
                size="small"
              />
            </Box>

            <Button
              variant="outlined"
              color="error"
              fullWidth
              onClick={handleLogout}
              sx={{ mt: 2 }}
            >
              Logout
            </Button>
          </Paper>
        </Grid>

        {/* Profile Details */}
        <Grid item xs={12} md={8}>
          <Paper elevation={3}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={handleTabChange}>
                <Tab label="Personal Information" />
                <Tab label="My Posts" />
                <Tab label="Settings" />
              </Tabs>
            </Box>

            <TabPanel value={tabValue} index={0}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6">Personal Information</Typography>
                <Button
                  variant={isEditing ? 'outlined' : 'contained'}
                  startIcon={isEditing ? <Cancel /> : <Edit />}
                  onClick={handleEditToggle}
                >
                  {isEditing ? 'Cancel' : 'Edit'}
                </Button>
              </Box>

              {isEditing ? (
                <Box
                  component="form"
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleSaveProfile()
                  }}
                >
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="First Name"
                        value={editFormData.first_name}
                        onChange={(e) =>
                          setEditFormData((prev) => ({
                            ...prev,
                            first_name: e.target.value
                          }))
                        }
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Last Name"
                        value={editFormData.last_name}
                        onChange={(e) =>
                          setEditFormData((prev) => ({
                            ...prev,
                            last_name: e.target.value
                          }))
                        }
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Email"
                        type="email"
                        value={editFormData.email}
                        onChange={(e) =>
                          setEditFormData((prev) => ({
                            ...prev,
                            email: e.target.value
                          }))
                        }
                      />
                    </Grid>
                  </Grid>
                  <Box mt={3}>
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={<Save />}
                      disabled={isLoading}
                    >
                      Save Changes
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      First Name
                    </Typography>
                    <Typography variant="body1">{user.first_name || 'Not provided'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Last Name
                    </Typography>
                    <Typography variant="body1">{user.last_name || 'Not provided'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Username
                    </Typography>
                    <Typography variant="body1">{user.username}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Email
                    </Typography>
                    <Typography variant="body1">{user.email}</Typography>
                  </Grid>
                </Grid>
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <Typography variant="h6" gutterBottom>
                My Posts ({userPosts.length})
              </Typography>

              {userPosts.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <Typography variant="body1" color="text.secondary" mb={2}>
                    You haven't created any posts yet.
                  </Typography>
                  <Button variant="contained" onClick={() => navigate('/create-post')}>
                    Create Your First Post
                  </Button>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {userPosts.map((post) => (
                    <Grid item xs={12} key={post.id}>
                      <Card>
                        <CardContent>
                          <Box
                            display="flex"
                            justifyContent="space-between"
                            alignItems="flex-start"
                          >
                            <Box flexGrow={1}>
                              <Typography variant="h6" gutterBottom>
                                {post.title}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical'
                                }}
                              >
                                {post.content}
                              </Typography>
                              <Typography variant="caption" display="block" mt={1}>
                                Created: {formatDate(post.created_at)}
                              </Typography>
                            </Box>
                            <Button size="small" onClick={() => navigate(`/posts/${post.id}`)}>
                              View
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              <Typography variant="h6" gutterBottom>
                Account Settings
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Settings functionality coming soon...
              </Typography>
            </TabPanel>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

export default ProfilePage
