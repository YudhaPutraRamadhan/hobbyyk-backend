import { Sequelize } from "sequelize";
import db from "../config/db.js";
import Users from "./userModel.js";

const { DataTypes } = Sequelize;

const Communities = db.define('communities', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nama_komunitas: {
        type: DataTypes.STRING,
        allowNull: false
    },
    kategori: {
    type: DataTypes.ENUM(
        'Olahraga', 
        'Musik', 
        'Seni', 
        'Teknologi', 
        'Game', 
        'Hobby', 
        'Edukasi', 
        'Lainnya'
    ),
    allowNull: false
},
    deskripsi: {
        type: DataTypes.TEXT
    },
    lokasi: {
        type: DataTypes.STRING
    },
    kontak: {
        type: DataTypes.STRING
    },
    foto_url: {
        type: DataTypes.STRING
    },
    banner_url: {
        type: DataTypes.STRING, 
        allowNull: true
    },
    link_grup: {
        type: DataTypes.STRING,
        allowNull: true      
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true
    }
}, {
    freezeTableName: true
});

Users.hasOne(Communities, { foreignKey: 'userId' });
Communities.belongsTo(Users, { foreignKey: 'userId' });

export default Communities;