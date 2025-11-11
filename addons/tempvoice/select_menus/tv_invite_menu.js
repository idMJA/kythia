/**
 * @namespace: addons/tempvoice/select_menus/tv_invite_menu.js
 * @type: Select Menu Handler
 */
const { MessageFlags } = require('discord.js');

module.exports = {
    execute: async (interaction, container) => {
        const { models, client, t, helpers, logger } = container;
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

        const userIdsToInvite = interaction.values; // Array user ID
        const successNames = [];
        const failNames = [];
        let inviteUrl = '';

        // 3. Buat SATU invite link
        try {
            const inviteReason = await t(interaction, 'tempvoice.invite.invite_reason');
            const invite = await channel.createInvite({
                maxAge: 3600, // 1 jam
                maxUses: userIdsToInvite.length + 1, // Cukup buat semua
                reason: inviteReason,
            });
            inviteUrl = invite.url;
        } catch (err) {
            logger.error(`[TempVoice] Gagal bikin invite: ${err.message}`);
            return interaction.update({
                components: await simpleContainer(interaction, await t(interaction, 'tempvoice.invite.fail'), { color: 'Red' }),
            });
        }

        // 4. Siapin konten DM
        const dmContent = await t(interaction, 'tempvoice.invite.dm_message', {
            user: interaction.user.globalName || interaction.user.username,
            guild: interaction.guild.name,
            channel: channel.name,
            inviteUrl: inviteUrl,
        });

        // 5. Loop & kirim DM pakai simpleContainer
        for (const userId of userIdsToInvite) {
            const user = await client.users.fetch(userId).catch(() => null);
            if (user) {
                try {
                    await user.send({
                        components: await simpleContainer(interaction, dmContent),
                        flags: MessageFlags.IsComponentsV2,
                    });
                    successNames.push(user.globalName || user.username);
                } catch (dmError) {
                    logger.warn(`[TempVoice] Gagal DM user ${user.tag}: ${dmError.message}`);
                    failNames.push(user.globalName || user.username);
                }
            }
        }

        // 6. Bikin balasan summary
        let summaryContent = '';
        if (successNames.length > 0) {
            summaryContent += (await t(interaction, 'tempvoice.invite.success_dm', { users: successNames.join(', ') })) + '\n';
        }
        if (failNames.length > 0) {
            summaryContent += await t(interaction, 'tempvoice.invite.fail_dm', { users: failNames.join(', ') });
        }

        await interaction.update({
            components: await simpleContainer(interaction, summaryContent, { color: 'Green' }),
        });
    },
};
