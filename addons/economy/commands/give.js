/**
 * @namespace: addons/economy/commands/give.js
 * @type: Command
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.9.9-beta-rc.1
 */
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const KythiaUser = require('@coreModels/KythiaUser');
const { embedFooter } = require('@utils/discord');
const { t } = require('@utils/translator');

module.exports = {
    subcommand: true,
    data: (subcommand) =>
        subcommand
            .setName('give')
            .setDescription('💰 Give kythia coin to another user.')
            .addUserOption((option) => option.setName('target').setDescription('User to give kythia coin to').setRequired(true))
            .addIntegerOption((option) => option.setName('amount').setDescription('Amount of kythia coin to give').setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();

        const target = interaction.options.getUser('target');
        const amount = interaction.options.getInteger('amount');

        const giver = await KythiaUser.getCache({ userId: interaction.user.id });
        if (!giver) {
            const embed = new EmbedBuilder()
                .setColor(kythia.bot.color)
                .setDescription(await t(interaction, 'economy_withdraw_no_account_desc'))
                .setThumbnail(interaction.user.displayAvatarURL())
                .setFooter(await embedFooter(interaction));
            return interaction.editReply({ embeds: [embed] });
        }

        if (amount <= 0) {
            const embed = new EmbedBuilder()
                .setColor('Yellow')
                .setDescription(await t(interaction, 'economy_give_give_invalid_amount'))
                .setThumbnail(interaction.user.displayAvatarURL())
                .setFooter(await embedFooter(interaction));
            return interaction.editReply({ embeds: [embed] });
        }

        if (target.id === interaction.user.id) {
            const embed = new EmbedBuilder()
                .setColor('Yellow')
                .setDescription(await t(interaction, 'economy_give_give_self'))
                .setThumbnail(interaction.user.displayAvatarURL())
                .setFooter(await embedFooter(interaction));
            return interaction.editReply({ embeds: [embed] });
        }

        const receiver = await KythiaUser.getCache({ userId: target.id });
        if (!receiver) {
            const embed = new EmbedBuilder()
                .setColor('Red')
                .setDescription(await t(interaction, 'economy_give_give_no_target_account'))
                .setThumbnail(target.displayAvatarURL ? target.displayAvatarURL() : null)
                .setFooter(await embedFooter(interaction));
            return interaction.editReply({ embeds: [embed] });
        }

        if (giver.kythiaCoin < amount) {
            const embed = new EmbedBuilder()
                .setColor('Red')
                .setDescription(await t(interaction, 'economy_give_give_not_enough_cash'))
                .setThumbnail(interaction.user.displayAvatarURL())
                .setFooter(await embedFooter(interaction));
            return interaction.editReply({ embeds: [embed] });
        }

        // Confirmation Embed & Buttons (like transfer.js)
        const confirmEmbed = new EmbedBuilder()
            .setColor(kythia.bot.color)
            .setThumbnail(interaction.user.displayAvatarURL())
            .setDescription(
                await t(interaction, 'economy_give_give_confirm', {
                    amount,
                    target: target.username,
                })
            )
            .setFooter(await embedFooter(interaction));

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('confirm')
                .setLabel(await t(interaction, 'economy_give_give_btn_confirm'))
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('cancel')
                .setLabel(await t(interaction, 'economy_give_give_btn_cancel'))
                .setStyle(ButtonStyle.Danger)
        );

        await interaction.editReply({ embeds: [confirmEmbed], components: [row] });

        const filter = (i) => i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });

        collector.on('collect', async (i) => {
            if (i.customId === 'confirm') {
                // Update balances
                giver.kythiaCoin -= amount;
                receiver.kythiaCoin += amount;

                giver.changed('kythiaCoin', true);
                receiver.changed('kythiaCoin', true);
                await giver.saveAndUpdateCache('userId');
                await receiver.saveAndUpdateCache('userId');

                const successEmbed = new EmbedBuilder()
                    .setColor(kythia.bot.color)
                    .setDescription(
                        await t(interaction, 'economy_give_give_success', {
                            amount,
                            target: target.username,
                        })
                    )
                    .setThumbnail(interaction.user.displayAvatarURL())
                    .setFooter(await embedFooter(interaction));
                await i.update({ embeds: [successEmbed], components: [] });

                // DM the receiver about the gift (optional, but like transfer.js DM the receiver)
                const receiverEmbed = new EmbedBuilder()
                    .setColor(kythia.bot.color)
                    .setDescription(
                        await t(interaction, 'economy_give_give_received', {
                            amount,
                            from: interaction.user.username,
                        })
                    )
                    .setThumbnail(interaction.user.displayAvatarURL())
                    .setFooter(await embedFooter(interaction));
                try {
                    const member = await interaction.client.users.fetch(target.id);
                    await member.send({ embeds: [receiverEmbed] });
                } catch (e) {
                    // ignore DM errors
                }
            } else if (i.customId === 'cancel') {
                const cancelEmbed = new EmbedBuilder()
                    .setColor(kythia.bot.color)
                    .setDescription(await t(interaction, 'economy_give_give_cancelled'))
                    .setFooter(await embedFooter(interaction));
                await i.update({ embeds: [cancelEmbed], components: [] });
            }
        });

        collector.on('end', async (collected) => {
            if (collected.size === 0) {
                const timeoutEmbed = new EmbedBuilder()
                    .setColor(kythia.bot.color)
                    .setDescription(await t(interaction, 'economy_give_give_timeout'))
                    .setFooter(await embedFooter(interaction));
                await interaction.editReply({ embeds: [timeoutEmbed], components: [] });
            }
        });
    },
};