import { model, Schema } from "mongoose";

let schema=new Schema({
    name:{
        type: String,
        required: true
    },
    people:[
        {
            type:Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    groupChat:{
        type:Boolean,
        default: false
    },
    avatar:{
        public_id:{
            type:String,
            default:Date.now()
        },
        url:{
            type:String,
        }
    },
    message: [
        {
            type:Schema.Types.ObjectId,
            ref: "Message"
        }
    ]
    ,
    createdBy:{
        type:Schema.Types.ObjectId,
        ref: "User"
    }
},{
    timestamps:true
});

let chat = model("Chat", schema);
export default chat;