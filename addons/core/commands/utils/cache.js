const { SlashCommandBuilder, EmbedBuilder, InteractionContextType } = require('discord.js');
const KythiaModel = require('@src/database/KythiaModel');
const { embedFooter } = require('@utils/discord');

module.exports = {
    data: new SlashCommandBuilder().setName('cache').setDescription('Shows cache statistics.').setContexts(InteractionContextType.BotDM),
    ownerOnly: true,
    async execute(interaction) {
        const stats = KythiaModel.cacheStats;
        const embed = new EmbedBuilder()
            .setDescription('## 📊 Cache Engine Statistics')
            .setColor(kythia.bot.color)
            .addFields(
                { name: 'Redis Hits', value: stats.redisHits.toString(), inline: true },
                { name: 'In-Memory Hits', value: stats.mapHits.toString(), inline: true },
                { name: 'Cache Misses', value: stats.misses.toString(), inline: true },
                { name: 'Cache Sets', value: stats.sets.toString(), inline: true },
                { name: 'Cache Clears', value: stats.clears.toString(), inline: true },
                { name: 'Redis Connected', value: KythiaModel.isRedisConnected ? '✅ Yes' : '❌ No', inline: true }
            )
            .setFooter(await embedFooter(interaction));
        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
