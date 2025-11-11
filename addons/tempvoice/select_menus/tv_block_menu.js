/**
 * @namespace: addons/tempvoice/select_menus/tv_block_menu.js
 * @type: Module
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.9.11-beta
 */
const { PermissionsBitField } = require('discord.js');

module.exports = {
    execute: async (interaction, container) => {
        const { models, client, t, helpers } = container;
        const { simpleContainer } = helpers.discord;
        const channelId = interaction.customId.split(':')[1];

        // 1. Cek & Fetch (Copy-paste dari trust_menu)
        if (!channelId)
            return interaction.update({
                components: await simpleContainer(interaction, await t(interaction, 'tempvoice.common.no_channel_id'), { color: 'Red' }),
            });
        const activeChannel = await models.TempVoiceChannel.findOne({
            where: { channelId: channelId, ownerId: interaction.user.id },
        });
        if (!activeChannel)
            return interaction.update({
                components: await simpleContainer(interaction, await t(interaction, 'tempvoice.common.not_owner'), { color: 'Red' }),
            });
        const channel = await client.channels.fetch(channelId, { force: true }).catch(() => null);
        if (!channel)
            return interaction.update({
                components: await simpleContainer(interaction, await t(interaction, 'tempvoice.common.channel_not_found'), {
                    color: 'Red',
                }),
            });

        const userIdsToBlock = interaction.values;
        const blockedNames = [];

        try {
            for (const userId of userIdsToBlock) {
                const member = await interaction.guild.members.fetch(userId).catch(() => null);
                if (member) {
                    // 4. [LOGIKA UTAMA] Kasih permission DENY
                    await channel.permissionOverwrites.edit(member, {
                        [PermissionsBitField.Flags.ViewChannel]: false,
                        [PermissionsBitField.Flags.Connect]: false,
                    });
                    blockedNames.push(member.displayName);
                }
            }

            // 5. Balasan sukses
            await interaction.update({
                components: await simpleContainer(
                    interaction,
                    await t(interaction, 'tempvoice.block.success', {
                        users: blockedNames.join(', '),
                    }),
                    { color: 'Green' }
                ),
            });
        } catch (err) {
            await interaction.update({
                components: await simpleContainer(interaction, await t(interaction, 'tempvoice.common.fail'), { color: 'Red' }),
            });
        }
    },
};
