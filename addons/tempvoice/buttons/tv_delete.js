/**
 * @namespace: addons/tempvoice/buttons/tv_delete.js
 * @type: Module
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.9.11-beta
 */

const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    ContainerBuilder,
    TextDisplayBuilder,
    MessageFlags,
} = require('discord.js');

module.exports = {
    execute: async (interaction, container) => {
        const { models, client, t } = container;
        const { TempVoiceChannel } = models;

        const ownerId = interaction.user.id;
        const activeChannel = await TempVoiceChannel.getCache({
            ownerId: ownerId,
            guildId: interaction.guild.id,
        });

        if (!activeChannel) {
            const errorContainer = new ContainerBuilder().addTextDisplayComponents(
                new TextDisplayBuilder().setContent(await t(interaction, 'tempvoice.tv_delete.no_active'))
            );
            return interaction.reply({
                components: [errorContainer],
                flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
            });
        }

        const channelId = activeChannel.channelId;
        const channel = await client.channels.fetch(channelId, { force: true }).catch(() => null);

        if (!channel) {
            const notfoundContainer = new ContainerBuilder().addTextDisplayComponents(
                new TextDisplayBuilder().setContent(await t(interaction, 'tempvoice.tv_delete.not_found'))
            );
            return interaction.reply({
                components: [notfoundContainer],
                flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
            });
        }

        const confirmText = new TextDisplayBuilder().setContent(await t(interaction, 'tempvoice.tv_delete.confirm'));
        const rowBtns = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('tv_delete_confirm')
                .setLabel(await t(interaction, 'tempvoice.tv_delete.delete_btn'))
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🗑️'),
            new ButtonBuilder()
                .setCustomId('tv_delete_cancel')
                .setLabel(await t(interaction, 'tempvoice.tv_delete.cancel_btn'))
                .setStyle(ButtonStyle.Secondary)
        );
        const confirmContainer = new ContainerBuilder().addTextDisplayComponents(confirmText).addActionRowComponents(rowBtns);

        await interaction.reply({
            components: [confirmContainer],
            flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2,
        });

        const msg = await interaction.fetchReply();
        const filter = (i) =>
            i.user.id === interaction.user.id && (i.customId === 'tv_delete_confirm' || i.customId === 'tv_delete_cancel');

        const collector = msg.createMessageComponentCollector({
            filter,
            componentType: ComponentType.Button,
            time: 15_000,
            max: 1,
        });

        collector.on('collect', async (btnInteraction) => {
            let resultContainer;

            if (btnInteraction.customId === 'tv_delete_confirm') {
                await channel.delete(await t(btnInteraction, 'tempvoice.tv_delete.deleted_reason'));
                const confirmDeletedText = new TextDisplayBuilder().setContent(await t(btnInteraction, 'tempvoice.tv_delete.deleted'));
                resultContainer = new ContainerBuilder().addTextDisplayComponents(confirmDeletedText);
            } else {
                const cancelText = new TextDisplayBuilder().setContent(await t(btnInteraction, 'tempvoice.tv_delete.cancelled'));
                resultContainer = new ContainerBuilder().addTextDisplayComponents(cancelText);
            }

            await btnInteraction.update({
                components: [resultContainer],
                flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2,
            });
        });

        collector.on('end', async (_collected, reason) => {
            if (reason === 'time' && msg.editable) {
                const expiredContainer = new ContainerBuilder().addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(await t(interaction, 'tempvoice.tv_delete.expired'))
                );
                await msg
                    .edit({
                        components: [expiredContainer],
                        flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2,
                        embeds: [],
                    })
                    .catch(() => {});
            }
        });
    },
};
