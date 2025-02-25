import { model, Schema } from "mongoose";
// user is created By;
let schema=new Schema({
    user:{
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    content:{
        type:String
    }
    ,
    type:{
        type: String,
        enum:["post", "reel", "message", "follow","request","information"]
    },
    seen:{
        type:Boolean,
        default: false
    },
    post:{
        type: Schema.Types.ObjectId,
        ref: "Post"
    },
    reel:{
        type: Schema.Types.ObjectId,
        ref: "Reel"
    },
    profile:{
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    on:{
        type:String,
        enum:["post","reel","profile"]
    }
},{
    timestamps: true,
})
let Notification=model("Notification",schema)
export default Notification;