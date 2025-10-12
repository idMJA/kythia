/**
 * @namespace: addons/economy/commands/give.js
 * @type: Command
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.9.9-beta-rc.1
 */
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
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
                // .setTimestamp()
                .setFooter(await embedFooter(interaction));
            return interaction.editReply({ embeds: [embed] });
        }

        if (amount <= 0) {
            const embed = new EmbedBuilder()
                .setColor('Yellow')
                .setDescription(await t(interaction, 'economy_give_give_invalid_amount'))
                .setThumbnail(interaction.user.displayAvatarURL())
                // .setTimestamp()
                .setFooter(await embedFooter(interaction));
            return interaction.editReply({ embeds: [embed] });
        }

        if (target.id === interaction.user.id) {
            const embed = new EmbedBuilder()
                .setColor('Yellow')
                .setDescription(await t(interaction, 'economy_give_give_self'))
                .setThumbnail(interaction.user.displayAvatarURL())
                // .setTimestamp()
                .setFooter(await embedFooter(interaction));
            return interaction.editReply({ embeds: [embed] });
        }

        const receiver = await KythiaUser.getCache({ userId: target.id });
        if (!receiver) {
            const embed = new EmbedBuilder()
                .setColor('Red')
                .setDescription(await t(interaction, 'economy_give_give_no_target_account'))
                .setThumbnail(target.displayAvatarURL ? target.displayAvatarURL() : null)
                // .setTimestamp()
                .setFooter(await embedFooter(interaction));
            return interaction.editReply({ embeds: [embed] });
        }

        if (giver.kythiaCoin < amount) {
            const embed = new EmbedBuilder()
                .setColor('Red')
                .setDescription(await t(interaction, 'economy_give_give_not_enough_cash'))
                .setThumbnail(interaction.user.displayAvatarURL())
                // .setTimestamp()
                .setFooter(await embedFooter(interaction));
            return interaction.editReply({ embeds: [embed] });
        }

        // Update balances
        giver.kythiaCoin -= amount;
        receiver.kythiaCoin += amount;

        giver.changed('kythiaCoin', true);
        receiver.changed('kythiaCoin', true);
        await giver.saveAndUpdateCache('userId');
        await receiver.saveAndUpdateCache('userId');

        const embed = new EmbedBuilder()
            .setColor(kythia.bot.color)
            .setDescription(
                await t(interaction, 'economy_give_give_success', {
                    amount,
                    target: target.username,
                })
            )
            .setThumbnail(interaction.user.displayAvatarURL())
            // .setTimestamp()
            .setFooter(await embedFooter(interaction));
        return interaction.editReply({ embeds: [embed] });
    },
};
