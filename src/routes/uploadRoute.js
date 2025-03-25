import { Router } from "express";
import { upload } from "../middleware/multer.js";
import uploadController from "../controller/upload/upload.js";
let router=new Router();
router.post("/file",upload.single("file"),uploadController);
export default router;