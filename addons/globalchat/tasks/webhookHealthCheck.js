/**
 * @namespace: addons/globalchat/tasks/webhookHealthCheck.js
 * @type: Scheduled Task
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.9.9-beta-rc.5
 */

const fetch = require('node-fetch');
const cron = require('node-cron');
const { handleFailedGlobalChat } = require('../helpers/handleFailedGlobalChat');

/**
 * Sleep for ms milliseconds
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Initializes the webhook health check task for Global Chat
 * Runs every 6 hours to proactively check webhook health
 * @param {object} bot - The bot instance with client, logger, container
 */
function initializeWebhookHealthCheck(bot) {
    const { client, container } = bot;
    const logger = container.logger;
    const apiUrl = kythia.addons.globalchat.apiUrl;

    const schedule = kythia.addons.globalchat.healthCheckSchedule || '0 */1 * * *';

    const checkDelayMs = kythia.addons.globalchat.healthCheckDelay || 1000;
    logger.info(`🌏 [GlobalChat] Initializing webhook health check task with schedule: ${schedule}`);

    cron.schedule(
        schedule,
        async () => {
            logger.info('🌏 [GlobalChat] Starting proactive webhook health check...');

            let listData;
            try {
                const listResponse = await fetch(`${apiUrl}/list`);
                listData = await listResponse.json();
                if (listData.status !== 'ok') throw new Error('API /list failed');
            } catch (err) {
                logger.error('❌ [GlobalChat-Cron] Failed to fetch guild list from API:', err);
                return;
            }

            const myGuildsInApi = listData.data.guilds.filter((g) => client.guilds.cache.has(g.id));

            logger.info(`🌏 [GlobalChat-Cron] Checking ${myGuildsInApi.length} guilds managed by this bot instance...`);

            for (const guildInfo of myGuildsInApi) {
                try {
                    const webhookUrl = `https://discord.com/api/webhooks/${guildInfo.webhookId}/${guildInfo.webhookToken}`;

                    const webhookResponse = await fetch(webhookUrl);

                    if (webhookResponse.status === 404) {
                        logger.warn(
                            `⚠️ [GlobalChat-Cron] Proactive check found a DEAD webhook (404) for guild ${guildInfo.guildName || guildInfo.id}. Triggering self-heal!`
                        );

                        const failedGuild = {
                            guildId: guildInfo.id,
                            guildName: guildInfo.guildName,
                            error: 'Proactive check failed: 404 Not Found',
                        };

                        handleFailedGlobalChat([failedGuild], container).catch((err) => {
                            logger.error(`❌ [GlobalChat-Cron] Self-heal attempt failed:`, err);
                        });
                    } else if (!webhookResponse.ok) {
                        logger.warn(`⚠️ [GlobalChat-Cron] Webhook for ${guildInfo.id} returned non-OK status: ${webhookResponse.status}`);
                    }
                } catch (fetchError) {
                    logger.error(`❌ [GlobalChat-Cron] Error checking webhook for guild ${guildInfo.id}:`, fetchError);
                }

                await sleep(checkDelayMs);
            }
            logger.info('🌏 [GlobalChat] Proactive webhook health check finished.');
        },
        {
            timezone: kythia.bot.timezone,
        }
    );
}

module.exports = { initializeWebhookHealthCheck };
