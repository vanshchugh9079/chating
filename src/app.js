import express, { urlencoded } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import userRoute from "./routes/user.route.js"
import postRoute from "./routes/post.route.js"
import followRoute from "./routes/followRoute.js"
import reelRoute from "./routes/reel.route.js"
import chatRoute from "./routes/chatRoute.js"
import notificationRoute from "./routes/notificationRoute.js"
import storyRoute from "./routes/storyRoute.js"
import commentRoute from "./routes/commentRoute.js"
let app = express();
// setup  Middleware
app.use(express.json());
app.use(cors({
    origin:"*",
    credentials: true
}))
app.use(cookieParser())
app.use(urlencoded({
    extended:true,
}))
app.use(express.static(path.join("C:\Users\Administrator\Desktop\wattasapp\backend>", 'public')));
// Routes
app.use("/api/user",userRoute)
app.use("/api/post",postRoute)
app.use("/api/follow",followRoute)
app.use("/api/reel",reelRoute)
app.use("/api/chat",chatRoute)
app.use("/api/notification",notificationRoute)
app.use("/api/story",storyRoute)
app.use("/api/comment",commentRoute)
export default app;