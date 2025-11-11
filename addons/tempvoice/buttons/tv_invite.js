/**
 * @namespace: addons/tempvoice/buttons/tv_invite.js
 * @type: Button Handler
 */
const { ActionRowBuilder, UserSelectMenuBuilder, ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');

module.exports = {
    execute: async (interaction, container) => {
        const { models, t, helpers, kythiaConfig } = container;
        const { convertColor } = helpers.color;
        const { simpleContainer } = helpers.discord; // Asumsi helper-mu

        // 1. Cek kepemilikan
        const activeChannel = await models.TempVoiceChannel.findOne({
            where: { ownerId: interaction.user.id, guildId: interaction.guild.id },
        });
        if (!activeChannel) {
            return interaction.reply({
                components: await simpleContainer(interaction, await t(interaction, 'tempvoice.invite.no_active_channel'), {
                    color: 'Red',
                }),
                flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
            });
        }

        // 2. Buat User Select Menu
        const selectMenu = new UserSelectMenuBuilder()
            .setCustomId(`tv_invite_menu:${activeChannel.channelId}`)
            .setPlaceholder(await t(interaction, 'tempvoice.invite.menu.placeholder'))
            .setMinValues(1)
            .setMaxValues(10); // Biar bisa ngundang banyak

        const row = new ActionRowBuilder().addComponents(selectMenu);
        const accentColor = convertColor(kythiaConfig.bot.color, { from: 'hex', to: 'decimal' });

        // 3. Bales pake container
        const containerComponent = new ContainerBuilder()
            .setAccentColor(accentColor)
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(await t(interaction, 'tempvoice.invite.menu.content')))
            .addActionRowComponents(row);

        await interaction.reply({
            components: [containerComponent],
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        });
    },
};
