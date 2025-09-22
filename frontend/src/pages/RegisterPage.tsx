import React, { useState } from 'react'
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  CircularProgress,
  Container,
  InputAdornment,
  IconButton
} from '@mui/material'
import { Visibility, VisibilityOff, PersonAdd } from '@mui/icons-material'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { RootState, AppDispatch } from '../store/store'
import { registerUser } from '../store/slices/authSlice'
import { useInputValidation, InputValidator } from '../utils/inputValidation'

const RegisterPage: React.FC = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()
  const { isLoading, error } = useSelector((state: RootState) => state.auth)
  const { sanitizeInput } = useInputValidation()

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    console.log('Starting form validation...')
    console.log('Current form data:', formData)

    // Simple validation first to debug
    const simpleErrors: Record<string, string> = {}

    if (!formData.username.trim()) {
      simpleErrors.username = 'Username is required'
    }
    if (!formData.email.trim()) {
      simpleErrors.email = 'Email is required'
    }
    if (!formData.first_name.trim()) {
      simpleErrors.first_name = 'First name is required'
    }
    if (!formData.last_name.trim()) {
      simpleErrors.last_name = 'Last name is required'
    }
    if (!formData.password) {
      simpleErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      simpleErrors.password = 'Password must be at least 8 characters'
    }
    if (!formData.confirmPassword) {
      simpleErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      simpleErrors.confirmPassword = 'Passwords do not match'
    }

    console.log('Simple validation errors:', simpleErrors)
    setValidationErrors(simpleErrors)

    return Object.keys(simpleErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    console.log('Form submission started')
    console.log('Form data:', formData)

    const isValid = validateForm()
    console.log('Validation result:', isValid)
    console.log('Validation errors:', validationErrors)

    if (!isValid) {
      console.log('Form validation failed, not submitting')
      return
    }

    const { confirmPassword, ...registrationData } = formData
    console.log('Registration data to send:', registrationData)

    try {
      await dispatch(registerUser(registrationData)).unwrap()
      navigate('/')
    } catch (error) {
      console.error('Registration failed:', error)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    // Sanitize input before storing
    const sanitizedValue = sanitizeInput(value)

    setFormData((prev) => ({
      ...prev,
      [field]: sanitizedValue
    }))

    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({
        ...prev,
        [field]: ''
      }))
    }

    // Note: Real-time validation moved to onBlur for better performance
  }

  const validateFieldRealTime = (field: string, value: string) => {
    let error = ''

    switch (field) {
      case 'username':
        const usernameResult = InputValidator.validateUsername(value)
        if (!usernameResult.isValid) {
          error = usernameResult.errors[0]
        }
        break
      case 'email':
        const emailResult = InputValidator.validateEmail(value)
        if (!emailResult.isValid) {
          error = emailResult.errors[0]
        }
        break
      case 'first_name':
        const firstNameResult = InputValidator.validateName(value, 'First name')
        if (!firstNameResult.isValid) {
          error = firstNameResult.errors[0]
        }
        break
      case 'last_name':
        const lastNameResult = InputValidator.validateName(value, 'Last name')
        if (!lastNameResult.isValid) {
          error = lastNameResult.errors[0]
        }
        break
      case 'password':
        const passwordResult = InputValidator.validatePassword(value)
        if (!passwordResult.isValid) {
          error = passwordResult.errors[0]
        }
        break
      case 'confirmPassword':
        if (value && value !== formData.password) {
          error = 'Passwords do not match'
        }
        break
    }

    if (error) {
      setValidationErrors((prev) => ({
        ...prev,
        [field]: error
      }))
    }
  }

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <Paper elevation={6} sx={{ padding: 4, width: '100%' }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            <PersonAdd
              sx={{ m: 1, bgcolor: 'primary.main', color: 'white', p: 1, borderRadius: '50%' }}
            />
            <Typography component="h1" variant="h4" gutterBottom>
              Sign Up
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center" mb={3}>
              Create your account to get started
            </Typography>

            {error && (
              <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                {error}
              </Alert>
            )}

            {validationErrors.general && (
              <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                {validationErrors.general}
              </Alert>
            )}

            {Object.keys(validationErrors).length > 0 && (
              <Alert severity="warning" sx={{ width: '100%', mb: 2 }}>
                Please fix the validation errors below before submitting.
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="First Name"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                  onBlur={(e) => validateFieldRealTime('first_name', e.target.value)}
                  error={!!validationErrors.first_name}
                  helperText={validationErrors.first_name}
                  disabled={isLoading}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Last Name"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                  onBlur={(e) => validateFieldRealTime('last_name', e.target.value)}
                  error={!!validationErrors.last_name}
                  helperText={validationErrors.last_name}
                  disabled={isLoading}
                />
              </Box>

              <TextField
                margin="normal"
                required
                fullWidth
                label="Username"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                onBlur={(e) => validateFieldRealTime('username', e.target.value)}
                error={!!validationErrors.username}
                helperText={validationErrors.username}
                disabled={isLoading}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                onBlur={(e) => validateFieldRealTime('email', e.target.value)}
                error={!!validationErrors.email}
                helperText={validationErrors.email}
                disabled={isLoading}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                onBlur={(e) => validateFieldRealTime('password', e.target.value)}
                error={!!validationErrors.password}
                helperText={validationErrors.password}
                disabled={isLoading}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                onBlur={(e) => validateFieldRealTime('confirmPassword', e.target.value)}
                error={!!validationErrors.confirmPassword}
                helperText={validationErrors.confirmPassword}
                disabled={isLoading}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle confirm password visibility"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                sx={{ mt: 3, mb: 2 }}
                disabled={isLoading}
                startIcon={isLoading ? <CircularProgress size={20} /> : undefined}
              >
                {isLoading ? 'Creating Account...' : 'Sign Up'}
              </Button>

              <Box textAlign="center" mt={2}>
                <Typography variant="body2">
                  Already have an account?{' '}
                  <Link component={RouterLink} to="/login" underline="hover">
                    Sign in here
                  </Link>
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  )
}

export default RegisterPage
