/**
 * @namespace: addons/tempvoice/events/voiceStateUpdate.js
 * @type: Event Handler
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.9.11-beta
 */
const { ChannelType, PermissionsBitField } = require('discord.js');

module.exports = async (bot, oldState, newState) => {
    const { models, logger, client } = bot.client.container;
    const { TempVoiceConfig, TempVoiceChannel } = models;

    const { guild, member, channelId: newChannelId } = newState;
    const oldChannelId = oldState.channelId;

    const config = await TempVoiceConfig.getCache({ guildId: guild.id });
    if (!config) return;

    if (newChannelId === config.triggerChannelId && member && !member.user.bot) {
        try {
            const newChannel = await guild.channels.create({
                name: `🎧┃${member.displayName}'s Room`,
                type: ChannelType.GuildVoice,
                parent: config.categoryId,
                permissionOverwrites: [
                    {
                        id: member.id,
                        allow: [
                            PermissionsBitField.Flags.ManageChannels,
                            PermissionsBitField.Flags.MoveMembers,
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.Connect,
                        ],
                    },
                    {
                        id: guild.roles.everyone,
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.Connect],
                    },
                    {
                        // [WAJIB TAMBAHIN INI] Izin 3: Si Bot
                        id: client.user.id,
                        allow: [PermissionsBitField.Flags.ManageChannels, PermissionsBitField.Flags.MoveMembers],
                    },
                ],
            });

            await member.voice.setChannel(newChannel);

            await TempVoiceChannel.create({
                channelId: newChannel.id,
                guildId: guild.id,
                ownerId: member.id,
            });
        } catch (error) {
            logger.error(`[TempVoice] Failed to create channel for ${member.user.tag}:`, error);
        }
    }

    if (oldChannelId && oldChannelId !== config.triggerChannelId) {
        const activeChannel = await TempVoiceChannel.getCache({ channelId: oldChannelId });

        if (activeChannel) {
            const channel = await client.channels.fetch(oldChannelId, { force: true }).catch(() => null);

            if (channel && channel.members.size === 0) {
                await channel.delete('Temporary voice channel was empty.');

                await TempVoiceChannel.destroy({ where: { channelId: oldChannelId } });
            }
        }
    }
};
