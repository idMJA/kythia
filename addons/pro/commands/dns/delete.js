/**
 * @namespace: addons/pro/commands/dns/delete.js
 * @type: Command
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.9.11-beta
 */
const { EmbedBuilder } = require('discord.js');

module.exports = {
    subcommand: true,
    data: (subcommand) =>
        subcommand
            .setName('delete')
            .setDescription('🌐 Delete a DNS record from your subdomain.')
            .addIntegerOption((option) =>
                option.setName('id').setDescription('Unique ID of the record you want to delete (see /pro dns list)').setRequired(true)
            ),

    async execute(interaction, container) {
        const { kythiaConfig, models, helpers, t } = container;
        const cloudflareApi = container.services.cloudflare;
        const { Subdomain, DnsRecord } = models;
        const { embedFooter, isPremium, isVoterActive } = helpers.discord;

        await interaction.deferReply({ ephemeral: true });

        const isPremiumDonatur = await isPremium(interaction.user.id);
        const isVoter = await isVoterActive(interaction.user.id);

        if (!isPremiumDonatur && !isVoter) {
            const desc = await t(interaction, 'pro.dns.delete.error.notPremium');
            const embed = new EmbedBuilder()
                .setColor(kythiaConfig.bot.color)
                .setDescription(desc)
                .setFooter(await embedFooter(interaction));
            return interaction.editReply({ embeds: [embed] });
        }

        const recordId = interaction.options.getInteger('id');

        const recordToDelete = await DnsRecord.getCache({
            id: recordId,
            include: {
                model: Subdomain,
                as: 'subdomain',
                attributes: ['userId'],
            },
        });

        if (!recordToDelete) {
            const desc = await t(interaction, 'pro.dns.delete.error.notFound', { id: recordId });
            const embed = new EmbedBuilder()
                .setColor(kythiaConfig.bot.color)
                .setDescription(desc)
                .setFooter(await embedFooter(interaction));
            return interaction.editReply({ embeds: [embed] });
        }

        if (recordToDelete.subdomain.userId !== interaction.user.id) {
            const desc = await t(interaction, 'pro.dns.delete.error.notOwner', { id: recordId });
            const embed = new EmbedBuilder()
                .setColor('Red')
                .setDescription(desc)
                .setFooter(await embedFooter(interaction));
            return interaction.editReply({ embeds: [embed] });
        }

        const result = await cloudflareApi.deleteRecord(recordId);

        if (result.success) {
            const title = await t(interaction, 'pro.dns.delete.success.title');
            const desc = await t(interaction, 'pro.dns.delete.success.desc', {
                id: recordToDelete.id,
                type: recordToDelete.type,
                name: recordToDelete.name,
                value: recordToDelete.value,
            });
            const embed = new EmbedBuilder()
                .setColor('Green')
                .setTitle(title)
                .setDescription(desc)
                .setFooter(await embedFooter(interaction));
            return interaction.editReply({ embeds: [embed] });
        } else {
            const title = await t(interaction, 'pro.dns.delete.error.failedTitle');
            const desc = await t(interaction, 'pro.dns.delete.error.failedDesc', { error: result.error });
            const embed = new EmbedBuilder()
                .setColor('Red')
                .setTitle(title)
                .setDescription(desc)
                .setFooter(await embedFooter(interaction));
            return interaction.editReply({ embeds: [embed] });
        }
    },
};
