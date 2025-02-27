import { model, Schema } from "mongoose";
let schema=new Schema({
    content:{
        type:String,
        required:true
    },
    likes:[
        {
            type:Schema.Types.ObjectId,
            ref:"User"
        }
    ],
    dislikes:[
        {
            type:Schema.Types.ObjectId,
            ref:"User"
        }
    ],
    createdBy:{
        type:Schema.Types.ObjectId,
        ref:"User"
    },
    link:[
        {
            url:{
                type:String,
            }
        }
    ]
},{
    timestamps:true,
})


let Comment = model("Comment", schema);
export default Comment;