import Users from "../models/userModel.js";
import Communities from "../models/communityModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import fs from "fs";
import validator from "validator";
import path from "path";

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

export const getUsers = async(req, res) => {
    try {
        const users = await Users.findAll({
            attributes: ['id', 'username', 'email', 'role', 'is_verified']
        });
        res.json(users);
    } catch (error) {
        console.log(error);
    }
}

export const Register = async(req, res) => {
    const { username, email, password, confPassword, role } = req.body;
    
    if(password !== confPassword) return res.status(400).json({msg: "Password dan Confirm Password tidak cocok"});
    
    try {
        const emailExist = await Users.findOne({ where: { email: email } });
        if(emailExist && emailExist.is_verified) {
            return res.status(400).json({msg: "Email sudah digunakan"});
        }

        const usernameExist = await Users.findOne({ where: { username: username } });
        if(usernameExist) {
            return res.status(400).json({msg: "Username sudah digunakan"});
        }
        
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiration = new Date(Date.now() + 5 * 60 * 1000);

        if(emailExist && !emailExist.is_verified) {
            const salt = await bcrypt.genSalt();
            const hashPassword = await bcrypt.hash(password, salt);
            
            await Users.update({
                username: username,
                password: hashPassword,
                otp: otpCode,
                otp_expiration: otpExpiration
            }, {
                where: { email: email }
            });

            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Kode Verifikasi Baru - HobbyYK',
                text: `Halo ${username}, pendaftaran ulang berhasil.\n\nKode verifikasi baru Anda: ${otpCode}\n\nKode ini berlaku selama 5 menit.`
            });

            return res.status(200).json({msg: "Data diperbarui. Kode OTP baru telah dikirim."});
        }

        const salt = await bcrypt.genSalt();
        const hashPassword = await bcrypt.hash(password, salt);
    
        await Users.create({
            username: username,
            email: email,
            password: hashPassword,
            role: role || 'user', 
            otp: otpCode,      
            otp_expiration: otpExpiration,
            is_verified: false   
        });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Kode Verifikasi HobbyYK',
            text: `Halo ${username}, terima kasih telah mendaftar di HobbyYK.\n\nKode verifikasi akun Anda adalah: ${otpCode}\n\nKode ini berlaku selama 5 menit.`
        });

        res.status(201).json({msg: "Register Berhasil. Silakan cek email Anda."});

    } catch (error) {
        console.log(error);
        res.status(500).json({msg: "Terjadi kesalahan server."});
    }
}

export const VerifyOTP = async(req, res) => {
    const { email, otp } = req.body;

    try {
        const user = await Users.findOne({ where: { email: email } });
        
        if(!user) return res.status(404).json({msg: "Email tidak ditemukan"});
        
        if(user.otp !== otp) return res.status(400).json({msg: "Kode OTP Salah!"});

        const now = new Date();
        if(now > new Date(user.otp_expiration)) {
             return res.status(400).json({msg: "Kode OTP Kadaluarsa! Silakan minta kirim ulang."});
        }

        await Users.update({ 
            is_verified: true, 
            otp: null,
            otp_expiration: null
        }, {
            where: { id: user.id }
        });

        res.status(200).json({msg: "Verifikasi Berhasil! Akun Anda sudah aktif."});
    } catch (error) {
        console.log(error);
        res.status(500).json({msg: error.message});
    }
}

export const ResendOtp = async(req, res) => {
    const { email } = req.body;
    try {
        const user = await Users.findOne({ where: { email: email } });
        if(!user) return res.status(404).json({msg: "Email tidak ditemukan"});
        
        if(user.is_verified) return res.status(400).json({msg: "Akun ini sudah terverifikasi."});

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiration = new Date(Date.now() + 5 * 60 * 1000);

        await Users.update({
            otp: otpCode,
            otp_expiration: otpExpiration
        }, { where: { email: email } });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Kirim Ulang Kode Verifikasi - HobbyYK',
            text: `Kode verifikasi baru Anda adalah: ${otpCode}\n\nKode ini berlaku selama 5 menit.`
        });

        res.json({msg: "OTP Baru telah dikirim"});
    } catch (error) {
        res.status(500).json({msg: error.message});
    }
}

export const Login = async(req, res) => {
    try {
        const user = await Users.findAll({
            where:{
                email: req.body.email
            }
        });
        
        if (user.length === 0) return res.status(404).json({msg: "Email tidak ditemukan"});

        if(!user[0].is_verified) return res.status(400).json({msg: "Akun belum diverifikasi! Silakan cek email Anda."});

        const match = await bcrypt.compare(req.body.password, user[0].password);
        if(!match) return res.status(400).json({msg: "Password Salah"});

        const userId = user[0].id;
        const username = user[0].username;
        const email = user[0].email;
        const role = user[0].role;

        const accessToken = jwt.sign({userId, username, email, role}, process.env.JWT_SECRET, {
            expiresIn: '30d'
        });

        res.json({ 
            accessToken, 
            role, 
            userId, 
            username 
        });

    } catch (error) {
        res.status(500).json({msg: "Terjadi kesalahan pada server"});
    }
}

export const deleteUser = async(req, res) => {
    try {
        const user = await Users.findOne({
            where: {
                id: req.params.id
            }
        });

        if(!user) return res.status(404).json({msg: "User tidak ditemukan"});

        if(user.role === "super_admin") {
             return res.status(403).json({msg: "Anda tidak bisa menghapus sesama Super Admin!"});
        }

        await Users.destroy({
            where:{
                id: user.id
            }
        });

        res.status(200).json({msg: "User berhasil dihapus (Banned)"});
    } catch (error) {
        res.status(400).json({msg: error.message});
    }
}

export const updateUserByAdmin = async(req, res) => {
    try {
        const user = await Users.findOne({
            where: {
                id: req.params.id
            }
        });

        if(!user) return res.status(404).json({msg: "User tidak ditemukan"});

        const { username, email, role, is_verified } = req.body;

        await Users.update({
            username: username,
            email: email,
            role: role,
            is_verified: is_verified
        },{
            where:{
                id: user.id
            }
        });

        res.status(200).json({msg: "Data User Berhasil Diupdate"});
    } catch (error) {
        res.status(400).json({msg: error.message});
    }
}

export const createUserByAdmin = async(req, res) => {
    const { username, email, role } = req.body;
    
    const userExists = await Users.findOne({ where: { email: email } });
    if (userExists) return res.status(400).json({ msg: "Email sudah digunakan" });

    const salt = await bcrypt.genSalt();
    const hashPassword = await bcrypt.hash("123456", salt);

    try {
        await Users.create({
            username: username,
            email: email,
            password: hashPassword,
            role: role || "user",
            is_verified: true,
            otp: null
        });
        res.status(201).json({msg: "User berhasil dibuat (Password default: 123456)"});
    } catch (error) {
        res.status(400).json({msg: error.message});
    }
}

export const getMe = async (req, res) => {
    try {
        const user = await Users.findOne({
            attributes: ['id', 'username', 'email', 'role', 'profile_pic', 'bio', 'no_hp'],
            where: { id: req.userId }
        });

        if (!user) return res.status(404).json({ msg: "User tidak ditemukan" });

        let communityData = null;

        if (user.role !== 'user') {
            communityData = await Communities.findOne({
                where: { userId: user.id },
                attributes: ['id', 'nama_komunitas']
            });
        }

        res.status(200).json({
            user: user,
            managed_community: communityData
        });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const user = await Users.findOne({ where: { id: req.userId } });
        if (!user) return res.status(404).json({ msg: "User tidak ditemukan" });

        const { username, bio, no_hp } = req.body;

        if (username !== user.username) {
            const usernameExists = await Users.findOne({ where: { username: username } });
            if (usernameExists) return res.status(400).json({ msg: "Username sudah digunakan" });
        }
        if (bio && bio.length > 150) {
            return res.status(400).json({ msg: "Bio maksimal 150 karakter" });
        }

        if (no_hp) {
            const phoneRegex = /^\d+$/;
            if (!phoneRegex.test(no_hp)) {
                return res.status(400).json({ msg: "Nomor HP hanya boleh berisi angka" });
            }
            if (no_hp.length < 10 || no_hp.length > 13) {
                return res.status(400).json({ msg: "Nomor HP harus antara 10 sampai 13 digit" });
            }
        }

        let fileName = user.profile_pic;
        
        if (req.files && req.files.profile_pic) {
            const file = req.files.profile_pic[0];

            if (user.profile_pic) {
                const oldPath = `./public/uploads/${user.profile_pic}`;
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
            fileName = file.filename;
        }

        await Users.update({
            username: username,
            bio: bio,
            no_hp: no_hp,
            profile_pic: fileName
        }, {
            where: { id: user.id }
        });

        res.status(200).json({ msg: "Profil berhasil diperbarui" });
    } catch (error) {
        res.status(500).json({ msg: "Terjadi kesalahan server: " + error.message });
    }
};

export const reqChangePassOtp = async (req, res) => {
    try {
        const user = await Users.findOne({ where: { id: req.userId } });
        
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiration = new Date(new Date().getTime() + 5 * 60000);

        await Users.update({ otp: otpCode, otp_expiration: expiration }, { where: { id: user.id } });

        await transporter.sendMail({
            from: 'HobbyYk Admin',
            to: user.email,
            subject: 'OTP Ganti Password',
            text: `Kode OTP Anda adalah: ${otpCode}. Jangan berikan ke siapapun.`
        });

        res.status(200).json({ msg: "OTP telah dikirim ke email Anda" });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

export const verifyChangePass = async (req, res) => {
    const { otp, newPassword, confPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
        return res.status(400).json({ msg: "Password minimal 8 karakter" });
    }
    if (newPassword !== confPassword) {
        return res.status(400).json({ msg: "Password dan Confirm Password tidak cocok" });
    }

    try {
        const user = await Users.findOne({ where: { id: req.userId } });
        if (!user) return res.status(404).json({ msg: "User tidak ditemukan" });

        if (user.otp !== otp || new Date() > new Date(user.otp_expiration)) {
            return res.status(400).json({ msg: "OTP salah atau kadaluarsa" });
        }

        const salt = await bcrypt.genSalt();
        const hashPassword = await bcrypt.hash(newPassword, salt);

        await Users.update({ 
            password: hashPassword,
            otp: null,
            otp_expiration: null
        }, { where: { id: user.id } });

        res.status(200).json({ msg: "Password berhasil diubah!" });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

export const reqChangeEmailOtp = async (req, res) => {
    const { newEmail } = req.body;

    if (!newEmail || !validator.isEmail(newEmail)) {
        return res.status(400).json({ msg: "Format email tidak valid" });
    }

    try {
        const checkEmail = await Users.findOne({ where: { email: newEmail } });
        if (checkEmail) return res.status(400).json({ msg: "Email sudah digunakan user lain" });

        const user = await Users.findOne({ where: { id: req.userId } });
        
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiration = new Date(Date.now() + 5 * 60000);

        await Users.update({ otp: otpCode, otp_expiration: expiration }, { where: { id: user.id } });

        await transporter.sendMail({
            from: 'HobbyYk Admin',
            to: newEmail, 
            subject: 'Verifikasi Ganti Email',
            text: `Kode OTP untuk mengganti email Anda adalah: ${otpCode}.`
        });

        res.status(200).json({ msg: `OTP dikirim ke ${newEmail}` });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

export const verifyChangeEmail = async (req, res) => {
    const { otp, newEmail } = req.body;

    if (!newEmail || !validator.isEmail(newEmail)) {
        return res.status(400).json({ msg: "Format email tidak valid" });
    }

    try {
        const user = await Users.findOne({ where: { id: req.userId } });

        if (user.otp !== otp || new Date() > new Date(user.otp_expiration)) {
            return res.status(400).json({ msg: "OTP salah atau kadaluarsa" });
        }

        const emailTaken = await Users.findOne({ where: { email: newEmail } });
        if (emailTaken) return res.status(400).json({ msg: "Email sudah digunakan user lain" });

        await Users.update({ 
            email: newEmail,
            otp: null,
            otp_expiration: null
        }, { where: { id: user.id } });

        res.status(200).json({ msg: "Email berhasil diganti!" });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

export const requestAdminAccount = async (req, res) => {
    const { username, email } = req.body; 

    if (!username || !email) return res.status(400).json({ msg: "Username dan Email wajib diisi" });
    
    const emailRegexp = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if(!emailRegexp.test(email)) return res.status(400).json({ msg: "Format email tidak valid" });

    try {
        const existingUser = await Users.findOne({ where: { email: email } });
        if (existingUser) return res.status(400).json({ msg: "Email ini sudah terdaftar di sistem!" });

        const existingUsername = await Users.findOne({ where: { username: username } });
        if (existingUsername) return res.status(400).json({ msg: "Username sudah digunakan, cari nama lain" });

        const randomPassword = Math.floor(100000 + Math.random() * 900000).toString();
        const salt = await bcrypt.genSalt();
        const hashPassword = await bcrypt.hash(randomPassword, salt);

        await Users.create({
            username: username,
            email: email,
            password: hashPassword,
            role: "admin_komunitas",
            is_verified: true
        });

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER, 
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: '🔐 Akses Akun Admin Komunitas HobbyYk',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <h2 style="color: #2196F3;">Selamat Datang di HobbyYk! 👋</h2>
                    <p>Halo <b>${username}</b>,</p>
                    <p>Permintaan akun Admin Komunitas Anda telah berhasil dibuat.</p>
                    <p>Silakan gunakan kredensial berikut untuk login:</p>
                    
                    <div style="background-color: #f0f8ff; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
                        <p style="margin: 5px 0;">Email Login:</p>
                        <strong style="font-size: 16px;">${email}</strong>
                        
                        <p style="margin: 15px 0 5px 0;">Password Sementara:</p>
                        <strong style="font-size: 24px; letter-spacing: 5px; color: #333;">${randomPassword}</strong>
                    </div>

                    <p><i>Demi keamanan, mohon segera ganti password Anda setelah berhasil login.</i></p>
                    <br>
                    <p>Salam,<br><b>Sistem HobbyYk</b></p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ msg: "Sukses! Cek email Anda untuk mendapatkan password." });

    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: "Terjadi kesalahan server", error: error.message });
    }
}