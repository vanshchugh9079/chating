import { Router } from "express";
import tokenCheck from "../middleware/tokenCheck.js";
import getNotifation from "../controller/notification/notification.controller.js";
let router =  Router();
router.get("/get/:type",tokenCheck,getNotifation)
export default router;