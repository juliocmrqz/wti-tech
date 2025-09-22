/**
 * Client-side input validation and sanitization utilities.
 * Provides protection against XSS and input validation before sending to backend.
 */

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export class InputValidator {
  // Patterns for detecting potentially dangerous content
  private static readonly XSS_PATTERNS = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /onload\s*=/gi,
    /onerror\s*=/gi,
    /onclick\s*=/gi,
    /onmouseover\s*=/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /<object[^>]*>.*?<\/object>/gi,
    /<embed[^>]*>.*?<\/embed>/gi
  ]

  private static readonly SQL_INJECTION_PATTERNS = [
    /(\b(union|select|insert|delete|update|drop|create|alter|exec|execute)\b)/gi,
    /(--|#|\/\*|\*\/)/g,
    /(\b(or|and)\b\s+\d+\s*=\s*\d+)/gi,
    /(\'\s*(or|and)\s*\'\w*\'\s*=\s*\'\w*)/gi
  ]

  /**
   * Sanitize a string by removing potentially dangerous content
   */
  static sanitizeString(input: string): string {
    if (typeof input !== 'string') {
      return ''
    }

    // Remove potentially dangerous HTML/script tags
    let sanitized = input

    // Remove script tags and their content
    sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gi, '')

    // Remove dangerous event handlers
    sanitized = sanitized.replace(/on\w+\s*=\s*['"]*[^'"]*['"]/gi, '')

    // Remove javascript: and vbscript: protocols
    sanitized = sanitized.replace(/javascript:/gi, '')
    sanitized = sanitized.replace(/vbscript:/gi, '')

    // Remove other potentially dangerous tags
    sanitized = sanitized.replace(/<(iframe|object|embed|form)[^>]*>.*?<\/\1>/gi, '')

    return sanitized.trim()
  }

  /**
   * Validate email format
   */
  static validateEmail(email: string): ValidationResult {
    const errors: string[] = []

    if (!email || typeof email !== 'string') {
      errors.push('Email is required')
      return { isValid: false, errors }
    }

    const sanitized = this.sanitizeString(email)
    if (sanitized !== email) {
      errors.push('Email contains invalid characters')
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!emailRegex.test(sanitized)) {
      errors.push('Please enter a valid email address')
    }

    if (sanitized.length > 100) {
      errors.push('Email is too long (max 100 characters)')
    }

    return { isValid: errors.length === 0, errors }
  }

  /**
   * Validate username format
   */
  static validateUsername(username: string): ValidationResult {
    const errors: string[] = []

    if (!username || typeof username !== 'string') {
      errors.push('Username is required')
      return { isValid: false, errors }
    }

    const sanitized = this.sanitizeString(username)
    if (sanitized !== username) {
      errors.push('Username contains invalid characters')
    }

    if (sanitized.length < 3) {
      errors.push('Username must be at least 3 characters long')
    }

    if (sanitized.length > 50) {
      errors.push('Username is too long (max 50 characters)')
    }

    // Username should only contain alphanumeric characters and underscores
    const usernameRegex = /^[a-zA-Z0-9_]+$/
    if (!usernameRegex.test(sanitized)) {
      errors.push('Username can only contain letters, numbers, and underscores')
    }

    return { isValid: errors.length === 0, errors }
  }

  /**
   * Validate name fields (first name, last name)
   */
  static validateName(name: string, fieldName: string = 'Name'): ValidationResult {
    const errors: string[] = []

    if (!name || typeof name !== 'string') {
      errors.push(`${fieldName} is required`)
      return { isValid: false, errors }
    }

    const sanitized = this.sanitizeString(name)
    if (sanitized !== name) {
      errors.push(`${fieldName} contains invalid characters`)
    }

    if (sanitized.length < 1) {
      errors.push(`${fieldName} is required`)
    }

    if (sanitized.length > 50) {
      errors.push(`${fieldName} is too long (max 50 characters)`)
    }

    // Names should only contain letters, spaces, hyphens, and apostrophes
    const nameRegex = /^[a-zA-Z\s\-']+$/
    if (sanitized && !nameRegex.test(sanitized)) {
      errors.push(`${fieldName} can only contain letters, spaces, hyphens, and apostrophes`)
    }

    return { isValid: errors.length === 0, errors }
  }

  /**
   * Validate password strength
   */
  static validatePassword(password: string): ValidationResult {
    const errors: string[] = []

    if (!password || typeof password !== 'string') {
      errors.push('Password is required')
      return { isValid: false, errors }
    }

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long')
    }

    if (password.length > 128) {
      errors.push('Password is too long (max 128 characters)')
    }

    if (!/[a-zA-Z]/.test(password)) {
      errors.push('Password must contain at least one letter')
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number')
    }

    return { isValid: errors.length === 0, errors }
  }

  /**
   * Validate post title
   */
  static validatePostTitle(title: string): ValidationResult {
    const errors: string[] = []

    if (!title || typeof title !== 'string') {
      errors.push('Title is required')
      return { isValid: false, errors }
    }

    const sanitized = this.sanitizeString(title)
    if (sanitized !== title) {
      errors.push('Title contains invalid characters')
    }

    if (sanitized.length < 5) {
      errors.push('Title must be at least 5 characters long')
    }

    if (sanitized.length > 200) {
      errors.push('Title is too long (max 200 characters)')
    }

    // Check for potential SQL injection patterns
    for (const pattern of this.SQL_INJECTION_PATTERNS) {
      if (pattern.test(sanitized)) {
        errors.push('Title contains invalid content')
        break
      }
    }

    return { isValid: errors.length === 0, errors }
  }

  /**
   * Validate post content
   */
  static validatePostContent(content: string): ValidationResult {
    const errors: string[] = []

    if (!content || typeof content !== 'string') {
      errors.push('Content is required')
      return { isValid: false, errors }
    }

    const sanitized = this.sanitizeString(content)
    if (sanitized !== content) {
      errors.push('Content contains invalid characters')
    }

    if (sanitized.length < 10) {
      errors.push('Content must be at least 10 characters long')
    }

    if (sanitized.length > 10000) {
      errors.push('Content is too long (max 10,000 characters)')
    }

    // Check for potential SQL injection patterns
    for (const pattern of this.SQL_INJECTION_PATTERNS) {
      if (pattern.test(sanitized)) {
        errors.push('Content contains invalid content')
        break
      }
    }

    return { isValid: errors.length === 0, errors }
  }

  /**
   * Check for potential XSS content
   */
  static hasXSSContent(input: string): boolean {
    if (typeof input !== 'string') {
      return false
    }

    for (const pattern of this.XSS_PATTERNS) {
      if (pattern.test(input)) {
        return true
      }
    }

    return false
  }

  /**
   * Check for potential SQL injection content
   */
  static hasSQLInjectionContent(input: string): boolean {
    if (typeof input !== 'string') {
      return false
    }

    for (const pattern of this.SQL_INJECTION_PATTERNS) {
      if (pattern.test(input)) {
        return true
      }
    }

    return false
  }

  /**
   * Comprehensive validation for user registration data
   */
  static validateUserRegistration(userData: {
    username: string
    email: string
    firstName: string
    lastName: string
    password: string
    confirmPassword?: string
  }): ValidationResult {
    const errors: string[] = []

    const usernameResult = this.validateUsername(userData.username)
    if (!usernameResult.isValid) {
      errors.push(...usernameResult.errors)
    }

    const emailResult = this.validateEmail(userData.email)
    if (!emailResult.isValid) {
      errors.push(...emailResult.errors)
    }

    const firstNameResult = this.validateName(userData.firstName, 'First name')
    if (!firstNameResult.isValid) {
      errors.push(...firstNameResult.errors)
    }

    const lastNameResult = this.validateName(userData.lastName, 'Last name')
    if (!lastNameResult.isValid) {
      errors.push(...lastNameResult.errors)
    }

    const passwordResult = this.validatePassword(userData.password)
    if (!passwordResult.isValid) {
      errors.push(...passwordResult.errors)
    }

    if (userData.confirmPassword && userData.password !== userData.confirmPassword) {
      errors.push('Passwords do not match')
    }

    return { isValid: errors.length === 0, errors }
  }

  /**
   * Comprehensive validation for post creation data
   */
  static validatePostCreation(postData: { title: string; content: string }): ValidationResult {
    const errors: string[] = []

    const titleResult = this.validatePostTitle(postData.title)
    if (!titleResult.isValid) {
      errors.push(...titleResult.errors)
    }

    const contentResult = this.validatePostContent(postData.content)
    if (!contentResult.isValid) {
      errors.push(...contentResult.errors)
    }

    return { isValid: errors.length === 0, errors }
  }
}

/**
 * Higher-order component for form validation
 */
export const useInputValidation = () => {
  const sanitizeInput = (input: string): string => {
    return InputValidator.sanitizeString(input)
  }

  const validateField = (
    value: string,
    type: 'email' | 'username' | 'name' | 'password' | 'title' | 'content',
    fieldName?: string
  ): ValidationResult => {
    switch (type) {
      case 'email':
        return InputValidator.validateEmail(value)
      case 'username':
        return InputValidator.validateUsername(value)
      case 'name':
        return InputValidator.validateName(value, fieldName)
      case 'password':
        return InputValidator.validatePassword(value)
      case 'title':
        return InputValidator.validatePostTitle(value)
      case 'content':
        return InputValidator.validatePostContent(value)
      default:
        return { isValid: true, errors: [] }
    }
  }

  return {
    sanitizeInput,
    validateField,
    validateUserRegistration: InputValidator.validateUserRegistration,
    validatePostCreation: InputValidator.validatePostCreation
  }
}
