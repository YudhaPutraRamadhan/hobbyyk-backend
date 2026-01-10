import Members from "../models/memberModel.js";
import Communities from "../models/communityModel.js";

export const toggleJoinCommunity = async(req, res) => {
    const { communityId } = req.body;
    const userId = req.userId;

    try {
        const community = await Communities.findByPk(communityId);
        if(!community) return res.status(404).json({msg: "Komunitas tidak ditemukan"});

        const isMember = await Members.findOne({
            where: { userId, communityId }
        });

        if(isMember) {
            await isMember.destroy();
            res.status(200).json({msg: "Anda telah keluar dari komunitas", isMember: false});
        } else {
            const [member, created] = await Members.findOrCreate({
                where: { userId, communityId },
                defaults: { userId, communityId }
            });

            if (!created) return res.status(400).json({msg: "Anda sudah menjadi anggota"});
            
            res.status(201).json({msg: "Selamat bergabung!", isMember: true});
        }
    } catch (error) {
        res.status(500).json({msg: error.message});
    }
}