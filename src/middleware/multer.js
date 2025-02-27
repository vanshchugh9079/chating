import multer from "multer"
import path from "path"
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/'); // Directory to save the uploaded files
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname)); // File name
    }
});
// Initialize upload variable
export const upload = multer({ storage: storage });