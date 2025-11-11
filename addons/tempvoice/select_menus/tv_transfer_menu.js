/**
 * @namespace: addons/tempvoice/select_menus/tv_transfer_menu.js
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

        const newOwnerId = interaction.values[0];
        const oldOwnerId = interaction.user.id;

        if (newOwnerId === oldOwnerId) {
            return interaction.update({
                components: await simpleContainer(interaction, await t(interaction, 'tempvoice.transfer.transfer_to_self'), {
                    color: 'Yellow',
                }),
            });
        }

        const newOwnerMember = await interaction.guild.members.fetch(newOwnerId).catch(() => null);
        if (!newOwnerMember)
            return interaction.update({
                components: await simpleContainer(interaction, await t(interaction, 'tempvoice.transfer.user_not_found'), { color: 'Red' }),
            });

        try {
            // 3. Hapus perm owner lama (dirimu sendiri)
            await channel.permissionOverwrites.delete(interaction.member);

            // 4. Kasih perm owner baru
            await channel.permissionOverwrites.edit(newOwnerMember, {
                [PermissionsBitField.Flags.ManageChannels]: true,
                [PermissionsBitField.Flags.MoveMembers]: true,
                [PermissionsBitField.Flags.ViewChannel]: true,
                [PermissionsBitField.Flags.Connect]: true,
            });

            // 5. Update DB
            activeChannel.ownerId = newOwnerId;
            await activeChannel.saveAndUpdateCache(); // Pake fungsi KythiaModel-mu

            // 6. Balasan sukses
            await interaction.update({
                components: await simpleContainer(
                    interaction,
                    await t(interaction, 'tempvoice.transfer.success', {
                        user: newOwnerMember.displayName,
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
