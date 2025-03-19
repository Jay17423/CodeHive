import {configureStore} from '@reduxjs/toolkit'
import codeSlice from './CodeSlice'

const store = configureStore({
  reducer:{
    code: codeSlice
  }
})

export default store;