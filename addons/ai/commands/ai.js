/**
 * @namespace: addons/ai/commands/ai.js
 * @type: Command
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.9.9-beta-rc.5
 */

const { SlashCommandBuilder, PermissionFlagsBits, InteractionContextType, EmbedBuilder } = require('discord.js');
const { t } = require('@coreHelpers/translator');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ai')
        .setDescription('🌸 Manage AI mode in this channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .setContexts(InteractionContextType.Guild)
        .addSubcommand((sub) => sub.setName('enable').setDescription('Enable AI in this channel'))
        .addSubcommand((sub) => sub.setName('disable').setDescription('Disable AI in this channel')),
    permissions: PermissionFlagsBits.ManageGuild,
    isInMainGuild: true,
    voteLocked: true,
    guildOnly: true,
    async execute(interaction, container) {
        await interaction.deferReply();

        const channelId = interaction.channel.id;
        let setting = await ServerSetting.getCache({ guildId: interaction.guild.id });
        let aiChannelIds = Array.isArray(setting?.aiChannelIds) ? [...setting.aiChannelIds] : [];
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'enable') {
            if (aiChannelIds.includes(channelId)) {
                const embed = new EmbedBuilder().setColor('Yellow').setDescription(await t(interaction, 'ai.ai.manage.already.enabled'));
                return interaction.editReply({ embeds: [embed] });
            }

            aiChannelIds.push(channelId);
            setting.aiChannelIds = aiChannelIds;
            setting.changed('aiChannelIds', true);
            await setting.save();
            const embed = new EmbedBuilder().setColor('Green').setDescription(await t(interaction, 'ai.ai.manage.enable.success'));
            return interaction.editReply({ embeds: [embed] });
        }

        if (subcommand === 'disable') {
            const index = aiChannelIds.indexOf(channelId);
            if (index === -1) {
                const embed = new EmbedBuilder().setColor('Red').setDescription(await t(interaction, 'ai.ai.manage.not.enabled'));
                return interaction.editReply({ embeds: [embed] });
            }

            aiChannelIds.splice(index, 1);
            setting.aiChannelIds = aiChannelIds;
            setting.changed('aiChannelIds', true);
            await setting.save();
            
            const embed = new EmbedBuilder().setColor('Orange').setDescription(await t(interaction, 'ai.ai.manage.disable.success'));
            return interaction.editReply({ embeds: [embed] });
        }

        // Fallback for unknown subcommand
        const embed = new EmbedBuilder().setColor('Red').setDescription(await t(interaction, 'ai.ai.manage.unknown.subcommand'));
        return interaction.editReply({ embeds: [embed] });
    },
};
