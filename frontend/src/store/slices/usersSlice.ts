import { createSlice } from '@reduxjs/toolkit'

export interface UsersState {
  users: any[]
  currentUser: any | null
  isLoading: boolean
  error: string | null
}

const initialState: UsersState = {
  users: [],
  currentUser: null,
  isLoading: false,
  error: null
}

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    // Add users reducers as needed
  }
})

export default usersSlice.reducer
