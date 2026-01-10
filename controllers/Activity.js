import Activities from "../models/activityModel.js";
import Communities from "../models/communityModel.js";
import path from "path";
import fs from "fs";

Communities.hasMany(Activities, { foreignKey: 'communityId' });
Activities.belongsTo(Communities, { foreignKey: 'communityId' });

export const getActivitiesByCommunity = async (req, res) => {
    try {
        const response = await Activities.findAll({
            where: {
                communityId: req.params.communityId
            },
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}

export const getActivityById = async (req, res) => {
    try {
        const response = await Activities.findOne({
            where: {
                id: req.params.id
            }
        });
        if (!response) return res.status(404).json({ msg: "Aktivitas tidak ditemukan" });
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}

export const createActivity = async (req, res) => {
    const { judul_kegiatan, deskripsi, lokasi, tanggal, waktu, communityId } = req.body;

    if (!judul_kegiatan || !deskripsi || !lokasi || !tanggal || !waktu || !communityId) {
        return res.status(400).json({ msg: "Semua data aktivitas wajib diisi" });
    }

    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ msg: "Mohon unggah setidaknya satu foto kegiatan" });
    }

    try {
        const fileNames = req.files.map(file => file.filename);
        const fotoString = JSON.stringify(fileNames);

        await Activities.create({
            judul_kegiatan: judul_kegiatan,
            deskripsi: deskripsi,
            lokasi: lokasi,
            tanggal: tanggal,
            waktu: waktu,
            foto_kegiatan: fotoString,
            communityId: communityId
        });

        res.status(201).json({ msg: "Aktivitas Berhasil Dibuat" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: "Gagal membuat aktivitas, terjadi kesalahan server" });
    }
}

export const updateActivity = async (req, res) => {
    try {
        const activity = await Activities.findOne({
            where: { id: req.params.id }
        });
        if (!activity) return res.status(404).json({ msg: "Data aktivitas tidak ditemukan" });

        let fotoString = activity.foto_kegiatan; 

        if (req.files && req.files.length > 0) {
            const oldImages = JSON.parse(activity.foto_kegiatan || "[]");
            oldImages.forEach(imageName => {
                const filepath = path.join("./public/uploads", imageName);
                if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
            });

            const fileNames = req.files.map(file => file.filename);
            fotoString = JSON.stringify(fileNames);
        }

        const { judul_kegiatan, deskripsi, lokasi, tanggal, waktu } = req.body;

        if (!judul_kegiatan || !lokasi || !tanggal || !waktu) {
            return res.status(400).json({ msg: "Data utama tidak boleh dikosongkan" });
        }

        await Activities.update({
            judul_kegiatan, 
            deskripsi, 
            lokasi, 
            tanggal, 
            waktu, 
            foto_kegiatan: fotoString
        }, {
            where: { id: req.params.id }
        });

        res.status(200).json({ msg: "Aktivitas Berhasil Diupdate" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: "Gagal memperbarui aktivitas" });
    }
}

export const deleteActivity = async (req, res) => {
    try {
        const activity = await Activities.findOne({
            where: { id: req.params.id }
        });
        if (!activity) return res.status(404).json({ msg: "Data tidak ditemukan" });

        const images = JSON.parse(activity.foto_kegiatan || "[]");
        images.forEach(imageName => {
            const filepath = `./public/uploads/${imageName}`;
            if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
        });

        await Activities.destroy({
            where: { id: req.params.id }
        });

        res.status(200).json({ msg: "Aktivitas Berhasil Dihapus" });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}

export const getAllActivities = async (req, res) => {
    try {
        const response = await Activities.findAll({
            order: [['createdAt', 'DESC']], 
            include: [{
                model: Communities,
                attributes: ['id', 'nama_komunitas', 'foto_url'] 
            }]
        });
        res.status(200).json(response);
    } catch (error) {
        console.log(error); 
        res.status(500).json({ msg: error.message });
    }
}