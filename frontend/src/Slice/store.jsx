import {configureStore} from '@reduxjs/toolkit'
import codeSlice from './CodeSlice'
import groupChatSlice from './GroupChat'

const store = configureStore({
  reducer:{
    code: codeSlice,
    groupChat: groupChatSlice

  }
})

export default store;