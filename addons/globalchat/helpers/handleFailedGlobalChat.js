/**
 * @namespace: addons/globalchat/helpers/handleFailedGlobalChat.js
 * @type: Helper Script
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.9.9-beta-rc.5
 */

const fetch = require('node-fetch');
const { PermissionsBitField } = require('discord.js');

/**
 * Attempts to automatically fix broken webhooks for guilds that failed delivery.
 * Fetches guild info, creates a new webhook, and updates the API.
 * @param {Array<{guildId: string, guildName?: string, error: string}>} failedGuilds - Array of failed guilds from API response.
 * @param {object} container - The Kythia container object (client, logger, etc.).
 */
async function handleFailedGlobalChat(failedGuilds, container) {
    const { logger, client } = container;
    const apiUrl = kythia.addons.globalchat.apiUrl;
    const webhookName = kythia.addons.globalchat.webhookName || 'Global Chat via Kythia';

    logger.info(`🌏 [GlobalChat] Starting webhook fix process for ${failedGuilds.length} failed guild(s)...`);

    let allGuildsData;
    try {
        logger.info('🌏 [GlobalChat] Fetching master guild list from API...');
        const listResponse = await fetch(`${apiUrl}/list`);
        if (!listResponse.ok) throw new Error(`API /list returned status ${listResponse.status}`);

        const listData = await listResponse.json();
        if (listData.status !== 'ok' || !listData.data?.guilds) {
            throw new Error(`API /list failed or returned invalid data: ${listData.message || listData.error || 'Unknown error'}`);
        }
        allGuildsData = listData.data.guilds;
    } catch (listError) {
        logger.error(`❌ [GlobalChat] Error fetching master /list. Aborting fix process.`, listError.message);
        return;
    }

    for (const failedGuild of failedGuilds) {
        logger.warn(`⚠️ [GlobalChat] Handling failed guild: ${failedGuild.guildName || failedGuild.guildId}. Reason: ${failedGuild.error}`);

        try {
            logger.info(`🌏 [GlobalChat] Attempting to fix webhook for guild ${failedGuild.guildName || failedGuild.guildId}`);

            const guildInfo = allGuildsData.find((g) => g.id === failedGuild.guildId);

            if (!guildInfo || !guildInfo.globalChannelId) {
                logger.warn(
                    `⚠️ [GlobalChat] Could not find registered channel info for guild ${failedGuild.guildId} in API /list response. Skipping fix.`
                );
                continue;
            }

            let channel;
            try {
                channel = await client.channels.fetch(guildInfo.globalChannelId).catch(() => null);
                if (!channel || !channel.isTextBased() || channel.isDMBased()) {
                    logger.warn(
                        `⚠️ [GlobalChat] Channel ${guildInfo.globalChannelId} for guild ${failedGuild.guildId} not found, not text-based, or is DM. Skipping fix.`
                    );
                    continue;
                }

                const guild = channel.guild;
                if (!guild) {
                    logger.warn(
                        `⚠️ [GlobalChat] Cannot access guild ${failedGuild.guildId} for channel ${channel.id}. Bot might have been kicked. Skipping fix.`
                    );
                    continue;
                }
                const me = await guild.members.fetchMe().catch(() => null);
                if (!me) {
                    logger.warn(`⚠️ [GlobalChat] Bot is not a member of guild ${guild.name} (${guild.id}). Skipping fix.`);
                    continue;
                }

                if (!channel.permissionsFor(me).has(PermissionsBitField.Flags.ManageWebhooks)) {
                    logger.warn(
                        `⚠️ [GlobalChat] Missing 'Manage Webhooks' permission in channel #${channel.name} (${channel.id}) for guild ${guild.name} (${guild.id}). Cannot fix webhook.`
                    );
                    continue;
                }
            } catch (channelError) {
                logger.error(
                    `❌ [GlobalChat] Error accessing channel/permissions for ${guildInfo.globalChannelId} in guild ${failedGuild.guildId}:`,
                    channelError
                );
                continue;
            }

            let newWebhook;
            try {
                logger.info(`🌏 [GlobalChat] Creating new webhook in #${channel.name} (${channel.id})...`);
                newWebhook = await channel.createWebhook({
                    name: webhookName,
                    avatar: client.user.displayAvatarURL(),
                    reason: 'Automatic webhook recreation for Kythia Global Chat',
                });
                logger.info(`🌏 [GlobalChat] New webhook created: ${newWebhook.id}`);
            } catch (webhookError) {
                logger.error(
                    `❌ [GlobalChat] Failed to create webhook in channel ${channel.id} for guild ${failedGuild.guildId}:`,
                    webhookError
                );
                continue;
            }

            try {
                logger.info(`🌏 [GlobalChat] Updating API with new webhook info for guild ${failedGuild.guildId}...`);
                const updateResponse = await fetch(`${apiUrl}/add`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        guildId: failedGuild.guildId,
                        globalChannelId: guildInfo.globalChannelId,
                        webhookId: newWebhook.id,
                        webhookToken: newWebhook.token,
                    }),
                });
                if (!updateResponse.ok) throw new Error(`API /add returned status ${updateResponse.status}`);
                const updateResult = await updateResponse.json();

                if (updateResult.status === 'ok') {
                    logger.info(
                        `✅ [GlobalChat] Successfully fixed and updated webhook for guild ${failedGuild.guildName || failedGuild.guildId}`
                    );
                } else {
                    logger.error(
                        `❌ [GlobalChat] Failed to update guild ${failedGuild.guildName || failedGuild.guildId} in API after creating webhook:`,
                        updateResult.message || updateResult.error || updateResult
                    );
                    await newWebhook
                        .delete('Failed to update Global Chat API')
                        .catch((delErr) => logger.warn(`⚠️ [GlobalChat] Failed to delete orphaned webhook ${newWebhook.id}:`, delErr));
                }
            } catch (updateError) {
                logger.error(`[GlobalChat] ❌ Error calling API /add to update webhook for guild ${failedGuild.guildId}:`, updateError);

                await newWebhook
                    .delete('Failed to call Global Chat API /add')
                    .catch((delErr) => logger.warn(`⚠️ [GlobalChat] Failed to delete orphaned webhook ${newWebhook.id}:`, delErr));
            }
        } catch (error) {
            logger.error(`❌ [GlobalChat] Unexpected error during webhook fix for guild ${failedGuild.guildId}:`, error);
        }
    }
    logger.info(`🌏 [GlobalChat] Webhook fix process finished.`);
}

module.exports = { handleFailedGlobalChat };
