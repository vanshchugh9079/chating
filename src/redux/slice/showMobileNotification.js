import { createSlice } from "@reduxjs/toolkit";
import { persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage"; // Uses localStorage for persistence

const showNotiSlice = createSlice({
    name: "showNoti",
    initialState: {
        show: false,
        message: false
    },
    reducers: {
        showNoti: (state, action) => {
            state.show = action.payload;
        },
        showMessage: (state, action) => {
            state.message = action.payload;
        }
    }
});

// Persist Configuration
const persistConfig = {
    key: "showNoti",
    storage, // Stores in localStorage
};

export const { showNoti, showMessage } = showNotiSlice.actions;

// Wrap the reducer with persistReducer
export default persistReducer(persistConfig, showNotiSlice.reducer);
