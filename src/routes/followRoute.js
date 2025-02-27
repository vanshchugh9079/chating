import { Router } from "express";
import tokenCheck from "../middleware/tokenCheck.js";
import follow from "../controller/user/follow.js";
let router = new Router();

router.get("/:id/:bool",tokenCheck,follow)

export default router;