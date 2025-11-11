/**
 * @namespace: addons/tempvoice/select_menus/tv_untrust_menu.js
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

        // 1. Cek channel & kepemilikan
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

        // 2. Fetch channel
        const channel = await client.channels.fetch(channelId, { force: true }).catch(() => null);
        if (!channel)
            return interaction.update({
                components: await simpleContainer(interaction, await t(interaction, 'tempvoice.common.channel_not_found'), {
                    color: 'Red',
                }),
            });

        const userIdsToUntrust = interaction.values; // Ini array
        const untrustedNames = [];

        try {
            // 3. Loop semua user yang dipilih
            for (const userId of userIdsToUntrust) {
                const member = await interaction.guild.members.fetch(userId).catch(() => null);
                if (member) {
                    // 4. Cabut permission
                    await channel.permissionOverwrites.edit(member, {
                        [PermissionsBitField.Flags.ViewChannel]: false,
                        [PermissionsBitField.Flags.Connect]: false,
                    });
                    untrustedNames.push(member.displayName);
                }
            }

            // 5. Kasih balasan sukses
            await interaction.update({
                components: await simpleContainer(
                    interaction,
                    await t(interaction, 'tempvoice.untrust.success', {
                        users: untrustedNames.join(', '),
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
