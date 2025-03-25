import User from "../models/User.js"
import Call from "../models/Call.js"
let callController = async (socket, allUser, reciverId, id) => {
    let receiver = await User.findById(reciverId)
    let sender = await User.findById(id).select("name avatar _id ");
    let call = await Call.create({
        sender: sender._id,
        receiver: receiver._id,
        call:true
    })
    console.log(allUser.get(receiver._id.toString()));
    setTimeout(() => {
        socket.to(allUser.get(receiver._id.toString())).emit("call-ended", call)
        console.log("call ended success");
    }, 60000)
    socket.to(allUser.get(receiver._id.toString())).emit("recieving-call", call)
    socket.emit("make-call", call)
}
let callAccept =async (socket, allUser,callId,accept) => {
    let call=await Call.findById(callId);
    console.log(call);
    if(accept){
        call.accepted=true
    }
    else{
        call.accepted=false
        call.call=false
    }
    await call.save()
    if(accept){
        socket.to(allUser.get(call.sender._id.toString())).emit("call-accepted", call)
    }
    else{
        socket.to(allUser.get(call.sender._id.toString())).emit("call-rejected", call)
    }
}
let callOnAccept=async(socket,allUser,callId,offer)=>{
    let call=await Call.findById(callId);
    socket.to(allUser.get(call.receiver._id.toString())).emit("get-offer",{
        offer:offer,
        call:call
    })
}
export { callController, callAccept, callOnAccept } 