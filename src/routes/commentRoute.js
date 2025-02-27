import { Router } from "express";
import tokenCheck from "../middleware/tokenCheck.js";
import getReelComment from "../controller/comment/getReelComment.js";

let router=new Router();

router.get("/reel/:id",tokenCheck,getReelComment)
router.get("/post/:id",tokenCheck,getReelComment)

export default router
