import { createSlice } from "@reduxjs/toolkit";

let slice = createSlice({
    name: "comment",
    initialState: {
        comment: {
            _id:"",
            media: {},
            type: "",
            comment: [],
            on:""
        },
    showComment: false
    }
    , reducers: {
        setComment: (state, action) => {
            state.comment = action.payload;
        },
        setShowComment: (state, action) => {
            state.showComment = action.payload;
        }
    }
})

export default slice.reducer;
export const { setComment, setShowComment } = slice.actions;