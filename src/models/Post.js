import { model,Schema } from "mongoose";
let Post=new Schema({
    createdBy:{
        type:Schema.Types.ObjectId,
        ref:"User"
    },
    people:[
        {
            type:Schema.Types.ObjectId,
            ref:"User"
        }
    ],    
    media:{
        public_id:{
            type:String,
            default:Date.now()
        },
        url:{
            type:String,
        }
    },
    likes:[
        {
            type:Schema.Types.ObjectId,
            ref:"User"
        }
    ],
    comment:[
        {
            type:Schema.Types.ObjectId,
            ref:"Comment"
        }
    ]
},{
    timestamps:true
})
let PostModel= model("Post",Post)
export default PostModel;