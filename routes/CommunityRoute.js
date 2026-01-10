import express from "express";
import { getCommunities, getCommunityById, getMyCommunity, createCommunity, deleteCommunity, updateCommunityByAdmin } from "../controllers/Communities.js";
import { verifyToken } from "../middleware/VerifyToken.js";
import { toggleLike } from "../controllers/Likes.js";
import { toggleJoinCommunity } from "../controllers/Members.js";
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

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter 
});

router.get('/communities', verifyToken, getCommunities);
router.get('/communities/:id', verifyToken, getCommunityById);
router.get('/my-community', verifyToken, getMyCommunity);

router.post('/communities', verifyToken, upload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'banner', maxCount: 1 }
]), createCommunity);
router.post('/like', verifyToken, toggleLike);
router.post('/join', verifyToken, toggleJoinCommunity);
router.delete('/communities/:id', verifyToken, deleteCommunity);
router.patch('/communities/:id', 
    verifyToken,
    upload.fields([{ name: 'file', maxCount: 1 }, { name: 'banner', maxCount: 1 }]), 
    updateCommunityByAdmin
);

export default router;