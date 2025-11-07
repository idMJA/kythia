/**
 * @namespace: addons/music/helpers/musicManager.js
 * @type: Helper Script
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.9.11-beta
 */

const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    MessageFlags,
    ComponentType,
    SectionBuilder,
    ThumbnailBuilder,
    MediaGalleryBuilder,
    MediaGalleryItemBuilder,
} = require('discord.js');
const { Poru } = require('poru');
const { createProgressBar, hasControlPermission } = require('.');
const convertColor = require('kythia-core').utils.color;
const logger = require('@coreHelpers/logger');
const { t } = require('@coreHelpers/translator');
const { Spotify } = require('poru-spotify');
const {
    handleLyrics,
    handlePauseResume,
    handleSkip,
    handleStop,
    handleLoop,
    handleAutoplay,
    handleQueue,
    handleShuffle,
    handleFilter,
    handleFavorite,
} = require('./handlers');
const { setVoiceChannelStatus } = require('@coreHelpers/discord');

const guildStates = new Map();

module.exports.guildStates = guildStates;

/**
 * Helper to edit the Now Playing message with an "ended" container.
 * Used in ALL ended track scenarios.
 * @param {object} player - The Poru player instance.
 * @param {object} track - The track that just ended (may be null).
 * @param {object} client - The Discord client.
 * @param {object} channel - The text channel (optional, will try to resolve from player).
 */
async function shutdownPlayerUI(player, track, client, channel) {
    try {
        if (!player.nowPlayingMessage?.editable) return;
        channel = channel || player.nowPlayingMessage.channel || (client && client.channels.cache.get(player.textChannel));
        let endedText, artistText, requestedByText, artworkUrl, title, url;
        if (track && track.info) {
            endedText = await t(channel, 'music.helpers.musicManager.manager.now.ended', {
                title: track.info.title,
                url: track.info.uri,
            });
            artistText = await t(channel, 'music.helpers.musicManager.manager.channel', { author: track.info.author });
            requestedByText = await t(channel, 'music.helpers.musicManager.manager.requested.by', {
                user: track.info.requester?.username
                    ? `${track.info.requester} (${track.info.requester.username})`
                    : `${track.info.requester}`,
            });
            artworkUrl = track.info.artworkUrl || track.info.image || null;
            title = track.info.title;
            url = track.info.uri;
        } else {
            endedText = await t(channel, 'music.helpers.musicManager.manager.simple');
            artistText = '';
            requestedByText = '';
            artworkUrl = null;
            title = '';
            url = '';
        }

        const container = new ContainerBuilder().setAccentColor(convertColor('Red', { from: 'discord', to: 'decimal' }));

        if (kythia.addons.music.artworkUrlStyle === 'banner' && artworkUrl) {
            container.addMediaGalleryComponents(
                new MediaGalleryBuilder().addItems([artworkUrl ? new MediaGalleryItemBuilder().setURL(artworkUrl) : null])
            );
            container.addTextDisplayComponents(new TextDisplayBuilder().setContent(endedText));
        } else {
            container.addSectionComponents(
                new SectionBuilder()
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(endedText))
                    .setThumbnailAccessory(artworkUrl ? new ThumbnailBuilder().setDescription(title).setURL(artworkUrl) : null)
            );
        }
        if (artistText) container.addTextDisplayComponents(new TextDisplayBuilder().setContent(artistText));
        if (requestedByText) container.addTextDisplayComponents(new TextDisplayBuilder().setContent(requestedByText));
        container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));
        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(await t(channel, 'common.container.footer', { username: client.user.username }))
        );

        await player.nowPlayingMessage.edit({
            components: [container],
            flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2,
        });
    } catch (e) {}
}

function getFirstControlButtonRow(isPaused, disabled = false) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('music_pause_resume')
            [typeof kythia.emojis.musicPlay !== 'undefined' && typeof kythia.emojis.musicPause !== 'undefined' ? 'setEmoji' : 'setLabel'](
                typeof kythia.emojis.musicPlay !== 'undefined' && typeof kythia.emojis.musicPause !== 'undefined'
                    ? isPaused
                        ? kythia.emojis.musicPlay
                        : kythia.emojis.musicPause
                    : isPaused
                      ? 'Play'
                      : 'Pause'
            )
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(disabled),
        new ButtonBuilder()
            .setCustomId('music_skip')
            [typeof kythia.emojis.musicSkip !== 'undefined' ? 'setEmoji' : 'setLabel'](
                typeof kythia.emojis.musicSkip !== 'undefined' ? kythia.emojis.musicSkip : 'Skip'
            )
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(disabled),
        new ButtonBuilder()
            .setCustomId('music_stop')
            [typeof kythia.emojis.musicStop !== 'undefined' ? 'setEmoji' : 'setLabel'](
                typeof kythia.emojis.musicStop !== 'undefined' ? kythia.emojis.musicStop : 'Stop'
            )
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(disabled),
        new ButtonBuilder()
            .setCustomId('music_loop')
            [typeof kythia.emojis.musicLoop !== 'undefined' ? 'setEmoji' : 'setLabel'](
                typeof kythia.emojis.musicLoop !== 'undefined' ? kythia.emojis.musicLoop : 'Loop'
            )
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(disabled),
        new ButtonBuilder()
            .setCustomId('music_autoplay')
            [typeof kythia.emojis.musicAutoplay !== 'undefined' ? 'setEmoji' : 'setLabel'](
                typeof kythia.emojis.musicAutoplay !== 'undefined' ? kythia.emojis.musicAutoplay : 'Autoplay'
            )
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(disabled)
    );
}
function getSecondControlButtonRow(disabled = false) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('music_lyrics')
            [typeof kythia.emojis.musicLyrics !== 'undefined' ? 'setEmoji' : 'setLabel'](
                typeof kythia.emojis.musicLyrics !== 'undefined' ? kythia.emojis.musicLyrics : 'Lyrics'
            )
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(disabled),
        new ButtonBuilder()
            .setCustomId('music_queue')
            [typeof kythia.emojis.musicQueue !== 'undefined' ? 'setEmoji' : 'setLabel'](
                typeof kythia.emojis.musicQueue !== 'undefined' ? kythia.emojis.musicQueue : 'Queue'
            )
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(disabled),
        new ButtonBuilder()
            .setCustomId('music_shuffle')
            [typeof kythia.emojis.musicShuffle !== 'undefined' ? 'setEmoji' : 'setLabel'](
                typeof kythia.emojis.musicShuffle !== 'undefined' ? kythia.emojis.musicShuffle : 'Shuffle'
            )
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(disabled),
        new ButtonBuilder()
            .setCustomId('music_filter')
            [typeof kythia.emojis.musicFilter !== 'undefined' ? 'setEmoji' : 'setLabel'](
                typeof kythia.emojis.musicFilter !== 'undefined' ? kythia.emojis.musicFilter : 'Filter'
            )
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(disabled),
        new ButtonBuilder()
            .setCustomId('music_favorite_add')
            [typeof kythia.emojis.musicFavorite !== 'undefined' ? 'setEmoji' : 'setLabel'](
                typeof kythia.emojis.musicFavorite !== 'undefined' ? kythia.emojis.musicFavorite : 'Favorite'
            )
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(disabled)
    );
}

/**
 * Updates the "Now Playing" UI for a specific player.
 * Dijalankan oleh Global Ticker.
 * @param {object} player - The Poru player instance.
 */
async function updateNowPlayingUI(player) {
    try {
        const client = player.poru.client;

        const voiceChannel = client.channels.cache.get(player.voiceChannel);
        if (voiceChannel && !player._247) {
            const realUsers = voiceChannel.members.filter((m) => !m.user.bot);
            if (realUsers.size === 0) {
                if (player && !player.destroyed) {
                    player.destroy();
                }
                return;
            }
        }

        const currentTrack = player.currentTrack;
        const channel = client.channels.cache.get(player.textChannel);
        if (!currentTrack || !player.nowPlayingMessage?.editable || !channel) return;

        const updatedFirstControlButtonRow = getFirstControlButtonRow(player.isPaused, false);
        const updatedSecondControlButtonRow = getSecondControlButtonRow(false);

        const updatedNowPlayingText = await t(channel, 'music.helpers.musicManager.manager.playing', {
            title: currentTrack.info.title.replace(/[\[\]\(\)]/g, ''),
            url: currentTrack.info.uri,
        });
        const updatedProgress = createProgressBar(player);
        const updatedArtistText = await t(channel, 'music.helpers.musicManager.manager.channel', { author: currentTrack.info.author });
        const updatedRequestedByText = await t(channel, 'music.helpers.musicManager.manager.requested.by', {
            user: currentTrack.info.requester?.username
                ? `${currentTrack.info.requester} (${currentTrack.info.requester.username})`
                : `${currentTrack.info.requester}`,
        });

        let updatedSuggestionRow = null;
        if (player._latestSuggestionRow) {
            const menu = player._latestSuggestionRow.components[0];
            menu.setDisabled(false);
            updatedSuggestionRow = new ActionRowBuilder().addComponents(menu);
        }

        const updatedContainer = new ContainerBuilder().setAccentColor(convertColor(kythia.bot.color, { from: 'hex', to: 'decimal' }));

        if (kythia.addons.music.artworkUrlStyle === 'banner') {
            if (currentTrack.info.artworkUrl || currentTrack.info.image) {
                updatedContainer.addMediaGalleryComponents(
                    new MediaGalleryBuilder().addItems([
                        new MediaGalleryItemBuilder().setURL(currentTrack.info.artworkUrl || currentTrack.info.image),
                    ])
                );
            }
            updatedContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(updatedNowPlayingText));
        } else {
            updatedContainer.addSectionComponents(
                new SectionBuilder()
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(updatedNowPlayingText))
                    .setThumbnailAccessory(
                        currentTrack.info.artworkUrl || currentTrack.info.image
                            ? new ThumbnailBuilder()
                                  .setDescription(currentTrack.info.title)
                                  .setURL(currentTrack.info.artworkUrl || currentTrack.info.image)
                            : null
                    )
            );
        }

        updatedContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(updatedProgress));
        updatedContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(updatedArtistText));
        updatedContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(updatedRequestedByText));
        updatedContainer.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));
        if (updatedSuggestionRow) {
            updatedContainer.addActionRowComponents(updatedSuggestionRow);
            updatedContainer.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));
        }
        updatedContainer.addActionRowComponents(updatedFirstControlButtonRow);
        updatedContainer.addActionRowComponents(updatedSecondControlButtonRow);
        updatedContainer.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));
        updatedContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(await t(channel, 'common.container.footer', { username: client.user.username }))
        );

        if (player.state !== 'PLAYING' || !player.currentTrack) {
            return;
        }

        await player.nowPlayingMessage.edit({
            components: [updatedContainer],
            flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2,
        });
    } catch (e) {}
}

/**
 * 🎵 Initializes the Poru music manager and sets up all event listeners and Discord integration.
 * @param {object} bot - The bot object containing the Discord client.
 */
async function initializeMusicManager(bot) {
    const client = bot.client;

    if (!kythia.addons.music.spotify.clientID || !kythia.addons.music.spotify.clientSecret) {
        logger.warn('⚠️ Spotify Client ID/Secret not found in .env. Spotify features will be disabled.');
    }
    if (!kythia.addons.music.lavalink.hosts || !kythia.addons.music.lavalink.ports || !kythia.addons.music.lavalink.passwords) {
        logger.warn('⚠️ Lavalink Host/Port/Password/Secure not found in .env. Music features will be disabled.');
    }

    const nodes = (kythia.addons.music.lavalink.hosts || 'localhost').split(',').map((host, i) => ({
        name: `Kythia Nodes #${i + 1}`,
        host: host.trim(),
        port: parseInt((kythia.addons.music.lavalink.ports || '2333').split(',')[i] || '2333', 10),
        password: (kythia.addons.music.lavalink.passwords || 'youshallnotpass').split(',')[i] || 'youshallnotpass',
        secure: ((kythia.addons.music.lavalink.secures || 'false').split(',')[i] || 'false').toLowerCase() === 'true',
    }));

    let plugins = [];

    const spotify = new Spotify({
        clientID: kythia.addons.music.spotify.clientID,
        clientSecret: kythia.addons.music.spotify.clientSecret,
    });

    if (kythia.addons.music.spotify.clientID && kythia.addons.music.spotify.clientSecret) {
        plugins.push(spotify);
    }
    let source = kythia.addons.music.defaultPlatform || 'ytsearch';
    const PoruOptions = {
        library: 'discord.js',
        defaultPlatform: source,
        plugins: plugins,
    };

    const prevListener = process.listeners('unhandledRejection').slice();
    const poruLavalinkPattern = /\[Poru Websocket\] Unable to connect with (.+?) node after (\d+) tries/;

    function lavalinkRejectionHandler(reason, promise) {
        if (reason && reason.message && typeof reason.message === 'string' && poruLavalinkPattern.test(reason.message)) {
            logger.warn(`‼️ Lavalink node connection warning: ${reason.message}`);
        } else {
            for (const prev of prevListener) {
                try {
                    prev(reason, promise);
                } catch (err) {}
            }
        }
    }

    if (!lavalinkRejectionHandler._hooked) {
        process.on('unhandledRejection', lavalinkRejectionHandler);
        lavalinkRejectionHandler._hooked = true;
    }

    client.poru = new Poru(client, nodes, PoruOptions);

    client.poru.on('playerCreate', (player) => {
        player.autoplay = false;
        player.nowPlayingMessage = null;
        player.updateInterval = null;
        player._sendingNowPlaying = false;
        player._autoplayReference = null;
        player.playedTrackIdentifiers = new Set();
        player.buttonCollector = null;
        player._247 = false;
        player._latestSuggestionRow = null;
    });

    client.poru.on('nodeConnect', (node) => logger.info(`🎚️  Node "${node.name}" connected.`));

    client.poru.on('nodeError', (node, error) => {
        const poruLavalinkPatternNode = /\[Poru Websocket\] Unable to connect with (.+?) node after (\d+) tries/;
        if (error && error.message && poruLavalinkPatternNode.test(error.message)) {
            logger.warn(`‼️ Lavalink node connection warning: ${error.message}`);
        } else {
            logger.info(`❌ Node "${node.name}" error: ${error.message}`);
        }
    });

    /**
     * ▶️ Handles when a new track starts playing.
     */
    client.poru.on('trackStart', async (player, track) => {
        try {
            const voiceChannel = client.channels.cache.get(player.voiceChannel);

            if (voiceChannel && !player._247) {
                const realUsers = voiceChannel.members.filter((m) => !m.user.bot);
                if (realUsers.size === 0) {
                    if (player && !player.destroyed) {
                        player.destroy();
                    }
                    return;
                }
            }
        } catch (err) {
            logger.error('❌ Error checking voice channel members (on trackStart):', err);
        }

        if (!guildStates.has(player.guildId)) {
            guildStates.set(player.guildId, {
                previousTracks: [],
                lastPlayedTrack: null,
            });
        }

        const channel = client.channels.cache.get(player.textChannel);
        if (!channel) return;

        const voiceChannel = client.channels.cache.get(player.voiceChannel);

        const songTitle = track.info && track.info.title ? track.info.title : 'Unknown';

        try {
            await setVoiceChannelStatus(voiceChannel, `🎵 ${songTitle}`);
        } catch (e) {
            logger.error('❌ Failed to set voice channel status', e);
        }

        if (player.nowPlayingMessage && player.nowPlayingMessage.deletable) {
            try {
                await player.nowPlayingMessage.delete().catch(() => {});
            } catch (e) {}
            player.nowPlayingMessage = null;
        }
        if (player.updateInterval) clearInterval(player.updateInterval);

        if (player.buttonCollector) {
            try {
                player.buttonCollector.stop('newTrack');
            } catch (e) {}
            player.buttonCollector = null;
        }

        let recommendations = [];
        try {
            const searchUrl = `https://www.youtube.com/watch?v=${track.info.identifier}&list=RD${track.info.identifier}`;
            const res = await client.poru.resolve({ query: searchUrl, source: 'ytsearch', requester: track.info.requester });

            if (res.loadType === 'playlist' && res.tracks.length) {
                recommendations = res.tracks
                    .filter((t) => t.info.identifier !== track.info.identifier)
                    .slice(0, kythia.addons.music.suggestionLimit);
            }
        } catch (e) {
            logger.error('Failed to fetch recommendations for dropdown:', e);
        }

        player.playedTrackIdentifiers.add(track.info.identifier);

        const nowPlayingText = await t(channel, 'music.helpers.musicManager.manager.playing', {
            title: track.info.title,
            url: track.info.uri,
        });
        const progress = createProgressBar(player);

        const artistText = await t(channel, 'music.helpers.musicManager.manager.channel', { author: track.info.author });

        const requestedByText = await t(channel, 'music.helpers.musicManager.manager.requested.by', {
            user: track.info.requester?.username ? `${track.info.requester} (${track.info.requester.username})` : `${track.info.requester}`,
        });

        let suggestionRow = null;
        if (recommendations.length > 0) {
            const suggestionOptions = [];
            for (const song of recommendations) {
                suggestionOptions.push({
                    label: song.info.title.substring(0, 95),
                    description: await t(channel, 'music.helpers.musicManager.manager.by', { author: song.info.author.substring(0, 90) }),
                    value: song.info.uri,
                });
            }
            const suggestionMenu = new StringSelectMenuBuilder()
                .setCustomId('music_suggest')
                .setPlaceholder(await t(channel, 'music.helpers.musicManager.manager.placeholder'))
                .addOptions(suggestionOptions)
                .setDisabled(false);
            suggestionRow = new ActionRowBuilder().addComponents(suggestionMenu);
        }
        player._latestSuggestionRow = suggestionRow || null;

        const firstControlButtonRow = getFirstControlButtonRow(false, false);
        const secondControlButtonRow = getSecondControlButtonRow(false);

        const container = new ContainerBuilder().setAccentColor(convertColor(kythia.bot.color, { from: 'hex', to: 'decimal' }));

        if (kythia.addons.music.artworkUrlStyle === 'banner') {
            if (track.info.artworkUrl || track.info.image) {
                container.addMediaGalleryComponents(
                    new MediaGalleryBuilder().addItems([new MediaGalleryItemBuilder().setURL(track.info.artworkUrl || track.info.image)])
                );
            }
            container.addTextDisplayComponents(new TextDisplayBuilder().setContent(nowPlayingText));
        } else {
            container.addSectionComponents(
                new SectionBuilder()
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(nowPlayingText))
                    .setThumbnailAccessory(
                        track.info.artworkUrl || track.info.image
                            ? new ThumbnailBuilder().setDescription(track.info.title).setURL(track.info.artworkUrl || track.info.image)
                            : null
                    )
            );
        }
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(progress));
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(artistText));
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(requestedByText));
        container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));
        if (suggestionRow) {
            container.addActionRowComponents(suggestionRow);
            container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));
        }
        container.addActionRowComponents(firstControlButtonRow);
        container.addActionRowComponents(secondControlButtonRow);
        container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));
        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(await t(channel, 'common.container.footer', { username: client.user.username }))
        );

        const components = [container];

        if (player._sendingNowPlaying) return;
        player._sendingNowPlaying = true;

        try {
            const message = await channel.send({
                components: components,
                flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2,
            });
            player.nowPlayingMessage = message;

            const filter = (i) =>
                i.isButton() && i.message.id === message.id && i.guildId === player.guildId && i.customId.startsWith('music_');
            const collector = message.createMessageComponentCollector({
                componentType: ComponentType.Button,
                filter,
            });
            player.buttonCollector = collector;

            collector.on('collect', async (interaction) => {
                if (!interaction.member.voice.channelId || interaction.member.voice.channelId !== player.voiceChannel) {
                    return interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor('Red')
                                .setDescription(await t(interaction, 'music.helpers.musicManager.manager.required')),
                        ],
                    });
                }
                if (!hasControlPermission(interaction, player)) {
                    return interaction.reply({
                        content: await t(interaction, 'music.helpers.musicManager.music.permission.denied'),
                        ephemeral: true,
                    });
                }
                switch (interaction.customId) {
                    case 'music_pause_resume': {
                        await handlePauseResume(interaction, player);
                        break;
                    }
                    case 'music_skip': {
                        await handleSkip(interaction, player);
                        break;
                    }
                    case 'music_stop': {
                        await handleStop(interaction, player);
                        break;
                    }
                    case 'music_loop': {
                        await handleLoop(interaction, player);
                        break;
                    }
                    case 'music_autoplay': {
                        await handleAutoplay(interaction, player);
                        break;
                    }
                    case 'music_lyrics': {
                        await handleLyrics(interaction, player);
                        break;
                    }
                    case 'music_queue': {
                        await handleQueue(interaction, player);
                        break;
                    }
                    case 'music_shuffle': {
                        await handleShuffle(interaction, player);
                        break;
                    }
                    case 'music_filter': {
                        await handleFilter(interaction, player);
                        break;
                    }
                    case 'music_favorite_add': {
                        await handleFavorite(interaction, player);
                        break;
                    }
                }
            });
        } finally {
            player._sendingNowPlaying = false;
        }

        player._autoplayReference = track;

        const state = guildStates.get(player.guildId);
        if (state) {
            state.lastPlayedTrack = track;
        }
    });

    /**
     * ⏭️ Handles when a track ends (either naturally or by skip/stop).
     */
    client.poru.on('trackEnd', async (player, track) => {
        const state = guildStates.get(player.guildId);
        if (state) {
            state.previousTracks.unshift(track);
            if (state.previousTracks.length > 10) state.previousTracks.pop();
        }

        if (player.updateInterval) clearInterval(player.updateInterval);

        if (player.buttonCollector) {
            try {
                player.buttonCollector.stop('trackEnd');
            } catch (e) {}
            player.buttonCollector = null;
        }

        if (player.trackRepeat) {
            player.queue.add(track);
        } else if (player.queueRepeat) {
            player.queue.add(track);
        }
    });

    /**
     * 🔄 Handles when the queue ends, including autoplay logic.
     * This event now FOCUSES on handling what happens after the queue is truly empty.
     *
     * Before continuing to the next track, check if there are any users besides the bot in the voice channel.
     * If no one else is present (except bot), stop (unless player.247 is enabled).
     */
    client.poru.on('queueEnd', async (player) => {
        const channel = client.channels.cache.get(player.textChannel);

        let shouldContinue = true;
        try {
            const voiceChannel = client.channels.cache.get(player.voiceChannel);
            if (voiceChannel) {
                const realUsers = voiceChannel.members.filter((m) => !m.user.bot);
                if (realUsers.size === 0) {
                    if (!player._247) {
                        shouldContinue = false;
                    }
                }
            }
        } catch (err) {
            logger.error('❌ Error checking voice channel members:', err);
        }

        if (!shouldContinue) {
            if (channel) {
                channel.send({
                    embeds: [
                        new EmbedBuilder()
                            .setColor('Orange')
                            .setDescription(await t(channel, 'music.helpers.musicManager.manager.no.listener')),
                    ],
                });
            }
            if (player && !player.destroyed) {
                player.destroy();
            }
            return;
        }

        if (player.buttonCollector) {
            try {
                player.buttonCollector.stop('queueEnd');
            } catch (e) {}
            player.buttonCollector = null;
        }

        const autoplayReference = player._autoplayReference;
        let autoplaySucceeded = false;
        if (player.autoplay && autoplayReference) {
            try {
                if (channel) {
                    await channel.send({
                        embeds: [
                            new EmbedBuilder().setColor(kythia.bot.color).setDescription(
                                await t(channel, 'music.helpers.musicManager.manager.searching', {
                                    title: autoplayReference.info.title,
                                })
                            ),
                        ],
                    });
                }

                const searchUrl = `https://www.youtube.com/watch?v=${autoplayReference.info.identifier}&list=RD${autoplayReference.info.identifier}`;
                const res = await client.poru.resolve({
                    query: searchUrl,
                    source: 'ytsearch',
                    requester: autoplayReference.info.requester,
                });

                if (res.loadType !== 'playlist' || !res.tracks.length) {
                    throw new Error(await t(channel, 'music.helpers.musicManager.manager.recommendation'));
                }

                const potentialNextTracks = res.tracks.filter((t) => !player.playedTrackIdentifiers.has(t.info.identifier));

                if (!potentialNextTracks.length) {
                    if (channel) {
                        await channel.send({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor('Orange')
                                    .setDescription(await t(channel, 'music.helpers.musicManager.manager.played')),
                            ],
                        });
                    }
                } else {
                    const topRecommendations = potentialNextTracks.slice(0, 5);
                    const nextTrack = topRecommendations[Math.floor(Math.random() * topRecommendations.length)];

                    player.queue.add(nextTrack);
                    await player.play();
                    autoplaySucceeded = true;
                    return;
                }
            } catch (err) {
                if (channel) {
                    await channel.send({
                        embeds: [
                            new EmbedBuilder()
                                .setColor('Red')
                                .setDescription(await t(channel, 'music.helpers.musicManager.manager.failed', { error: err.message })),
                        ],
                    });
                }
            }
        }

        if (player._247) {
            logger.info(`🎵 [24/7] Queue ended for ${player.guildId}, staying idle.`);
            if (player.updateInterval) clearInterval(player.updateInterval);

            const voiceChannel = client.channels.cache.get(player.voiceChannel);
            try {
                setVoiceChannelStatus(voiceChannel, 'idle');
            } catch (e) {
                /* ... */
            }

            let lastTrack = player.currentTrack || player._autoplayReference;
            await shutdownPlayerUI(player, lastTrack, client);
        } else {
            if (player && !player.destroyed) {
                player.destroy();
            }
        }
    });

    /**
     * 🛑 Handles when the player is destroyed (e.g., bot leaves voice channel).
     */

    client.poru.on('playerDestroy', async (player) => {
        if (player.updateInterval) clearInterval(player.updateInterval);
        if (player.buttonCollector) {
            try {
                player.buttonCollector.stop('playerDestroy');
            } catch (e) {}
            player.buttonCollector = null;
        }

        const voiceChannel = client.channels.cache.get(player.voiceChannel);
        try {
            setVoiceChannelStatus(voiceChannel, 'idle');
        } catch (e) {
            logger.error('❌ Failed to set voice channel status', e);
        }

        let lastTrack = player.currentTrack || (player.queue && player.queue.length > 0 ? player.queue[0] : player._autoplayReference);
        await shutdownPlayerUI(player, lastTrack, client);

        if (guildStates.has(player.guildId) && !player._247) {
            guildStates.delete(player.guildId);
        }
    });

    /**
     * 🖱️ Handles Discord interaction events for music controls and suggestions.
     * (Button logic is now handled by the collector above, only dropdown handled here)
     */
    client.on('interactionCreate', async (interaction) => {
        if (interaction.isStringSelectMenu() && interaction.customId === 'music_suggest') {
            await interaction.deferReply();
            const player = client.poru.players.get(interaction.guildId);

            if (!player) {
                return await interaction.editReply({
                    embeds: [
                        new EmbedBuilder().setColor('Red').setDescription(await t(interaction, 'music.helpers.musicManager.manager.ended')),
                    ],
                });
            }
            if (!interaction.member.voice.channel) {
                return await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor('Red')
                            .setDescription(await t(interaction, 'music.helpers.musicManager.manager.simple')),
                    ],
                });
            }
            if (interaction.member.voice.channel.id !== player.voiceChannel) {
                return await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor('Red')
                            .setDescription(await t(interaction, 'music.helpers.musicManager.manager.required')),
                    ],
                });
            }

            const selectedSongUri = interaction.values[0];

            try {
                const res = await client.poru.resolve({ query: selectedSongUri, source: 'ytsearch', requester: interaction.user });
                if (res.loadType === 'error' || !res.tracks.length) {
                    return await interaction.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor('Red')
                                .setDescription(await t(interaction, 'music.helpers.musicManager.manager.track')),
                        ],
                    });
                }

                player.queue.add(res.tracks[0]);

                await interaction.editReply({
                    embeds: [
                        new EmbedBuilder().setColor(kythia.bot.color).setDescription(
                            await t(interaction, 'music.helpers.musicManager.manager.queue', {
                                title: res.tracks[0].info.title,
                                url: res.tracks[0].info.uri,
                            })
                        ),
                    ],
                });
            } catch (e) {
                await interaction.editReply({
                    embeds: [
                        new EmbedBuilder().setColor('Red').setDescription(await t(interaction, 'music.helpers.musicManager.manager.track')),
                    ],
                });
            }
        }
    });

    client.once('clientReady', () => {
        client.poru.init(client);

        logger.info('🎵 Starting Global Music UI Ticker (every 3 seconds)');
        setInterval(() => {
            const players = client.poru.players.values();

            for (const player of players) {
                try {
                    if (!player || player.destroyed || !player.nowPlayingMessage?.editable || !player.currentTrack) {
                        continue;
                    }

                    const track = player.currentTrack;

                    if (track.info) {
                        if (!track.info.isStream && track.info.length > 0) {
                            if (player.position >= track.info.length - 5000) {
                                continue;
                            }
                        }
                    }

                    updateNowPlayingUI(player);
                } catch (e) {
                    logger.warn(`[Ticker] Gagal update UI buat player: ${player.guildId}`, e.message);
                }
            }
        }, 3000);
    });
}

module.exports = initializeMusicManager;
