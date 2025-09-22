import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Container, CssBaseline, Box, CircularProgress } from '@mui/material'
import { RootState, AppDispatch } from './store/store'
import { getCurrentUser } from './store/slices/authSlice'

// Components
import Navbar from './components/Layout/Navbar'
import Sidebar from './components/Layout/Sidebar'
import HomePage from './pages/HomePage'
import PostsPage from './pages/PostsPage'
import PostDetailPage from './pages/PostDetailPage'
import CreatePostPage from './pages/CreatePostPage'
import EditPostPage from './pages/EditPostPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ProfilePage from './pages/ProfilePage'
import ExternalPostsPage from './pages/ExternalPostsPage'

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth)

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    )
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />
}

const App: React.FC = (): JSX.Element => {
  const dispatch = useDispatch<AppDispatch>()
  const { isAuthenticated, token } = useSelector(
    (state: RootState): { isAuthenticated: boolean; token: string | null } => state.auth
  )
  const { sidebarOpen } = useSelector((state: RootState) => state.ui)

  useEffect(() => {
    if (token) {
      dispatch(getCurrentUser())
    }
  }, [token, dispatch])

  return (
    <Router>
      <CssBaseline />
      <div style={{ display: 'flex' }}>
        <Navbar />
        {isAuthenticated && <Sidebar open={sidebarOpen} />}
        <main
          style={{
            flexGrow: 1,
            padding: '80px 16px 16px 16px',
            marginLeft: isAuthenticated && sidebarOpen ? 240 : 0,
            transition: 'margin-left 0.3s ease'
          }}
        >
          <Container maxWidth="lg">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Protected Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <HomePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/posts"
                element={
                  <ProtectedRoute>
                    <PostsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/posts/:id"
                element={
                  <ProtectedRoute>
                    <PostDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/create-post"
                element={
                  <ProtectedRoute>
                    <CreatePostPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/edit-post/:id"
                element={
                  <ProtectedRoute>
                    <EditPostPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/external-posts"
                element={
                  <ProtectedRoute>
                    <ExternalPostsPage />
                  </ProtectedRoute>
                }
              />

              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Container>
        </main>
      </div>
    </Router>
  )
}

export default App
