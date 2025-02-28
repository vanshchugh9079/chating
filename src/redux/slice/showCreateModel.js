import { createSlice } from "@reduxjs/toolkit";

let showCreateModelSlice=createSlice({
    name: "showCreateModel",
    initialState: {
        showModel:false,
        story:false,
    },
    reducers: {
        setShowModel: (state,action) => {
            state.showModel =!state.showModel;
            state.story = action.payload;
        }
    }
})
export const { setShowModel } = showCreateModelSlice.actions;
export default showCreateModelSlice.reducer;