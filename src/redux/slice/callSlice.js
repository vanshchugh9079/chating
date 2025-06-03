import { createSlice } from "@reduxjs/toolkit";

let slice=createSlice({
    name:"call",
    initialState:{
        call:{},
        who:"",
        call:{}
    },
    reducers:{
        setCall:(state,action)=>{
            state.call=action.payload;
        }
        ,
        setShowCall:(state,action)=>{
            state.showCall=action.payload;
        },
        setWho:(state,action)=>{
            state.who=action.payload;
        }
    }
})
export default slice.reducer;
export const {setCall, setShowCall,setWho}=slice.actions;  //exporting the actions