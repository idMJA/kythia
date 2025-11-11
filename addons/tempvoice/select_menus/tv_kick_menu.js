/**
 * @namespace: addons/tempvoice/select_menus/tv_kick_menu.js
 * @type: Module
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.9.11-beta
 */
const { MessageFlags } = require('discord.js');

module.exports = {
    execute: async (interaction, container) => {
        const { models, client, t, helpers } = container;
        const { simpleContainer } = helpers.discord;

        // 1. Ambil data
        const userIdToKick = interaction.values[0]; // ID user yang dipilih
        const channelId = interaction.customId.split(':')[1];

        if (!channelId) {
            return interaction.update({
                components: await simpleContainer(interaction, await t(interaction, 'tempvoice.common.no_channel_id'), { color: 'Red' }),
            });
        }

        // 2. Cek kepemilikan
        const activeChannel = await models.TempVoiceChannel.findOne({
            where: { channelId: channelId, ownerId: interaction.user.id },
        });
        if (!activeChannel) {
            return interaction.update({
                components: await simpleContainer(interaction, await t(interaction, 'tempvoice.common.not_owner'), { color: 'Red' }),
            });
        }

        // 3. Fetch channel (pake force!)
        const channel = await client.channels.fetch(channelId, { force: true }).catch(() => null);
        if (!channel) {
            return interaction.update({
                components: await simpleContainer(interaction, await t(interaction, 'tempvoice.common.channel_not_found'), {
                    color: 'Red',
                }),
            });
        }

        // 4. Ambil member yang mau di-kick
        const memberToKick = await interaction.guild.members.fetch(userIdToKick).catch(() => null);
        if (!memberToKick) {
            return interaction.update({
                components: await simpleContainer(interaction, await t(interaction, 'tempvoice.kick.menu.user_not_found'), {
                    color: 'Red',
                }),
            });
        }

        // 5. Cek kalo user-nya emang di channel itu
        if (memberToKick.voice.channelId !== channelId) {
            return interaction.update({
                components: await simpleContainer(
                    interaction,
                    await t(interaction, 'tempvoice.kick.menu.not_in_channel', { user: memberToKick.displayName }),
                    { color: 'Red' }
                ),
            });
        }

        // 6. KICK! (Disconnect dari voice)
        try {
            await memberToKick.voice.disconnect(await t(interaction, 'tempvoice.kick.menu.kick_reason'));

            await interaction.update({
                components: await simpleContainer(
                    interaction,
                    await t(interaction, 'tempvoice.kick.menu.success', { user: memberToKick.displayName }),
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
