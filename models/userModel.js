import { Sequelize } from "sequelize";
import db from "../config/db.js";

const { DataTypes } = Sequelize;

const Users = db.define('users', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM('super_admin', 'admin_komunitas', 'user'),
        defaultValue: 'user'
    },
    profile_pic: {
        type: DataTypes.STRING,
        allowNull: true
    },
    bio: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    no_hp: {
        type: DataTypes.STRING,
        allowNull: true
    },
    otp: {
        type: DataTypes.STRING,
        allowNull: true
    },
    is_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    otp_expiration: {
    type: DataTypes.DATE,
    allowNull: true
}
}, {
    freezeTableName: true
});

export default Users;