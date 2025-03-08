import { Router } from "express";
let router=Router();
import { upload } from "../middleware/multer.js";
import tokenCheck from "../middleware/tokenCheck.js";
import createReel from "../controller/Reel/createReel.js";
import getReel from "../controller/Reel/getReel.js";
import saveReel from "../controller/Reel/saveReel.js";

router.post("/create",tokenCheck,upload.single("media"),createReel)
router.get("/get",tokenCheck,getReel)
router.get("/save/:saved/:id",tokenCheck,saveReel)
export default router;