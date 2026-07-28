import { Types } from "mongoose";
import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './Storage')
  },
  filename: function (req, file, cb) {
    file._id = new Types.ObjectId().toString();
    file.extension = path.extname(file.originalname);
    cb(null, `${file._id}${file.extension}`)
  }
})

const upload = multer({ storage })

export default upload;