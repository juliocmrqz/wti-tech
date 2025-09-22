import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'

// API Response Types
interface APIResponse {
  success: boolean
  message?: any
  additionalData?: string | null
}

interface APIResponseWithData extends APIResponse {
  data?: any
}

interface APIResponseWithList extends APIResponse {
  data?: any[]
}

export interface Post {
  id: number
  title: string
  content: string
  user_id: number
  category_id?: number
  is_published: boolean
  created_at: string
  updated_at: string
  category_name?: string
  author_name?: string
}

export interface PostsState {
  posts: Post[]
  userPosts: Post[]
  currentPost: Post | null
  isLoading: boolean
  isLoadingUserPosts: boolean
  error: string | null
  successMessage: string | null
  pagination: {
    page: number
    limit: number
    total: number
  }
}

const initialState: PostsState = {
  posts: [],
  userPosts: [],
  currentPost: null,
  isLoading: false,
  isLoadingUserPosts: false,
  error: null,
  successMessage: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0
  }
}

// Async thunks
export const fetchPosts = createAsyncThunk(
  'posts/fetchPosts',
  async ({ skip = 0, limit = 20 }: { skip?: number; limit?: number } = {}, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/posts?skip=${skip}&limit=${limit}`)
      const apiResponse: APIResponseWithList = await response.json()

      if (!apiResponse.success) {
        return rejectWithValue(apiResponse.additionalData || 'Failed to fetch posts')
      }

      return apiResponse.data || []
    } catch (error) {
      return rejectWithValue('Network error')
    }
  }
)

export const fetchPost = createAsyncThunk(
  'posts/fetchPost',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/posts/${id}`)
      const apiResponse: APIResponseWithData = await response.json()

      if (!apiResponse.success) {
        return rejectWithValue(apiResponse.additionalData || 'Failed to fetch post')
      }

      return apiResponse.message
    } catch (error) {
      return rejectWithValue('Network error')
    }
  }
)

export const fetchUserPosts = createAsyncThunk(
  'posts/fetchUserPosts',
  async ({ userId, limit = 50 }: { userId: number; limit?: number }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/users/${userId}/posts?limit=${limit}`)
      const apiResponse: APIResponseWithList = await response.json()

      if (!apiResponse.success) {
        return rejectWithValue(apiResponse.additionalData || 'Failed to fetch user posts')
      }

      return apiResponse.data || []
    } catch (error) {
      return rejectWithValue('Network error')
    }
  }
)

export const createPost = createAsyncThunk(
  'posts/createPost',
  async (
    postData: {
      title: string
      content: string
      user_id: number
      category_id?: number
    },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as { auth: { token: string } }
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${state.auth.token}`
        },
        body: JSON.stringify(postData)
      })

      const apiResponse: APIResponseWithData = await response.json()

      if (!apiResponse.success) {
        return rejectWithValue(apiResponse.additionalData || 'Failed to create post')
      }

      return apiResponse.message
    } catch (error) {
      return rejectWithValue('Network error')
    }
  }
)

export const updatePost = createAsyncThunk(
  'posts/updatePost',
  async (
    { id, ...postData }: { id: number; title?: string; content?: string; category_id?: number },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as { auth: { token: string } }
      const response = await fetch(`/api/posts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${state.auth.token}`
        },
        body: JSON.stringify(postData)
      })

      const apiResponse: APIResponseWithData = await response.json()

      if (!apiResponse.success) {
        return rejectWithValue(apiResponse.additionalData || 'Failed to update post')
      }

      return apiResponse.message
    } catch (error) {
      return rejectWithValue('Network error')
    }
  }
)

export const deletePost = createAsyncThunk(
  'posts/deletePost',
  async (id: number, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: { token: string } }
      const response = await fetch(`/api/posts/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${state.auth.token}`
        }
      })

      const apiResponse: APIResponse = await response.json()

      if (!apiResponse.success) {
        return rejectWithValue(apiResponse.additionalData || 'Failed to delete post')
      }

      return id
    } catch (error) {
      return rejectWithValue('Network error')
    }
  }
)

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    clearCurrentPost: (state) => {
      state.currentPost = null
    },
    clearError: (state) => {
      state.error = null
    },
    clearSuccessMessage: (state) => {
      state.successMessage = null
    },
    setPagination: (state, action: PayloadAction<{ page: number; limit: number }>) => {
      state.pagination = { ...state.pagination, ...action.payload }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch posts
      .addCase(fetchPosts.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.isLoading = false
        state.posts = action.payload
        state.pagination.total = action.payload.length
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.isLoading = false
        state.error = (action.payload as string) || 'Failed to fetch posts'
      })
      // Fetch single post
      .addCase(fetchPost.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchPost.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentPost = action.payload
      })
      .addCase(fetchPost.rejected, (state, action) => {
        state.isLoading = false
        state.error = (action.payload as string) || 'Failed to fetch post'
      })
      // Fetch user posts
      .addCase(fetchUserPosts.pending, (state) => {
        state.isLoadingUserPosts = true
        state.error = null
      })
      .addCase(fetchUserPosts.fulfilled, (state, action) => {
        state.isLoadingUserPosts = false
        state.userPosts = action.payload
      })
      .addCase(fetchUserPosts.rejected, (state, action) => {
        state.isLoadingUserPosts = false
        state.error = (action.payload as string) || 'Failed to fetch user posts'
      })
      // Create post
      .addCase(createPost.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.isLoading = false
        state.posts.unshift(action.payload)
      })
      .addCase(createPost.rejected, (state, action) => {
        state.isLoading = false
        state.error = (action.payload as string) || 'Failed to create post'
      })
      // Update post
      .addCase(updatePost.pending, (state) => {
        state.isLoading = true
        state.error = null
        state.successMessage = null
      })
      .addCase(updatePost.fulfilled, (state, action) => {
        state.isLoading = false
        state.successMessage = 'Post updated successfully!'
        const index = state.posts.findIndex((post) => post.id === action.payload.id)
        if (index !== -1) {
          state.posts[index] = action.payload
        }
        if (state.currentPost?.id === action.payload.id) {
          state.currentPost = action.payload
        }
      })
      .addCase(updatePost.rejected, (state, action) => {
        state.isLoading = false
        state.error = (action.payload as string) || 'Failed to update post'
        state.successMessage = null
      })
      // Delete post
      .addCase(deletePost.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(deletePost.fulfilled, (state, action) => {
        state.isLoading = false
        state.posts = state.posts.filter((post) => post.id !== action.payload)
        if (state.currentPost?.id === action.payload) {
          state.currentPost = null
        }
      })
      .addCase(deletePost.rejected, (state, action) => {
        state.isLoading = false
        state.error = (action.payload as string) || 'Failed to delete post'
      })
  }
})

export const { clearCurrentPost, clearError, clearSuccessMessage, setPagination } =
  postsSlice.actions
export default postsSlice.reducer
