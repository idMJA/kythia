/**
 * @namespace: addons/core/events/guildMemberRemove.js
 * @type: Event Handler
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.9.9-beta-rc.1
 */

const ServerSetting = require('../database/models/ServerSetting');
const { resolvePlaceholders } = require('@coreHelpers/stats');
const { generateBanner } = require('../helpers/canvas');
const { embedFooter } = require('@src/utils/discord');
const User = require('../database/models/User');
const { EmbedBuilder } = require('discord.js');

module.exports = async (bot, member) => {
    // Optional: Track leaving user if necessary
    let user = await User.findOne({ where: { userId: member.user.id } });
    if (!user) {
        user = await User.create({ userId: member.user.id, guildId: member.guild.id });
    }
    const guild = member.guild;
    const guildId = guild.id;

    const setting = await ServerSetting.getCache({ guildId: guildId });
    if (!setting || !setting.welcomeOutOn) return;

    const channel = guild.channels.cache.get(setting.welcomeOutChannelId);
    if (!channel) return console.log('Goodbye channel not found');

    // Compose statsData for placeholders
    const statsData = {
        userId: member.user.id,
        tag: member.user.tag,
        username: member.user.username,
        userTag: member.user.id,
        guildName: guild.name,
        guildId: guild.id,
        ownerName: guild.members.cache.get(guild.ownerId)?.user?.tag || 'Unknown',
        ownerId: guild.ownerId,
        region: guild.preferredLocale,
        createdAt: guild.createdAt,
        boosts: guild.premiumSubscriptionCount || 0,
        boostLevel: guild.premiumTier || 0,
        members: guild.memberCount,
        roles: guild.roles.cache.size,
        emojis: guild.emojis.cache.size,
        stickers: guild.stickers.cache.size,
        memberJoin: member.joinedAt,
        online: guild.members.cache.filter((m) => m.presence?.status === 'online').size,
        idle: guild.members.cache.filter((m) => m.presence?.status === 'idle').size,
        dnd: guild.members.cache.filter((m) => m.presence?.status === 'dnd').size,
        offline: guild.members.cache.filter((m) => !m.presence || m.presence.status === 'offline').size,
        bots: guild.members.cache.filter((m) => m.user.bot).size,
        humans: guild.members.cache.filter((m) => !m.user.bot).size,
        onlineBots: guild.members.cache.filter((m) => m.user.bot && m.presence && m.presence.status !== 'offline').size,
        onlineHumans: guild.members.cache.filter((m) => !m.user.bot && m.presence && m.presence.status !== 'offline').size,
        channels: guild.channels.cache.size,
        textChannels: guild.channels.cache.filter((c) => c.type === 0 || c.type === 'GUILD_TEXT').size,
        voiceChannels: guild.channels.cache.filter((c) => c.type === 2 || c.type === 'GUILD_VOICE').size,
        categories: guild.channels.cache.filter((c) => c.type === 4 || c.type === 'GUILD_CATEGORY').size,
        announcementChannels: guild.channels.cache.filter((c) => c.type === 5 || c.type === 'GUILD_ANNOUNCEMENT').size,
        stageChannels: guild.channels.cache.filter((c) => c.type === 13 || c.type === 'GUILD_STAGE_VOICE').size,
        verified: guild.verified,
        partnered: guild.partnered,
        membersTotal: guild.members.cache.size,
    };

    // Goodbye text
    let goodbyeText;
    if (setting.welcomeOutEmbedText) {
        let goodbyeRaw = setting.welcomeOutEmbedText;
        if (typeof goodbyeRaw !== 'string' || !goodbyeRaw.trim()) {
            goodbyeText = `${member.user.username} has left the server.`;
        } else {
            try {
                goodbyeText = await resolvePlaceholders(goodbyeRaw, statsData, member.guild.preferredLocale);
                if (typeof goodbyeText === 'string') {
                    goodbyeText = goodbyeText.replace(/\\n/g, '\n');
                }
                if (goodbyeText == null) {
                    goodbyeText = `${member.user.username} has left the server.`;
                }
            } catch (err) {
                console.error('Error in resolvePlaceholders for goodbyeText:', err);
                goodbyeText = `${member.user.username} has left the server.`;
            }
        }
    } else {
        goodbyeText = `${member.user.username} has left the server.`;
    }

    async function safeResolvePlaceholder(member, text, statsData, fallback = '') {
        if (typeof text !== 'string' || !text.trim()) return fallback;
        try {
            let result = await resolvePlaceholders(text, statsData, member.guild.preferredLocale);
            if (typeof result === 'string') {
                result = result.replace(/\\n/g, '\n');
            }
            if (result == null) return fallback;
            return result;
        } catch (err) {
            console.error('Error in resolvePlaceholders for banner text:', err);
            return fallback;
        }
    }

    // Goodbye banner
    let goodbyeImage = await generateBanner({
        width: setting.welcomeOutBannerWidth,
        height: setting.welcomeOutBannerHeight,
        backgroundURL: setting.welcomeOutBackgroundUrl,
        foregroundURL: setting.welcomeOutForegroundUrl,
        overlay: { color: setting.welcomeOutOverlayColor },
        avatar: {
            enabled: setting.welcomeOutAvatarEnabled,
            url: member.user.displayAvatarURL({ extension: 'png', size: 512 }),
            size: setting.welcomeOutAvatarSize,
            round: (setting.welcomeOutAvatarShape || 'circle') === 'circle',
            yOffset: setting.welcomeOutAvatarYOffset,
            border: {
                color: setting.welcomeOutAvatarBorderColor,
                width: setting.welcomeOutAvatarBorderWidth,
            },
        },
        texts: [
            {
                text: await safeResolvePlaceholder(member, setting.welcomeOutMainTextContent, statsData, ''),
                font: setting.welcomeOutMainTextFont,
                color: setting.welcomeOutMainTextColor,
                align: 'center',
                baseline: 'middle',
                x: (setting.welcomeOutBannerWidth || 800) / 2,
                y: (setting.welcomeOutBannerHeight || 300) / 2 + (setting.welcomeOutMainTextYOffset || -80),
                shadow: {
                    color: setting.welcomeOutShadowColor,
                    blur: setting.welcomeOutShadowBlur,
                },
                maxWidth: (setting.welcomeOutBannerWidth || 800) * 0.9,
                uppercase: false,
            },
            {
                text: await safeResolvePlaceholder(member, setting.welcomeOutSubTextContent, statsData, ''),
                font: setting.welcomeOutSubTextFont,
                color: setting.welcomeOutSubTextColor,
                align: 'center',
                baseline: 'middle',
                x: (setting.welcomeOutBannerWidth || 800) / 2,
                y: (setting.welcomeOutBannerHeight || 300) / 2 + (setting.welcomeOutSubTextYOffset || 100),
                shadow: {
                    color: setting.welcomeOutShadowColor,
                    blur: setting.welcomeOutShadowBlur,
                },
                maxWidth: (setting.welcomeOutBannerWidth || 800) * 0.8,
                uppercase: false,
            },
        ],
        fontFamily: setting.welcomeOutMainTextFontFamily,
        subTextFontFamily: setting.welcomeOutSubTextFontFamily,
        memberCount: guild.memberCount,
        username: member.user.username,
        guildName: guild.name,
        interaction: member,
        border: {
            color: setting.welcomeOutBorderColor,
            width: setting.welcomeOutBorderWidth,
        },
        extraDraw: setting.welcomeOutExtraDraw,
    });

    let safeGoodbyeText;
    try {
        if (typeof goodbyeText !== 'string') {
            safeGoodbyeText = String(goodbyeText ?? '');
        } else {
            safeGoodbyeText = goodbyeText;
        }
    } catch (e) {
        safeGoodbyeText = '';
    }

    let embedImageUrl = goodbyeImage;
    let files = [];
    if (Buffer.isBuffer(goodbyeImage)) {
        const { AttachmentBuilder } = require('discord.js');
        const attachment = new AttachmentBuilder(goodbyeImage, { name: 'goodbye.png' });
        files.push(attachment);
        embedImageUrl = 'attachment://goodbye.png';
    }

    const goodbyeEmbed = new EmbedBuilder()
        .setColor(kythia.bot.color)
        .setDescription(safeGoodbyeText)
        .setImage(embedImageUrl)
        .setFooter(await embedFooter(member));

    channel.send({ embeds: [goodbyeEmbed], files });
};
