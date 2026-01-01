import Gallery from "../models/galleryModel.js";
import Communities from "../models/communityModel.js";
import fs from "fs";

export const addPhotoToGallery = async(req, res) => {
    if(!req.file) return res.status(400).json({msg: "Mohon upload foto"});

    const { communityId, caption } = req.body;

    try {
        const community = await Communities.findOne({ where: { id: communityId } });
        if(!community) return res.status(404).json({msg: "Komunitas tidak ditemukan"});

        if(req.role !== "super_admin" && community.userId !== req.userId){
            return res.status(403).json({msg: "Anda bukan admin komunitas ini!"});
        }

        const filename = req.file.filename;

        await Gallery.create({
            foto_url: filename,
            caption: caption,
            communityId: communityId
        });

        res.status(201).json({msg: "Foto berhasil ditambahkan ke galeri"});
    } catch (error) {
        res.status(500).json({msg: error.message});
    }
}

export const getGalleryByCommunity = async(req, res) => {
    try {
        const response = await Gallery.findAll({
            where: { communityId: req.params.communityId }
        });
        res.json(response);
    } catch (error) {
        res.status(500).json({msg: error.message});
    }
}

export const deleteGalleryPhoto = async(req, res) => {
    try {
        const photo = await Gallery.findOne({
            where: { id: req.params.id },
            include: [{model: Communities}]
        });
        if(!photo) return res.status(404).json({msg: "Foto tidak ditemukan"});

        if(req.role !== "super_admin" && photo.community.userId !== req.userId){
            return res.status(403).json({msg: "Akses Ditolak"});
        }

        const filepath = `./public/uploads/${photo.foto_url}`;
        if(fs.existsSync(filepath)){
            fs.unlinkSync(filepath);
        }

        await Gallery.destroy({ where: { id: photo.id } });

        res.json({msg: "Foto berhasil dihapus"});
    } catch (error) {
        res.status(500).json({msg: error.message});
    }
}