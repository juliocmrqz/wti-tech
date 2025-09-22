import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { AppDispatch, RootState } from '../store/store'
import { loginUser } from '../store/slices/authSlice'

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showError, setShowError] = useState(false)

  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()

  const { isLoading, error, isAuthenticated } = useSelector((state: RootState) => state.auth)

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated) {
      navigate('/')
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    // Show error message for a few seconds
    if (error) {
      setShowError(true)
      const timer = setTimeout(() => setShowError(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setShowError(false)

    try {
      // Dispatch the login action
      const result = await dispatch(loginUser({ username, password }))

      if (loginUser.fulfilled.match(result)) {
        // Login successful - Redux will handle token storage
        navigate('/')
      }
      // If login fails, error will be shown via useEffect
    } catch (err) {
      console.error('Login failed:', err)
    }
  }

  return (
    <div className="text-center">
      <div className="card" style={{ maxWidth: '400px', margin: '40px auto' }}>
        <h2>Login</h2>

        {showError && error && (
          <div
            style={{
              background: '#ffebee',
              color: '#c62828',
              padding: '10px',
              borderRadius: '4px',
              marginBottom: '20px',
              border: '1px solid #ffcdd2'
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={isLoading}
              placeholder="Enter your username"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              placeholder="Enter your password"
            />
          </div>
          <button
            type="submit"
            className="button"
            disabled={isLoading || !username || !password}
            style={{
              opacity: isLoading ? 0.7 : 1,
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
          Don't have an account?{' '}
          <span
            style={{ color: '#1976d2', cursor: 'pointer', textDecoration: 'underline' }}
            onClick={() => navigate('/register')}
          >
            Register here
          </span>
        </div>

        {/* Demo credentials for testing */}
        <div
          style={{
            marginTop: '20px',
            padding: '10px',
            background: '#f5f5f5',
            borderRadius: '4px',
            fontSize: '12px',
            color: '#666'
          }}
        >
          <strong>Demo Credentials:</strong>
          <br />
          Username: demo
          <br />
          Password: password123
        </div>
      </div>
    </div>
  )
}

export default LoginPage
