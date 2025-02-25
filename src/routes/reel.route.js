import { Router } from "express";
let router=Router();
import { upload } from "../middleware/multer.js";
import tokenCheck from "../middleware/tokenCheck.js";
import createReel from "../controller/Reel/createReel.js";
import getReel from "../controller/Reel/getReel.js";

router.post("/create",tokenCheck,upload.single("media"),createReel)
router.get("/get",tokenCheck,getReel)
export default router;