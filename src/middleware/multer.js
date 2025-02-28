import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure the public directory exists
const uploadDir = "public";
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir); // Directory to save the uploaded files
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname)); // File name
    }
});

// Initialize upload variable
export const upload = multer({ storage: storage });
