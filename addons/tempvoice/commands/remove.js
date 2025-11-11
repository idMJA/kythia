/**
 * @namespace: addons/tempvoice/commands/remove.js
 * @type: Command
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.9.11-beta
 */
const { MessageFlags } = require('discord.js');

module.exports = {
    subcommand: true,
    data: (subcommand) => subcommand.setName('remove').setDescription('Disable the tempvoice system and remove the panel.'),

    async execute(interaction, container) {
        const { models, logger, client, helpers, t } = container;
        const { TempVoiceConfig, TempVoiceChannel } = models;
        const { simpleContainer } = helpers.discord;
        const guildId = interaction.guild.id;

        await interaction.deferReply({ ephemeral: true });

        const config = await TempVoiceConfig.getCache({ guildId: guildId });
        if (!config) {
            return interaction.editReply({
                components: await simpleContainer(interaction, await t(interaction, 'tempvoice.unset.not_setup'), { color: 'Yellow' }),
                flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
            });
        }

        const deleteReason = await t(interaction, 'tempvoice.unset.delete_reason');
        const deleteReasonPanel = await t(interaction, 'tempvoice.unset.delete_reason_panel');
        const deleteReasonTrigger = await t(interaction, 'tempvoice.unset.delete_reason_trigger');
        const deleteReasonCategory = await t(interaction, 'tempvoice.unset.delete_reason_category');

        const activeChannels = await TempVoiceChannel.getAllCache({ where: { guildId: guildId } });
        for (const ac of activeChannels) {
            const tempChannel = await client.channels.fetch(ac.channelId, { force: true }).catch(() => null);
            if (tempChannel) {
                try {
                    await tempChannel.delete(deleteReason);
                } catch (e) {
                    logger.warn(`[TempVoice] Failed to delete temp channel: ${e.message}`);
                }
            }
            await ac.destroy();
        }

        if (config.controlPanelChannelId) {
            try {
                const channel = await client.channels.fetch(config.controlPanelChannelId, { force: true }).catch(() => null);
                if (channel) {
                    if (config.interfaceMessageId) {
                        const msg = await channel.messages.fetch(config.interfaceMessageId).catch(() => null);
                        if (msg) await msg.delete();
                    }
                    await channel.delete(deleteReasonPanel);
                }
            } catch (e) {
                logger.warn(`[TempVoice] Failed to delete control panel/channel: ${e.message}`);
            }
        }

        if (config.categoryId) {
            try {
                const category = await client.channels.fetch(config.categoryId, { force: true }).catch(() => null);
                const triggerChannel = await client.channels.fetch(config.triggerChannelId, { force: true }).catch(() => null);
                if (triggerChannel && triggerChannel.parentId === category.id) {
                    await triggerChannel.delete(deleteReasonTrigger);
                }
                if (category) {
                    await category.delete(deleteReasonCategory);
                }
            } catch (e) {
                logger.warn(`[TempVoice] Failed to delete TempVoice category: ${e.message}`);
            }
        }

        await config.destroy();

        return interaction.editReply({
            components: await simpleContainer(interaction, await t(interaction, 'tempvoice.unset.success_content'), { color: 'Red' }),
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        });
    },
};
