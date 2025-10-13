/**
 * @namespace: addons/core/database/models/User.js
 * @type: Database Model
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.9.9-beta-rc.3
 */

const { DataTypes } = require('sequelize');
const sequelize = require('@src/database/KythiaSequelize');
const KythiaModel = require('@src/database/KythiaModel');

class User extends KythiaModel {
    static CACHE_KEYS = [['userId', 'guildId']];
    static init(sequelize) {
        super.init(
            {
                guildId: { type: DataTypes.STRING, allowNull: false },
                userId: { type: DataTypes.STRING, allowNull: false },

                level: { type: DataTypes.INTEGER, defaultValue: 1 },
                xp: { type: DataTypes.INTEGER, defaultValue: 1 },
                lastMessage: { type: DataTypes.DATE, defaultValue: null },
                warnings: { type: DataTypes.JSON, defaultValue: '[]' },
            },
            {
                sequelize,
                modelName: 'User',
                tableName: 'users',
                timestamps: false,
            }
        );

        return this;
    }
}

User.init(sequelize);

module.exports = User;
