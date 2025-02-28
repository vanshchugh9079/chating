import { createSlice } from "@reduxjs/toolkit";

let slice=createSlice({
    name:"profile",
    initialState:{
        profile: {},
    }
    , reducers:{
        setProfile:(state,action)=>{
            state.profile=action.payload
        }
    }
})
export const {setProfile}=slice.actions;
export default slice.reducer;