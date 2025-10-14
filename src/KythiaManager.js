/**
 * 🧭 Kythia Manager
 *
 * @file src/KythiaManager.js
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.9.9-beta-rc.3
 *
 * @description
 * Lightweight manager for accessing and updating per-guild settings with an
 * in-memory cache. It reduces database hits by caching settings in a
 * `Collection` and keeping them synchronized after updates.
 */

const logger = require('@utils/logger');

class KythiaManager {
    constructor(serverSettingModel) {
        this._model = serverSettingModel;
        logger.info('🔧 KythiaManager v2.0 initialized (powered by KythiaModel Engine).');
    }

    /**
     * Retrieves settings for a guild using the KythiaModel cache-aware findOrCreate.
     * @param {string} guildId The guild ID to fetch settings for.
     * @param {string} [guildName='Unknown'] The name of the guild, for creation.
     * @returns {Promise<import('sequelize').Model|null>} The Sequelize settings instance.
     */
    async get(guildId, guildName = 'Unknown') {
        try {
            const [settings, created] = await this._model.findOrCreateWithCache({
                where: { guildId },
                defaults: { guildId: guildId, guildName: guildName },
            });
            if (created) {
                logger.info(`New settings entry created for guild ${guildId} via KythiaManager.`);
            }
            return settings;
        } catch (error) {
            logger.error(`Error in KythiaManager.get for guild ${guildId}:`, error);
            return null;
        }
    }

    /**
     * Updates settings for a guild. Cache invalidation is handled automatically by KythiaModel hooks.
     * @param {string} guildId Guild ID to update.
     * @param {object} data Partial settings object to apply.
     * @returns {Promise<import('sequelize').Model|null>} The updated settings instance.
     */
    async update(guildId, data) {
        try {
            const settings = await this.get(guildId);
            if (!settings) {
                throw new Error('Could not find settings for this guild.');
            }
            return await settings.update(data);
        } catch (error) {
            logger.error(`Error updating settings for guild ${guildId}:`, error);
            return null;
        }
    }

    /**
     * Deletes a guild's settings from the database. Cache is cleared automatically by hooks.
     * @param {string} guildId Guild ID to delete.
     */
    async delete(guildId) {
        try {
            const settings = await this._model.findOne({ where: { guildId } });
            if (settings) {
                await settings.destroy();
                logger.info(`Settings deleted for guild ${guildId}.`);
            }
        } catch (error) {
            logger.error(`Error deleting settings for guild ${guildId}:`, error);
        }
    }
}

module.exports = KythiaManager;
