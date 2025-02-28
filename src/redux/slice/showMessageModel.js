import { createSlice } from "@reduxjs/toolkit";
let slice=createSlice({
    name:"showMessageModel",
    initialState:{
        showModel:false
    },
    reducers:{
        setShowMessageModel:(state,action)=>{
            state.showModel=action.payload;
        }
    }
})
export default slice.reducer;
export const { setShowMessageModel } = slice.actions;