import { Router } from "express";
import { upload } from "../middleware/multer.js";
import register from "../controller/user/register.js";
import login from "../controller/user/login.js";
import getUser from "../controller/user/getUser.js";
import getProfile from "../controller/Profile/getProfile.js";
import tockenCheck from "../middleware/tokenCheck.js";
import searchUser from "../controller/user/searchUser.js";
let router=Router();
router.post("/create",upload.single("avatar"),register)
router.post("/login",login)
// router.get("/:id",getUser)
// router.get("/",getUser)
router.get("/search/:name",tockenCheck,searchUser)
router.get("/profile/:name",tockenCheck,getProfile)
export default router;