import { createSlice } from "@reduxjs/toolkit";

let slice=createSlice({
    name:"story",
    initialState:{
        name:"",
        avatar:{},
        media:{},
        showStory:false,
        you:false
    },
    reducers:{
        setStory:(state,action)=>{
            state.name=action.payload.name;
            state.avatar=action.payload.avatar;
            state.media=action.payload.media;
            state.you=action.payload.you;
        },
        setShowStory:(state,action)=>{
            state.showStory=action.payload
        }
    }
})
export default slice.reducer;
export const {setStory, setShowStory}=slice.actions;