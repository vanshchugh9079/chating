import { createSlice } from "@reduxjs/toolkit";

let slice=createSlice({
    name:"edit",
    initialState:{
        showEditModel:false
    }
    ,
    reducers:{
        setShowEditModel:(state,action=!state.showEditModel)=>{
            state.showEditModel=action.payload
        }
    }
})
export const {setShowEditModel}=slice.actions
export default slice.reducer;  //export reducer  //export actions  //export slice  //export