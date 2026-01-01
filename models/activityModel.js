import { Sequelize } from "sequelize";
import db from "../config/db.js";
import Communities from "./communityModel.js";

const { DataTypes } = Sequelize;

const Activities = db.define('activities', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    judul_kegiatan: {
        type: DataTypes.STRING,
        allowNull: false
    },
    deskripsi: {
        type: DataTypes.TEXT
    },
    lokasi: {
        type: DataTypes.STRING
    },
    tanggal: {
        type: DataTypes.DATEONLY
    },
    waktu: {
        type: DataTypes.TIME
    },
    foto_kegiatan: {
        type: DataTypes.STRING
    }
}, {
    freezeTableName: true
});

Communities.hasMany(Activities, { foreignKey: 'communityId' });
Activities.belongsTo(Communities, { foreignKey: 'communityId' });

export default Activities;