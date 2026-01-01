import { Sequelize } from "sequelize";
import db from "../config/db.js";
import Communities from "./communityModel.js";

const { DataTypes } = Sequelize;

const Gallery = db.define('gallery', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    foto_url: {
        type: DataTypes.STRING,
        allowNull: false
    },
    caption: {
        type: DataTypes.STRING,
        allowNull: true
    },
    communityId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Communities,
            key: 'id'
        }
    }
}, {
    freezeTableName: true
});

// Relasi: 1 Komunitas punya Banyak Foto Galeri
Communities.hasMany(Gallery, { foreignKey: 'communityId' });
Gallery.belongsTo(Communities, { foreignKey: 'communityId' });

export default Gallery;