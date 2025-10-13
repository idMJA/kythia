/**
 * @namespace: addons/economy/commands/leaderboard.js
 * @type: Command
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.9.9-beta-rc.1
 */
const {
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    SeparatorSpacingSize,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    MessageFlags,
} = require('discord.js');
const KythiaUser = require('@coreModels/KythiaUser');
const { t } = require('@utils/translator');
const convertColor = require('@utils/color');

const USERS_PER_PAGE = 10;
const MAX_USERS = 100;

// Helper to build a row of nav buttons, optionally disabled
async function buildNavButtons(interaction, page, totalPages, allDisabled = false) {
    return [
        new ButtonBuilder()
            .setCustomId('leaderboard_first')
            .setLabel(await t(interaction, 'economy_leaderboard_nav_first'))
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(allDisabled || page <= 1),
        new ButtonBuilder()
            .setCustomId('leaderboard_prev')
            .setLabel(await t(interaction, 'economy_leaderboard_nav_prev'))
            .setStyle(ButtonStyle.Primary)
            .setDisabled(allDisabled || page <= 1),
        new ButtonBuilder()
            .setCustomId('leaderboard_next')
            .setLabel(await t(interaction, 'economy_leaderboard_nav_next'))
            .setStyle(ButtonStyle.Primary)
            .setDisabled(allDisabled || page >= totalPages),
        new ButtonBuilder()
            .setCustomId('leaderboard_last')
            .setLabel(await t(interaction, 'economy_leaderboard_nav_last'))
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(allDisabled || page >= totalPages),
    ];
}

async function generateLeaderboardContainer(interaction, page, topUsers, totalUsers, navDisabled = false) {
    const totalPages = Math.max(1, Math.ceil(totalUsers / USERS_PER_PAGE));
    page = Math.max(1, Math.min(page, totalPages));

    const startIndex = (page - 1) * USERS_PER_PAGE;
    const pageUsers = topUsers.slice(startIndex, startIndex + USERS_PER_PAGE);

    // Build leaderboard text
    let leaderboardText = '';
    if (pageUsers.length === 0) {
        leaderboardText = await t(interaction, 'economy_leaderboard_empty');
    } else {
        const entries = await Promise.all(
            pageUsers.map(async (user, index) => {
                const rank = startIndex + index + 1;
                const totalWealth = (BigInt(user.kythiaCoin) + BigInt(user.kythiaBank)).toString();
                const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `**${rank}.**`;

                // Fetch username from Discord
                let username;
                try {
                    const discordUser = await interaction.client.users.fetch(user.userId);
                    username = `${discordUser.username} (${user.userId})`;
                } catch (error) {
                    username = `Unknown User (${user.userId})`;
                }

                return await t(interaction, 'economy_leaderboard_entry', {
                    medal,
                    username,
                    wealth: BigInt(totalWealth).toLocaleString(),
                    coin: BigInt(user.kythiaCoin).toLocaleString(),
                    bank: BigInt(user.kythiaBank).toLocaleString(),
                });
            })
        );
        leaderboardText = entries.join('\n');
    }

    // Build container, insert navigation buttons inside
    const navButtons = await buildNavButtons(interaction, page, totalPages, navDisabled);

    const container = new ContainerBuilder()
        .setAccentColor(convertColor(kythia.bot.color, { from: 'hex', to: 'decimal' }))
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                await t(interaction, 'economy_leaderboard_title', {
                    page,
                    totalPages,
                })
            )
        )
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(leaderboardText))
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                await t(interaction, 'economy_leaderboard_footer', {
                    totalUsers,
                })
            )
        )
        // Add navigation buttons using addActionRowComponents, see about.js
        .addActionRowComponents(
            new ActionRowBuilder().addComponents(...navButtons)
        );

    return { container, page, totalPages };
}

module.exports = {
    subcommand: true,
    data: (subcommand) => subcommand.setName('leaderboard').setDescription('🏆 View the global economy leaderboard.'),

    async execute(interaction) {
        await interaction.deferReply();

        // Fetch all users ordered by total wealth (coin + bank)
        const allUsers = await KythiaUser.findAll({
            attributes: ['userId', 'kythiaCoin', 'kythiaBank'],
            order: [
                [KythiaUser.sequelize.literal('(kythiaCoin + kythiaBank)'), 'DESC'],
            ],
            limit: MAX_USERS,
        });

        const totalUsers = allUsers.length;
        let currentPage = 1;

        if (totalUsers === 0) {
            const { container } = await generateLeaderboardContainer(interaction, 1, [], 0, /*navDisabled*/ true);
            return interaction.editReply({
                components: [container],
                flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2,
            });
        }

        const { container, page, totalPages } = await generateLeaderboardContainer(interaction, currentPage, allUsers, totalUsers);

        const message = await interaction.editReply({
            components: [container],
            flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2,
            fetchReply: true,
        });

        // Only add collector if there are multiple pages
        if (totalPages <= 1) return;

        const collector = message.createMessageComponentCollector({ time: 300000 });

        collector.on('collect', async (i) => {
            if (i.user.id !== interaction.user.id) {
                return i.reply({
                    content: await t(i, 'economy_leaderboard_not_your_interaction'),
                    ephemeral: true,
                });
            }

            // Handle navigation
            if (i.customId === 'leaderboard_first') {
                currentPage = 1;
            } else if (i.customId === 'leaderboard_prev') {
                currentPage = Math.max(1, currentPage - 1);
            } else if (i.customId === 'leaderboard_next') {
                currentPage = Math.min(totalPages, currentPage + 1);
            } else if (i.customId === 'leaderboard_last') {
                currentPage = totalPages;
            }

            const { container: newContainer, page: newPage } = await generateLeaderboardContainer(
                i,
                currentPage,
                allUsers,
                totalUsers
            );

            await i.update({
                components: [newContainer],
                flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2,
            });
        });

        collector.on('end', async () => {
            try {
                const { container: finalContainer } = await generateLeaderboardContainer(
                    interaction,
                    currentPage,
                    allUsers,
                    totalUsers,
                    /*navDisabled*/ true
                );

                await message.edit({
                    components: [finalContainer],
                    flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2,
                });
            } catch (error) {
                // Message might be deleted
            }
        });
    },
};
