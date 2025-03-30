import { createSlice } from "@reduxjs/toolkit";

const groupChatSlice = createSlice({
  name: "groupChat",
  initialState: {
    messages: [],
  },
  reducers: {
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    clearMessages: (state) => {
      state.messages = [];
    },
  },
});

export const { addMessage, clearMessages } = groupChatSlice.actions;
export default groupChatSlice.reducer;
