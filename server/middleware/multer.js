/*import multer from "multer";

const storage = multer.memoryStorage(); // store file in memory temporarily
const upload = multer({ storage });

export default upload;
*/
import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/"); // make sure this folder exists
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({ storage });

export default upload;
