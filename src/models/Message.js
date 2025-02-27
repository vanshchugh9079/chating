import { model, Schema } from "mongoose"
let schema = new Schema({
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    content:{
        type:String,
    },
    chat:{
        type:Schema.Types.ObjectId,
        ref: "Chat"
    },
    attachment:{
        url:{
            type:String,
        },
        public_id:{
            type:String,
        }
    }
},{
    timestamps:true
})
let message=model("Message",schema);
export default message;