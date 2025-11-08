/**
 * @namespace: addons/core/commands/utils/vote.js
 * @type: Command
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.9.11-beta
 */
const {
    SlashCommandBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    SeparatorSpacingSize,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    MessageFlags,
    MediaGalleryItemBuilder,
    MediaGalleryBuilder,
} = require('discord.js');

module.exports = {
    aliases: ['v'],
    data: new SlashCommandBuilder().setName('vote').setDescription(`❤️ Vote for kythia on top.gg!`),
    async execute(interaction, container) {
        const { t, kythiaConfig, helpers } = container;
        const { convertColor } = helpers.color;

        const components = [
            (async () => {
                const container = new ContainerBuilder().setAccentColor(
                    convertColor(kythiaConfig.bot.color, { from: 'hex', to: 'decimal' })
                );

                // Attach a banner if it's defined
                if (kythiaConfig.settings?.voteBannerImage) {
                    container.addMediaGalleryComponents(
                        new MediaGalleryBuilder().addItems([new MediaGalleryItemBuilder().setURL(kythiaConfig.settings.voteBannerImage)])
                    );
                }

                container
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            await t(interaction, 'core.utils.vote.container.title', { username: interaction.client.user.username })
                        )
                    )
                    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            await t(interaction, 'core.utils.vote.container.desc', { username: interaction.client.user.username })
                        )
                    )
                    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
                    .addActionRowComponents(
                        new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setStyle(ButtonStyle.Link)
                                .setLabel(
                                    await t(interaction, 'core.utils.vote.button.topgg', { username: interaction.client.user.username })
                                )
                                .setURL(`https://top.gg/bot/${kythiaConfig.bot.clientId}/vote`)
                        )
                    )
                    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            await t(interaction, 'common.container.footer', { username: interaction.client.user.username })
                        )
                    );

                return container;
            })(),
        ];

        await interaction.reply({
            components: components,
            flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2,
        });
    },
};
