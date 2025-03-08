import { Router } from "express";
import tokenCheck from "../middleware/tokenCheck.js"
import {upload} from "../middleware/multer.js"
import postCreate from "../controller/post/postCreate.js";
import likeOrDislike from "../controller/post/likeOrDislike.js";
import getPost from "../controller/post/getPost.js";
import savePost from "../controller/post/savePost.js";
let router=Router();
router.post("/create",tokenCheck,upload.single("media"),postCreate)
router.get("/like-or-dislike/:id/:like",tokenCheck,likeOrDislike)
router.get("/get",tokenCheck,getPost)
router.get("/save/:saved/:id",tokenCheck,savePost)
export default router;