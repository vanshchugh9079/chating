
import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage"; // Uses localStorage by default

// Import your reducers
import showCreateModel from "../redux/slice/showCreateModel";
import userSlice from "./slice/user.slice";
import postSlice from "./slice/post.slice";
import profile from "./slice/profile";
import reelSlice from "./slice/reel.slice.js";
import showMessage from "../redux/slice/messageSlice.js";
import showMessageModel from "../redux/slice/showMessageModel.js";
import searchSlice from "../redux/slice/searchSlice.js";
import showStoryModel from "../redux/slice/showStoryModel.js";
import youStory from "../redux/slice/yourStory.js";
import comment from "../redux/slice/commentSlice.js";
import showNoti from "../redux/slice/showMobileNotification.js";
import editSilce from "../redux/slice/editSlice.js";
import callSlice from "../redux/slice/callSlice.js";


// Combine all reducers
const rootReducer = combineReducers({
    profile: profile,
    showCreateModel: showCreateModel,
    user: userSlice, // Persisted slice
    post: postSlice,
    reel: reelSlice,
    showMessage: showMessage,
    showMessageModel: showMessageModel,
    showSearchBar: searchSlice,
    story: showStoryModel,
    yourStory: youStory,
    comment: comment,
    showNoti: showNoti, // Persisted slice
    edit:editSilce,
    call:callSlice
});

// Persist configuration
const persistConfig = {
    key: "root",
    storage,
    whitelist: ["user", "showNoti"], // Persist user and showNoti only
};

// Apply persist reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Create Redux store
export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false, // Required for Redux Persist
        }),
});

// Create Persistor
export const persistor = persistStore(store);
