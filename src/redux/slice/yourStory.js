import { createSlice } from "@reduxjs/toolkit";

let slice=createSlice({
    name:"yourStory",
    initialState:{
        story:[]
    }
    , reducers:{
        setYourStory:(state,action)=>{
            state.story=action.payload
        }
    }
})
export const {setYourStory}=slice.actions;
export default slice.reducer;