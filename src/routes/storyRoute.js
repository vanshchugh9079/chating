import { Router } from "express";
import tokenCheck from "../middleware/tokenCheck.js";
import { upload } from "../middleware/multer.js";
import createStory from "../controller/story/createStory.js";
import getStory from "../controller/story/getStory.js";
import getFriendStory from "../controller/story/getFriendStory.js";
let router=Router()
router.post("/create",tokenCheck,upload.single("media"),createStory)
router.get("/get/:id",tokenCheck,getStory)
router.get("/get",tokenCheck,getFriendStory)
export default router;