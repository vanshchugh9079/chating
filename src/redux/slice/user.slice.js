import { createSlice } from "@reduxjs/toolkit";
import { persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage"; // Default to localStorage for web

const userSlice = createSlice({
    name: "user",
    initialState: {
        user: {},
        loggedIn: false,
    },
    reducers: {
        setUserData: (state, action) => {
            console.log(action.payload);
            state.user = action.payload.user;
            state.loggedIn = action.payload.loggedIn;
        },
    },
});

const persistConfig = {
    key: "user",
    storage,
};

const persistedReducer = persistReducer(persistConfig, userSlice.reducer);

export const { setUserData } = userSlice.actions;
export default persistedReducer;
