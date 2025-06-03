import { createSlice } from "@reduxjs/toolkit";

let slice=createSlice({
    name:"showMessage",
    initialState:{
        showMessage:false
    },
    reducers:{
        setShowMessage:(state,action)=>{
            state.showMessage=action.payload
        }
    }
})
export default slice.reducer
export const{setShowMessage} = slice.actions