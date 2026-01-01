import express from "express";
import { addPhotoToGallery, getGalleryByCommunity, deleteGalleryPhoto } from "../controllers/Gallery.js";
import { verifyToken } from "../middleware/VerifyToken.js";
import multer from "multer";
import path from "path";

const router = express.Router();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const fileFilter = (req, file, cb) => {
    if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png'){
        cb(null, true);
    } else {
        cb(null, false);
    }
}
const upload = multer({ storage: storage, fileFilter: fileFilter });

router.post('/gallery', verifyToken, upload.single('file'), addPhotoToGallery);

router.get('/gallery/:communityId', verifyToken, getGalleryByCommunity);

router.delete('/gallery/:id', verifyToken, deleteGalleryPhoto);

export default router;