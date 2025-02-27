import { Router } from "express";
import createChat from "../controller/chat/createChat.js";
import tokenCheck from "../middleware/tokenCheck.js";
import getChat from "../controller/chat/getChat.js";
import getAllChat from "../controller/chat/getAllChat.js";
let route=Router()
route.post("/create",tokenCheck,createChat)
route.get("/get/:id",tokenCheck,getChat)
route.get("/",tokenCheck,getAllChat)
export default route;