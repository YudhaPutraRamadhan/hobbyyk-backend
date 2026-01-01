import { Sequelize } from "sequelize";
import db from "../config/db.js";
import Users from "./userModel.js";
import Communities from "./communityModel.js";

const { DataTypes } = Sequelize;

const Members = db.define('members', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Users,
            key: 'id'
        }
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

Users.belongsToMany(Communities, { through: Members, foreignKey: 'userId', as: 'JoinedCommunities' });
Communities.belongsToMany(Users, { through: Members, foreignKey: 'communityId', as: 'CommunityMembers' });

export default Members;