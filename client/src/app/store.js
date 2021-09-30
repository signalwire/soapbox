import { createSlice, configureStore } from '@reduxjs/toolkit'

const { actions: nameActions, reducer: nameReducer } = createSlice({
  name: 'nameStore',
  initialState: name,
  reducers: {
    setName: (name) => name
  }
})

const { setName } = nameActions

const store = configureStore({
  reducer: {
    nameStore: nameReducer
  }
})

export { store, setName }