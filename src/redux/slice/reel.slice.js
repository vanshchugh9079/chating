import { createSlice } from "@reduxjs/toolkit";
let slice=createSlice({
    name:"reel",
    initialState:{
        reels: [],
    }
    , reducers:{
        setReel:(state,action)=>{
            state.reels=action.payload
        }
    }
})
export const {setReel}=slice.actions;
export default slice.reducer;