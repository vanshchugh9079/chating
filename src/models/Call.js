import { model } from "mongoose";
import { Schema } from "mongoose";

let schema=new Schema({
    sender:{
        type:Schema.Types.ObjectId,
        ref:"User"
    }
    ,receiver:{
        type:Schema.Types.ObjectId,
        ref:"User"
    },
    call:{
        type:Boolean,
        default:false
    },
    accepted:{
        type:Boolean,
        default:false
    }
})
export default model("Call",schema)  //exporting the model to use in other