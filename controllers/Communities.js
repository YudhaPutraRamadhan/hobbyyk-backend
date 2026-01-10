import Communities from "../models/communityModel.js";
import Users from "../models/userModel.js";
import Members from "../models/memberModel.js";
import Likes from "../models/likeModel.js";
import fs from "fs";
import path from "path";
import { Op } from "sequelize";

export const getCommunities = async(req, res) => {
    try {
        const { search, category } = req.query; 
        
        let whereCondition = {};

        if (search) {
            whereCondition.nama_komunitas = {
                [Op.like]: `%${search}%`
            };
        }

        if (category && category !== "Semua") {
            whereCondition.kategori = category;
        }

        const response = await Communities.findAll({
            where: whereCondition, 
            include:[{
                model: Users,
                attributes:['username','email']
            }]
        });
        
        res.json(response);
    } catch (error) {
        res.status(500).json({msg: error.message});
    }
}

export const getCommunityById = async(req, res) => {
    try {
        const community = await Communities.findOne({
            where:{ id: req.params.id },
            include:[{
                model: Users,
                attributes:['username','email', 'profile_pic', 'no_hp']
            }]
        });

        if(!community) return res.status(404).json({msg: "Data tidak ditemukan"});

        const totalMembers = await Members.count({
            where: { communityId: community.id }
        });

        const totalLikes = await Likes.count({
            where: { communityId: community.id }
        });

        let isJoined = false;
        let isLiked = false;

        if(req.userId){
            const checkMember = await Members.findOne({
                where: { userId: req.userId, communityId: community.id }
            });
            if(checkMember) isJoined = true;

            const checkLike = await Likes.findOne({
                where: { userId: req.userId, communityId: community.id }
            });
            if(checkLike) isLiked = true;
        }

        const result = {
            ...community.toJSON(),
            logo_community: `${req.protocol}://${req.get("host")}/uploads/${community.logo_community}`,
            banner_community: `${req.protocol}://${req.get("host")}/uploads/${community.banner_community}`,
            total_anggota: totalMembers,
            total_likes: totalLikes,
            is_joined: isJoined,
            is_liked: isLiked
        };

        res.status(200).json(result);

    } catch (error) {
        res.status(500).json({msg: error.message});
    }
}

export const createCommunity = async(req, res) => {
    if(!req.files || !req.files['file']) {
        return res.status(400).json({msg: "Mohon upload logo komunitas"});
    }

    const { nama_komunitas, kategori, deskripsi, lokasi, kontak, link_grup } = req.body;

    if(!nama_komunitas || !kategori || !deskripsi || !lokasi) {
        return res.status(400).json({msg: "Data utama (Nama, Kategori, Deskripsi, Lokasi) tidak boleh kosong"});
    }

    if (link_grup && link_grup.trim() !== "") {
        const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/;
        if (!urlPattern.test(link_grup)) {
            return res.status(400).json({msg: "Format link grup tidak valid"});
        }
    }

    try {
        const exist = await Communities.findOne({
            where: { nama_komunitas: nama_komunitas }
        });
        if(exist) return res.status(400).json({msg: "Nama komunitas sudah digunakan, cari nama lain"});

        const fileLogo = req.files['file'][0].filename;
        let fileBanner = null;
        if(req.files['banner']){
            fileBanner = req.files['banner'][0].filename;
        }

        await Communities.create({
            nama_komunitas: nama_komunitas,
            kategori: kategori,
            deskripsi: deskripsi,
            lokasi: lokasi,
            kontak: kontak || "",
            link_grup: link_grup || "",
            foto_url: fileLogo,
            banner_url: fileBanner, 
            userId: req.userId
        });

        res.status(201).json({msg: "Komunitas Berhasil Dibuat"});
    } catch (error) {
        console.log(error);
        res.status(500).json({msg: "Terjadi kesalahan pada server saat membuat komunitas"});
    }
}

export const updateCommunity = async(req, res) => {
    try {
        const community = await Communities.findOne({
            where: {
                id: req.params.id
            }
        });

        if(!community) return res.status(404).json({msg: "Data tidak ditemukan"});

        // Validasi: Cuma pemilik (UserId sama) yang boleh edit
        // Note: req.userId didapat dari middleware verifyToken
        if(req.role !== "admin" && req.userId !== community.userId){
            return res.status(403).json({msg: "Akses terlarang"});
        }

        const { nama_komunitas, deskripsi, link_grup } = req.body;

        await Communities.update({
            nama_komunitas: nama_komunitas,
            deskripsi: deskripsi,
            link_grup: link_grup
            // banner/foto kita skip dulu biar simpel, fokus benerin link
        },{
            where:{
                id: community.id
            }
        });

        res.status(200).json({msg: "Komunitas berhasil diupdate"});
    } catch (error) {
        res.status(500).json({msg: error.message});
    }
}

export const deleteCommunity = async(req, res) => {
    try {
        const community = await Communities.findOne({
            where: { id: req.params.id }
        });
        if(!community) return res.status(404).json({msg: "Data tidak ditemukan"});

        if(req.role === "admin" || req.role === "user"){
            if(req.userId !== community.userId) return res.status(403).json({msg: "Akses terlarang"});
        }

        const filepathLogo = `./public/uploads/${community.foto_url}`;
        if(fs.existsSync(filepathLogo)) fs.unlinkSync(filepathLogo);

        if(community.banner_url){
            const filepathBanner = `./public/uploads/${community.banner_url}`;
            if(fs.existsSync(filepathBanner)) fs.unlinkSync(filepathBanner);
        }

        await Communities.destroy({
            where:{
                id: community.id
            }
        });
        res.status(200).json({msg: "Komunitas Berhasil Dihapus"});
    } catch (error) {
        res.status(500).json({msg: error.message});
    }
}

export const updateCommunityByAdmin = async(req, res) => {
    try {
        const community = await Communities.findOne({
            where: { id: req.params.id }
        });

        if(!community) return res.status(404).json({msg: "Komunitas tidak ditemukan"});

        if(community.userId !== req.userId && req.role !== "superadmin") {
            return res.status(403).json({msg: "Akses ditolak: Anda bukan pemilik komunitas ini"});
        }

        const { nama_komunitas, lokasi, deskripsi, kategori, kontak, link_grup } = req.body;

        if(!nama_komunitas || !lokasi || !deskripsi || !kategori) {
            return res.status(400).json({msg: "Nama, Lokasi, Deskripsi, dan Kategori wajib diisi"});
        }

        if (link_grup && link_grup.trim() !== "") {
            const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/;
            if (!urlPattern.test(link_grup)) {
                return res.status(400).json({msg: "Format link grup tidak valid (harus berupa URL)"});
            }
        }

        const communityExist = await Communities.findOne({
            where: {
                nama_komunitas: nama_komunitas,
                id: { [Op.ne]: community.id }
            }
        });
        if(communityExist) return res.status(400).json({msg: "Nama komunitas sudah digunakan oleh komunitas lain"});

        let updateData = {
            nama_komunitas,
            lokasi,
            deskripsi,
            kategori,
            kontak: kontak || "",
            link_grup: link_grup || ""
        };

        if (req.files && req.files['file']) {
            const newLogoFileName = req.files['file'][0].filename;
            updateData.foto_url = newLogoFileName;

            if(community.foto_url) {
                const oldPath = path.join("./public/uploads", community.foto_url);
                if(fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
        }

        if (req.files && req.files['banner']) {
             const newBannerFileName = req.files['banner'][0].filename;
             updateData.banner_url = newBannerFileName;

             if(community.banner_url) {
                 const oldBannerPath = path.join("./public/uploads", community.banner_url);
                 if(fs.existsSync(oldBannerPath)) fs.unlinkSync(oldBannerPath);
             }
        }

        await Communities.update(updateData, {
            where:{ id: community.id }
        });

        res.status(200).json({msg: "Komunitas berhasil diperbarui"});
    } catch (error) {
        console.log(error);
        res.status(500).json({msg: "Terjadi kesalahan server saat memperbarui komunitas"});
    }
}

export const getMyCommunity = async(req, res) => {
    try {
        const community = await Communities.findOne({
            where: { userId: req.userId }
        });

        if(!community) return res.status(200).json(null);

        res.status(200).json(community);
    } catch (error) {
        res.status(500).json({msg: error.message});
    }
}