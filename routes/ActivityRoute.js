import express from "express";
import { getActivitiesByCommunity, getActivityById, createActivity, updateActivity, deleteActivity, getAllActivities } from "../controllers/Activity.js";
import { verifyToken } from "../middleware/VerifyToken.js";
import multer from "multer";
import path from "path";

const router = express.Router();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, 'activity_' + Date.now() + path.extname(file.originalname));
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

router.get('/activities/feed', verifyToken, getAllActivities);
router.get('/activities/community/:communityId', getActivitiesByCommunity);
router.get('/activities/:id', getActivityById);
router.post('/activities', upload.array('foto_kegiatan', 2), createActivity);
router.patch('/activities/:id', upload.array('foto_kegiatan', 2), updateActivity);
router.delete('/activities/:id', deleteActivity);

export default router;