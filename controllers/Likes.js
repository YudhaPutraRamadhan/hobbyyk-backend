import Likes from "../models/likeModel.js";
import Communities from "../models/communityModel.js";

export const toggleLike = async(req, res) => {
    const { communityId } = req.body;
    const userId = req.userId;

    try {
        const community = await Communities.findByPk(communityId);
        if(!community) return res.status(404).json({msg: "Komunitas tidak ditemukan"});

        const existingLike = await Likes.findOne({
            where: {
                userId: userId,
                communityId: communityId
            }
        });

        if(existingLike) {
            await existingLike.destroy();
            res.status(200).json({msg: "Unliked", status: false}); 
        } else {
            const [like, created] = await Likes.findOrCreate({
                where: { 
                    userId: userId, 
                    communityId: communityId 
                },
                defaults: { 
                    userId: userId, 
                    communityId: communityId 
                }
            });

            if (!created) {
                return res.status(200).json({msg: "Liked", status: true});
            }

            res.status(201).json({msg: "Liked", status: true});
        }
    } catch (error) {
        res.status(500).json({msg: error.message});
    }
}