import * as multer from "multer";
import * as path from 'path';

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../../resource/uploads/images'))
    },
    filename: (req, file, cb) => cb(null, Date.now() + '.' + file.mimetype.split('/')[1]),
})

const upload = multer({ storage: storage });

export default upload;