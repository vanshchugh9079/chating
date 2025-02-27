import { model, Schema } from "mongoose";
let schema = new Schema({
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    people: [
        {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    media: {
        public_id: {
            type: String,
            default: Date.now()
        },
        url: {
            type: String
        }
    },
    likes: [
        {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    comment: [
        {
            type: Schema.Types.ObjectId,
            ref: "Comment"
        }
    ]
}, {
    timestamps: true
})
let Reel = model("Reel", schema);
export default Reel;