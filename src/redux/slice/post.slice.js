import { createSlice } from "@reduxjs/toolkit";

let slice=createSlice({
    name:"post",
    initialState:{
        posts: [],
    }
    ,reducers:{
        setPost:(state,action)=>{
            state.posts=action.payload
        }
    }
})
export const {setPost}=slice.actions;
export default slice.reducer;