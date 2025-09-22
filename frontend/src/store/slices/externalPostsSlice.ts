import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

// API Response Types
interface APIResponse {
  success: boolean
  message?: any
  additionalData?: string | null
}

interface APIResponseWithList extends APIResponse {
  data?: any[]
}

export interface ExternalPost {
  id: number
  title: string
  body: string
  userId: number
}

export interface ExternalPostsState {
  posts: ExternalPost[]
  isLoading: boolean
  error: string | null
  lastFetched: string | null
}

const initialState: ExternalPostsState = {
  posts: [],
  isLoading: false,
  error: null,
  lastFetched: null
}

// Async thunks
export const fetchExternalPosts = createAsyncThunk(
  'externalPosts/fetchPosts',
  async (limit: number = 100, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/external/posts?limit=${limit}`)
      const apiResponse: APIResponseWithList = await response.json()

      if (!apiResponse.success) {
        return rejectWithValue(apiResponse.additionalData || 'Failed to fetch external posts')
      }

      return apiResponse.data || []
    } catch (error) {
      return rejectWithValue('Network error')
    }
  }
)

const externalPostsSlice = createSlice({
  name: 'externalPosts',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    clearPosts: (state) => {
      state.posts = []
      state.lastFetched = null
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch external posts
      .addCase(fetchExternalPosts.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchExternalPosts.fulfilled, (state, action) => {
        state.isLoading = false
        state.posts = action.payload
        state.lastFetched = new Date().toISOString()
        state.error = null
      })
      .addCase(fetchExternalPosts.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
  }
})

export const { clearError, clearPosts } = externalPostsSlice.actions
export default externalPostsSlice.reducer
