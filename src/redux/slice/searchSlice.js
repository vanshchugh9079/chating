import { createSlice } from "@reduxjs/toolkit";

let slice=createSlice({
    name:"search",
    initialState:{
        showSearchBar:false,
    }
    , reducers:{
       setShowSearchBar:(state,action)=>{
        state.showSearchBar=action.payload;
       }
    }
})
export default slice.reducer;
export const {setShowSearchBar}=slice.actions;