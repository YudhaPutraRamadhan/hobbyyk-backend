import express from "express";
import { 
    getUsers, 
    Register, 
    Login, 
    VerifyOTP, 
    ResendOtp, 
    updateProfile, 
    deleteUser, 
    updateUserByAdmin, 
    createUserByAdmin,
    getMe,
    reqChangePassOtp,
    verifyChangePass,
    reqChangeEmailOtp,
    verifyChangeEmail, 
    requestAdminAccount
} from "../controllers/Users.js";
import { verifyToken } from "../middleware/VerifyToken.js";
import multer from "multer";
import path from "path";

const router = express.Router();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, 'profile_' + Date.now() + path.extname(file.originalname));
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

router.get('/users', getUsers);
router.post('/users', Register);
router.post('/verify-otp', VerifyOTP);
router.post('/resend-otp', ResendOtp);
router.post('/login', Login);
router.post('/request-admin', requestAdminAccount);

router.get('/users/me', verifyToken, getMe);
router.patch('/users/profile', verifyToken, upload.fields([{ name: 'profile_pic', maxCount: 1 }]), updateProfile);
router.post('/users/me/password/otp', verifyToken, reqChangePassOtp);
router.patch('/users/me/password/verify', verifyToken, verifyChangePass);
router.post('/users/me/email/otp', verifyToken, reqChangeEmailOtp);
router.patch('/users/me/email/verify', verifyToken, verifyChangeEmail);
router.post('/users/admin', verifyToken, createUserByAdmin);
router.patch('/users/:id', verifyToken, updateUserByAdmin);
router.delete('/users/:id', verifyToken, deleteUser);

export default router;