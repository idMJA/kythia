/**
 * @namespace: addons/tempvoice/buttons/tv_kick.js
 * @type: Module
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.9.11-beta
 */
const { ActionRowBuilder, UserSelectMenuBuilder, ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');

module.exports = {
    execute: async (interaction, container) => {
        const { models, t, helpers, kythiaConfig } = container;
        const { convertColor } = helpers.color;

        // 1. Cek kepemilikan
        const activeChannel = await models.TempVoiceChannel.findOne({
            where: { ownerId: interaction.user.id, guildId: interaction.guild.id },
        });
        if (!activeChannel) {
            return interaction.reply({
                content: await t(interaction, 'tempvoice.kick.no_active_channel'),
                ephemeral: true,
            });
        }

        // 2. Buat User Select Menu
        const selectMenu = new UserSelectMenuBuilder()
            .setCustomId(`tv_kick_menu:${activeChannel.channelId}`)
            .setPlaceholder(await t(interaction, 'tempvoice.kick.menu.placeholder'))
            .setMinValues(1)
            .setMaxValues(1); // Satu user per kick

        const row = new ActionRowBuilder().addComponents(selectMenu);

        // 3. Build Container (ala tv_privacy)
        const containerComponent = new ContainerBuilder()
            .setAccentColor(convertColor(kythiaConfig.bot.color, { from: 'hex', to: 'decimal' }))
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(await t(interaction, 'tempvoice.kick.menu.content')))
            .addActionRowComponents(row);

        await interaction.reply({
            components: [containerComponent],
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        });
    },
};
