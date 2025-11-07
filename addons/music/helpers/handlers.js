/**
 * @namespace: addons/music/helpers/handlers.js
 * @type: Helper Script
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.9.11-beta
 */

const { generateLyricsWithTranscript, formatDuration } = require('.');
const { embedFooter, checkIsPremium, isOwner } = require('@coreHelpers/discord');

const {
    EmbedBuilder,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags,
    ComponentType,
    AttachmentBuilder,
} = require('discord.js');
const PlaylistTrack = require('../database/models/PlaylistTrack');
const Playlist = require('../database/models/Playlist');
const Favorite = require('../database/models/Favorite');
const Music247 = require('../database/models/Music247');
const convertColor = require('kythia-core').utils.color;
const { t } = require('@coreHelpers/translator');
const { customFilter } = require('poru');
const logger = require('@coreHelpers/logger');
const cheerio = require('cheerio');
const play = require('play-dl');
const axios = require('axios');

/**
 * ▶️ Handles the 'play' subcommand.
 * Searches for a song/playlist and adds it to the queue, filtering out YouTube Shorts.
 * If the query is a Spotify playlist link, adds all tracks from that playlist to the queue.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
async function handlePlay(interaction) {
    const { client, member, guild, options, channel } = interaction;
    await interaction.deferReply();
    const query = options.getString('search');

    if (query.toLowerCase().includes('spotify') && (!kythia.addons.music.spotify.clientID || !kythia.addons.music.spotify.clientSecret)) {
        const embed = new EmbedBuilder().setColor('Red').setDescription(await t(interaction, 'music.helpers.handlers.music.configured'));
        return interaction.editReply({ embeds: [embed] });
    }

    let res;
    try {
        res = await client.poru.resolve({ query, requester: interaction.user });
    } catch (e) {
        logger.error('Poru resolve error:', e);
        const embed = new EmbedBuilder()
            .setColor('Red')
            .setDescription(await t(interaction, 'music.helpers.handlers.music.failed', { error: e?.message || 'Unknown error' }));
        return interaction.editReply({ embeds: [embed] });
    }

    const isSpotifyPlaylist = /^https?:\/\/open\.spotify\.com\/playlist\/[a-zA-Z0-9]+/i.test(query.trim());
    if (isSpotifyPlaylist) {
        if (!res || res.loadType !== 'PLAYLIST_LOADED' || !Array.isArray(res.tracks) || res.tracks.length === 0) {
            const embed = new EmbedBuilder().setColor('Red').setDescription(await t(interaction, 'music.helpers.handlers.music.results'));
            return interaction.editReply({ embeds: [embed] });
        }

        const player = client.poru.createConnection({
            guildId: guild.id,
            voiceChannel: member.voice.channel.id,
            textChannel: channel.id,
            deaf: true,
        });

        for (const track of res.tracks) {
            track.info.requester = interaction.user;
            player.queue.add(track);
        }

        if (!player.isPlaying && player.isConnected) player.play();

        const embed = new EmbedBuilder()
            .setColor(kythia.bot.color)
            .setThumbnail(res.playlistInfo?.image)
            .setFooter(await embedFooter(interaction))
            .setDescription(
                await t(interaction, 'music.helpers.handlers.music.playlist.desc.spotify', {
                    count: res.tracks.length,
                    name: res.playlistInfo?.name || 'Spotify Playlist',
                })
            );
        return interaction.editReply({ embeds: [embed] });
    }

    if (res.loadType === 'search') {
        const filteredTracks = res.tracks.filter((track) => !track.info.isStream && track.info.length > 70000);
        if (!filteredTracks.length) {
            const embed = new EmbedBuilder().setColor('Red').setDescription(await t(interaction, 'music.helpers.handlers.music.results'));
            return interaction.editReply({ embeds: [embed] });
        }
        res.tracks = filteredTracks;
    }

    if (res.loadType === 'error') {
        const embed = new EmbedBuilder()
            .setColor('Red')
            .setDescription(
                await t(interaction, 'music.helpers.handlers.music.failed', { error: res.exception?.message || 'Unknown error' })
            );
        return interaction.editReply({ embeds: [embed] });
    }
    if (res.loadType === 'empty') {
        const embed = new EmbedBuilder().setColor('Red').setDescription(await t(interaction, 'music.helpers.handlers.music.results'));
        return interaction.editReply({ embeds: [embed] });
    }

    const player = client.poru.createConnection({
        guildId: guild.id,
        voiceChannel: member.voice.channel.id,
        textChannel: channel.id,
        deaf: true,
    });

    if (res.loadType === 'playlist' || res.loadType === 'PLAYLIST_LOADED') {
        for (const track of res.tracks) {
            track.info.requester = interaction.user;
            player.queue.add(track);
        }
    } else {
        const track = res.tracks[0];
        track.info.requester = interaction.user;
        player.queue.add(track);
    }

    if (!player.isPlaying && player.isConnected) player.play();

    const embed = new EmbedBuilder().setColor(kythia.bot.color);
    if (res.loadType === 'playlist' || res.loadType === 'PLAYLIST_LOADED') {
        embed.setDescription(
            await t(interaction, 'music.helpers.handlers.music.playlist.desc.text', {
                count: res.tracks.length,
                name: res.playlistInfo?.name || 'Playlist',
            })
        );
    } else {
        const track = res.tracks[0];
        embed.setDescription(
            await t(interaction, 'music.helpers.handlers.music.added.to.queue', { title: track.info.title, url: track.info.uri })
        );
    }
    return interaction.editReply({ embeds: [embed] });
}

/**
 * ⏸️ Handles the 'pause' subcommand.
 * Pauses the currently playing track.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {object} player - The music player instance.
 */
async function handlePause(interaction, player) {
    if (player.isPaused) {
        const embed = new EmbedBuilder()
            .setColor(kythia.bot.color)
            .setDescription(await t(interaction, 'music.helpers.handlers.music.paused'));
        return interaction.reply({ embeds: [embed] });
    }
    player.pause(true);
    const embed = new EmbedBuilder().setColor(kythia.bot.color).setDescription(await t(interaction, 'music.helpers.handlers.music.paused'));
    return interaction.reply({ embeds: [embed] });
}

/**
 * ▶️ Handles the 'resume' subcommand.
 * Resumes playback if paused.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {object} player - The music player instance.
 */
async function handleResume(interaction, player) {
    if (!player.isPaused) {
        const embed = new EmbedBuilder()
            .setColor(kythia.bot.color)
            .setDescription(await t(interaction, 'music.helpers.handlers.music.playing.desc'));
        return interaction.reply({ embeds: [embed] });
    }
    player.pause(false);
    const embed = new EmbedBuilder().setColor(kythia.bot.color).setDescription(await t(interaction, 'music.helpers.handlers.music.resume'));
    return interaction.reply({ embeds: [embed] });
}

async function handlePauseResume(interaction, player) {
    player.pause(!player.isPaused);

    const state = player.isPaused
        ? await t(interaction, 'music.helpers.handlers.manager.paused')
        : await t(interaction, 'music.helpers.handlers.manager.resumed');
    await interaction.reply({
        embeds: [
            new EmbedBuilder()
                .setColor(kythia.bot.color)
                .setDescription(await t(interaction, 'music.helpers.handlers.manager.reply', { state })),
        ],
    });
}

/**
 * ⏭️ Handles the 'skip' subcommand.
 * Skips the current track.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {object} player - The music player instance.
 */
async function handleSkip(interaction, player) {
    if (!player.currentTrack) {
        const embed = new EmbedBuilder().setColor('Red').setDescription(await t(interaction, 'music.helpers.handlers.music.skip'));
        return interaction.reply({ embeds: [embed] });
    }
    player.skip();
    const embed = new EmbedBuilder()
        .setColor(kythia.bot.color)
        .setDescription(await t(interaction, 'music.helpers.handlers.music.skipped'));
    return interaction.reply({ embeds: [embed] });
}

/**
 * ⏹️ Handles the 'stop' subcommand.
 * Stops playback and clears the queue.
 * This will trigger the 'queueEnd' event, which will then
 * handle disconnecting or staying based on 24/7 mode.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {object} player - The music player instance.
 */
async function handleStop(interaction, player) {
    player.autoplay = false;
    player.manualStop = true;
    player.trackRepeat = false;
    player.queueRepeat = false;

    player.queue.clear();
    player.skip();

    const embed = new EmbedBuilder().setColor('Red').setDescription(await t(interaction, 'music.helpers.handlers.music.stopped'));
    return interaction.reply({ embeds: [embed] });
}

/**
 * [HELPER] Membuat embed dan tombol navigasi untuk halaman antrian.
 * @param {object} player - The music player instance.
 * @param {number} page - Halaman yang ingin ditampilkan.
 * @returns {import('discord.js').InteractionReplyOptions}
 */
async function _createQueueEmbed(player, page = 1, interaction) {
    const itemsPerPage = 10;
    const totalPages = Math.ceil(player.queue.length / itemsPerPage) || 1;
    page = Math.max(1, Math.min(page, totalPages));

    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const currentQueue = player.queue.slice(start, end);
    const duration = player.queue.reduce((total, track) => total + track.info.length, 0);
    const queueList = currentQueue
        .map(
            (track, index) =>
                `**${start + index + 1}.** [${track.info.title.length > 55 ? track.info.title.slice(0, 52) + '…' : track.info.title}](${
                    track.info.uri
                }) \`${formatDuration(track.info.length)}\``
        )
        .join('\n');

    const nowPlaying = player.currentTrack;

    const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`queue_prev_${page}`)
            .setEmoji('◀️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page === 1),
        new ButtonBuilder()
            .setCustomId(`queue_next_${page}`)
            .setEmoji('▶️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page === totalPages)
    );

    const container = new ContainerBuilder()
        .setAccentColor(convertColor(kythia.bot.color, { from: 'hex', to: 'decimal' }))
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                await t(interaction, 'music.helpers.handlers.queue.nowplaying', {
                    nowTitle: nowPlaying.info.title,
                    nowUrl: nowPlaying.info.uri,
                    nowDuration: formatDuration(nowPlaying.info.length),
                })
            )
        )
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(queueList || (await t(interaction, 'music.helpers.handlers.music.more')))
        )
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addActionRowComponents(buttons)
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                await t(interaction, 'music.helpers.handlers.queue.footer', {
                    page: page,
                    totalPages: totalPages,
                    totalTracks: player.queue.length,
                })
            )
        );

    return {
        components: [container],
        flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2,
        fetchReply: true,
    };
}

/**
 * 📜 Handles the 'queue' subcommand and its button interactions.
 */
async function handleQueue(interaction, player) {
    const nowPlaying = player.currentTrack;

    if (!nowPlaying) {
        const embed = new EmbedBuilder()
            .setColor(kythia.bot.color)
            .setFooter(await embedFooter(interaction))
            .setDescription(await t(interaction, 'music.helpers.handlers.music.empty'));
        return interaction.reply({ embeds: [embed] });
    }

    let initialPage;
    if (interaction.isChatInputCommand()) {
        initialPage = interaction.options.getInteger('page') || 1;
    } else {
        initialPage = 1;
    }
    const queueMessageOptions = await _createQueueEmbed(player, initialPage, interaction);

    const message = await interaction.reply(queueMessageOptions);

    const collector = message.createMessageComponentCollector({
        filter: (i) => i.user.id === interaction.user.id,
        time: 5 * 60 * 1000,
    });

    collector.on('collect', async (buttonInteraction) => {
        const [action, currentPageStr] = buttonInteraction.customId.split('_').slice(1);
        let currentPage = parseInt(currentPageStr, 10);

        if (action === 'next') {
            currentPage++;
        } else if (action === 'prev') {
            currentPage--;
        }

        const updatedMessageOptions = await _createQueueEmbed(player, currentPage, interaction);

        await buttonInteraction.update(updatedMessageOptions);
    });

    collector.on('end', async () => {
        if (message.editable) {
            const finalState = await _createQueueEmbed(player, 1, interaction);
            finalState.components = [];
            await message.edit(finalState).catch(() => {});
        }
    });
}
/**
 * ℹ️ Handles the 'nowplaying' subcommand.
 * Triggers a resend of the now playing panel.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {object} player - The music player instance.
 */
async function handleNowPlaying(interaction, player) {
    if (!player.currentTrack) {
        const embed = new EmbedBuilder()
            .setColor('Red')
            .setDescription(await t(interaction, 'music.helpers.handlers.music.nowplaying.error'))
            .setFooter(await embedFooter(interaction));
        return interaction.reply({ embeds: [embed] });
    }

    const track = player.currentTrack;
    const embed = new EmbedBuilder()
        .setColor(kythia.bot.color)
        .setURL(track.info.uri)
        .setThumbnail(track.info.thumbnail)
        .setDescription(
            await t(interaction, 'music.helpers.handlers.music.nowplaying.text', {
                duration: formatDuration(track.info.length),
                author: track.info.author,
            })
        )
        .setFooter(await embedFooter(interaction));
    return interaction.reply({ embeds: [embed] });
}

/**
 * 🔁 Handles the 'loop' subcommand.
 * Sets repeat mode for track or queue.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {object} player - The music player instance.
 */
async function handleLoop(interaction, player) {
    let nextMode;

    if (interaction.isChatInputCommand()) {
        nextMode = interaction.options.getString('mode');
    } else {
        if (!player.trackRepeat && !player.queueRepeat) {
            nextMode = 'track';
        } else if (player.trackRepeat) {
            nextMode = 'queue';
        } else {
            nextMode = 'off';
        }
    }

    let embed;
    let descriptionText = '';

    switch (nextMode) {
        case 'track':
            player.trackRepeat = true;
            player.queueRepeat = false;
            descriptionText = await t(interaction, 'music.helpers.handlers.music.track');
            break;
        case 'queue':
            player.trackRepeat = false;
            player.queueRepeat = true;
            descriptionText = await t(interaction, 'music.helpers.handlers.music.queue');
            break;
        default:
            player.trackRepeat = false;
            player.queueRepeat = false;
            descriptionText = await t(interaction, 'music.helpers.handlers.music.off');
            break;
    }

    embed = new EmbedBuilder()
        .setColor(nextMode === 'off' ? 'Red' : kythia.bot.color)
        .setDescription(descriptionText)
        .setFooter(await embedFooter(interaction));

    return interaction.reply({ embeds: [embed] });
}

/**
 * 🔄 Handles the 'autoplay' subcommand.
 * Toggles autoplay and disables all loop modes if enabled.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {object} player - The music player instance.
 */
async function handleAutoplay(interaction, player) {
    let nextState;

    if (interaction.isChatInputCommand()) {
        const status = interaction.options.getString('status');
        nextState = status === 'enable';
    } else {
        nextState = !player.autoplay;
    }

    player.autoplay = nextState;

    if (player.autoplay) {
        player.trackRepeat = false;
        player.queueRepeat = false;
    }

    const statusMessage = player.autoplay
        ? await t(interaction, 'music.helpers.handlers.music.autoplay.enabled.message')
        : await t(interaction, 'music.helpers.handlers.music.autoplay.disabled.message');

    const embed = new EmbedBuilder()
        .setColor(player.autoplay ? kythia.bot.color : 'Red')
        .setDescription(await t(interaction, 'music.helpers.handlers.music.autoplay.status.desc', { status: statusMessage }));

    return interaction.reply({ embeds: [embed] });
}

/**
 * 🔊 Handles the 'volume' subcommand.
 * Sets the playback volume.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {object} player - The music player instance.
 */
async function handleVolume(interaction, player) {
    const level = interaction.options.getInteger('level');
    player.setVolume(level);
    const embed = new EmbedBuilder()
        .setColor(kythia.bot.color)
        .setDescription(await t(interaction, 'music.helpers.handlers.music.set', { level }))
        .setFooter(await embedFooter(interaction));
    return interaction.reply({ embeds: [embed] });
}

/**
 * 🔀 Handles the 'shuffle' subcommand.
 * Shuffles the current queue.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {object} player - The music player instance.
 */
async function handleShuffle(interaction, player) {
    await interaction.deferReply();
    if (player.queue.length < 2) {
        const embed = new EmbedBuilder()
            .setColor('Red')
            .setDescription(await t(interaction, 'music.helpers.handlers.music.enough'))
            .setFooter(await embedFooter(interaction));
        return interaction.editReply({ embeds: [embed] });
    }

    player.queue.shuffle();

    const embed = new EmbedBuilder()
        .setColor(kythia.bot.color)
        .setDescription(await t(interaction, 'music.helpers.handlers.music.shuffled'))
        .setFooter(await embedFooter(interaction));
    return interaction.editReply({ embeds: [embed] });
}
/**
 * ⏮️ Handles the 'back' subcommand.
 * Plays the previous track from history.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {object} player - The music player instance.
 */
async function handleBack(interaction, player, guildStates) {
    await interaction.deferReply();

    const guildState = guildStates.get(interaction.guild.id);

    if (!guildState || !guildState.previousTracks || guildState.previousTracks.length === 0) {
        const embed = new EmbedBuilder()
            .setColor('Red')

            .setDescription(await t(interaction, 'music.helpers.handlers.music.no.previous.track'))
            .setFooter(await embedFooter(interaction));
        return interaction.editReply({ embeds: [embed] });
    }

    const previousTrack = guildState.previousTracks.shift();

    if (player.currentTrack) {
        player.queue.unshift(player.currentTrack);
    }

    player.queue.unshift(previousTrack);

    player.skip();

    const embed = new EmbedBuilder()
        .setColor(kythia.bot.color)

        .setDescription(await t(interaction, 'music.helpers.handlers.music.playing.previous', { title: previousTrack.info.title }))
        .setFooter(await embedFooter(interaction));
    return interaction.editReply({ embeds: [embed] });
}

/**
 * 🎧 Handles the 'filter' subcommand.
 * Menampilkan UI filter dengan tombol-tombol filter (11 filter, 5-5-1), menggunakan ContainerBuilder dan collector yang tidak mati.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {object} player - The music player instance.
 */
async function handleFilter(interaction, player) {
    if (!(player.filters instanceof customFilter)) {
        player.filters = new customFilter(player);
    }

    const filterList = [
        { id: 'nightcore', label: 'Nightcore', emoji: '🎶' },
        { id: 'vaporwave', label: 'Vaporwave', emoji: '🌫️' },
        { id: 'bassboost', label: 'Bassboost', emoji: '🔊' },
        { id: 'eightD', label: '8D', emoji: '🌀' },
        { id: 'karaoke', label: 'Karaoke', emoji: '🎤' },
        { id: 'vibrato', label: 'Vibrato', emoji: '🎸' },
        { id: 'tremolo', label: 'Tremolo', emoji: '🎚️' },
        { id: 'slowed', label: 'Slowed', emoji: '🐢' },
        { id: 'distortion', label: 'Distortion', emoji: '🤘' },
        { id: 'pop', label: 'Pop', emoji: '🎧' },
        { id: 'soft', label: 'Soft', emoji: '🛌' },
    ];

    const resetButton = new ButtonBuilder()
        .setCustomId('filter_reset')
        .setLabel('Reset')

        .setStyle(ButtonStyle.Danger);

    const rows = [new ActionRowBuilder(), new ActionRowBuilder(), new ActionRowBuilder()];

    for (let i = 0; i < filterList.length; i++) {
        const filter = filterList[i];
        const btn = new ButtonBuilder()
            .setCustomId(`filter_${filter.id}`)
            .setLabel(filter.label)

            .setStyle(ButtonStyle.Secondary);
        if (i < 5) rows[0].addComponents(btn);
        else if (i < 10) rows[1].addComponents(btn);
        else rows[2].addComponents(btn);
    }

    rows[2].addComponents(resetButton);

    const container = new ContainerBuilder()
        .setAccentColor(convertColor(kythia.bot.color, { from: 'hex', to: 'decimal' }))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(await t(interaction, 'music.helpers.handlers.filter.title')))
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addActionRowComponents(rows[0])
        .addActionRowComponents(rows[1])
        .addActionRowComponents(rows[2])
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                await t(interaction, 'common.container.footer', { username: interaction.client.user.username })
            )
        );

    let filterMsg;
    if (interaction.replied || interaction.deferred) {
        filterMsg = await interaction.editReply({
            components: [container],
            fetchReply: true,
            flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2,
        });
    } else {
        filterMsg = await interaction.reply({
            components: [container],
            fetchReply: true,
            flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2,
        });
    }

    if (player.filterCollector) player.filterCollector.stop();
    const collector = filterMsg.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 0,
    });
    player.filterCollector = collector;

    collector.on('collect', async (btnInt) => {
        if (btnInt.user.id !== interaction.user.id) {
            return btnInt.reply({ content: await t(btnInt, 'music.helpers.musicManager.music.permission.denied'), ephemeral: true });
        }

        if (!(player.filters instanceof customFilter)) {
            player.filters = new customFilter(player);
        }

        if (btnInt.customId === 'filter_reset') {
            player.filters.clearFilters(true);
            await player.filters.updateFilters();
            await btnInt.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(kythia.bot.color)
                        .setDescription(await t(btnInt, 'music.helpers.handlers.music.filter.reset'))
                        .setFooter(await embedFooter(btnInt)),
                ],
            });
            return;
        }

        const filterId = btnInt.customId.replace('filter_', '');
        let applied = false;
        switch (filterId) {
            case 'nightcore':
                player.filters.setNightcore(true);
                applied = true;
                break;
            case 'vaporwave':
                player.filters.setVaporwave(true);
                applied = true;
                break;
            case 'bassboost':
                player.filters.setBassboost(true);
                applied = true;
                break;
            case 'eightD':
                player.filters.set8D(true);
                applied = true;
                break;
            case 'karaoke':
                player.filters.setKaraoke(true);
                applied = true;
                break;
            case 'vibrato':
                player.filters.setVibrato(true);
                applied = true;
                break;
            case 'tremolo':
                player.filters.setTremolo(true);
                applied = true;
                break;
            case 'slowed':
                player.filters.setSlowmode(true);
                applied = true;
                break;
            case 'distortion':
                player.filters.setDistortion(true);
                applied = true;
                break;
            case 'pop':
                player.filters.setEqualizer([
                    { band: 1, gain: 0.35 },
                    { band: 2, gain: 0.25 },
                    { band: 3, gain: 0.0 },
                    { band: 4, gain: -0.25 },
                    { band: 5, gain: -0.3 },
                    { band: 6, gain: -0.2 },
                    { band: 7, gain: -0.1 },
                    { band: 8, gain: 0.15 },
                    { band: 9, gain: 0.25 },
                ]);
                applied = true;
                break;
            case 'soft':
                player.filters.setEqualizer([
                    { band: 0, gain: 0 },
                    { band: 1, gain: 0 },
                    { band: 2, gain: 0 },
                    { band: 3, gain: 0 },
                    { band: 4, gain: 0 },
                    { band: 5, gain: 0 },
                    { band: 6, gain: 0 },
                    { band: 7, gain: 0 },
                    { band: 8, gain: -0.25 },
                    { band: 9, gain: -0.25 },
                    { band: 10, gain: -0.25 },
                    { band: 11, gain: -0.25 },
                    { band: 12, gain: -0.25 },
                    { band: 13, gain: -0.25 },
                ]);
                applied = true;
                break;
            default:
                break;
        }

        if (applied) {
            await player.filters.updateFilters();
            await btnInt.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(kythia.bot.color)
                        .setDescription(await t(btnInt, 'music.helpers.handlers.music.filter.applied', { preset: filterId }))
                        .setFooter(await embedFooter(btnInt)),
                ],
            });
        } else {
            await btnInt.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('Orange')
                        .setDescription(await t(btnInt, 'music.helpers.handlers.music.filter.not.available', { preset: filterId }))
                        .setFooter(await embedFooter(btnInt)),
                ],
            });
        }
    });

    player.on('destroy', () => {
        if (player.filterCollector) player.filterCollector.stop();
        player.filterCollector = null;
    });
}

/**
 * 🗑️ Handles the 'remove' subcommand.
 * Removes a song from the queue at the given position.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {object} player - The music player instance.
 */
async function handleRemove(interaction, player) {
    const position = interaction.options.getInteger('position');
    if (!Number.isInteger(position) || position < 1 || position > player.queue.length) {
        const embed = new EmbedBuilder()
            .setColor('Red')
            .setDescription(await t(interaction, 'music.helpers.handlers.music.position', { size: player.queue.length }))
            .setFooter(await embedFooter(interaction));
        return interaction.reply({ embeds: [embed] });
    }
    const removed = player.queue.splice(position - 1, 1);
    if (!removed || removed.length === 0) {
        const embed = new EmbedBuilder()
            .setColor('Red')
            .setDescription(await t(interaction, 'music.helpers.handlers.music.failed'))
            .setFooter(await embedFooter(interaction));
        return interaction.reply({ embeds: [embed] });
    }
    const track = removed[0];
    const embed = new EmbedBuilder()
        .setColor(kythia.bot.color)
        .setDescription(
            await t(interaction, 'music.helpers.handlers.music.removed', { title: track.info.title, url: track.info.uri, position })
        )
        .setFooter(await embedFooter(interaction));
    return interaction.reply({ embeds: [embed] });
}

/**
 * 🔀 Handles the 'move' subcommand.
 * Moves a song from one position to another in the queue.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {object} player - The music player instance.
 */
async function handleMove(interaction, player) {
    const from = interaction.options.getInteger('from');
    const to = interaction.options.getInteger('to');
    const queueSize = player.queue.length;

    if (!Number.isInteger(from) || !Number.isInteger(to) || from < 1 || from > queueSize || to < 1 || to > queueSize) {
        const embed = new EmbedBuilder()
            .setColor('Red')
            .setDescription(await t(interaction, 'music.helpers.handlers.music.positions', { size: queueSize }))
            .setFooter(await embedFooter(interaction));
        return interaction.reply({ embeds: [embed] });
    }
    if (from === to) {
        const embed = new EmbedBuilder()
            .setColor('Red')
            .setDescription(await t(interaction, 'music.helpers.handlers.music.position'))
            .setFooter(await embedFooter(interaction));
        return interaction.reply({ embeds: [embed] });
    }

    const trackArr = player.queue.splice(from - 1, 1);
    const track = trackArr[0];
    if (!track) {
        const embed = new EmbedBuilder()
            .setColor('Red')
            .setDescription(await t(interaction, 'music.helpers.handlers.music.found'))
            .setFooter(await embedFooter(interaction));
        return interaction.reply({ embeds: [embed] });
    }
    player.queue.splice(to - 1, 0, track);

    const embed = new EmbedBuilder()
        .setColor(kythia.bot.color)
        .setDescription(
            await t(interaction, 'music.helpers.handlers.music.moved', { title: track.info.title, url: track.info.uri, from, to })
        )
        .setFooter(await embedFooter(interaction));
    return interaction.reply({ embeds: [embed] });
}

async function handleClear(interaction, player) {
    player.queue.clear();
    const embed = new EmbedBuilder()
        .setColor(kythia.bot.color)
        .setDescription(await t(interaction, 'music.helpers.handlers.music.clear'))
        .setFooter(await embedFooter(interaction));
    return interaction.reply({ embeds: [embed] });
}

async function handleSeek(interaction, player) {
    const time = interaction.options.getInteger('time');
    player.seekTo(time * 1000);
    const embed = new EmbedBuilder()
        .setColor(kythia.bot.color)
        .setDescription(await t(interaction, 'music.helpers.handlers.music.seeked', { time: time }))
        .setFooter(await embedFooter(interaction));
    return interaction.reply({ embeds: [embed] });
}

async function handleLyrics(interaction, player) {
    await interaction.deferReply();

    const track = player.currentTrack;
    if (!track) {
        const embed = new EmbedBuilder()
            .setColor('Red')
            .setDescription(await t(interaction, 'music.helpers.handlers.music.lyrics.music.not.found'));
        return interaction.editReply({ embeds: [embed] });
    }

    let artist, titleForSearch, album, durationSec;
    const separators = ['-', '–', '|'];
    let potentialSplit = null;
    const originalTitle = track.info.title || '';

    for (const sep of separators) {
        if (originalTitle.includes(sep)) {
            potentialSplit = originalTitle.split(sep);
            break;
        }
    }

    if (potentialSplit && potentialSplit.length >= 2) {
        artist = potentialSplit[0].trim();
        titleForSearch = potentialSplit.slice(1).join(' ').trim();
    } else {
        artist = track.info.author || '';
        titleForSearch = originalTitle;
    }

    const cleanUpRegex = /official|lyric|video|audio|mv|hd|hq|ft|feat/gi;
    artist = artist.replace(cleanUpRegex, '').trim();
    titleForSearch = titleForSearch.replace(cleanUpRegex, '').trim();
    titleForSearch = titleForSearch.replace(/\(.*?\)|\[.*?\]/g, '').trim();

    album = track.info.album || '';
    if (album)
        album = album
            .replace(cleanUpRegex, '')
            .replace(/\(.*?\)|\[.*?\]/g, '')
            .trim();
    durationSec = Math.round((track.info.length || 0) / 1000);

    if (!album && track.info.sourceName && track.info.sourceName.toLowerCase().includes('spotify')) {
        album = track.info.album || '';
    }
    if (!album) album = '';

    let lyrics = null;
    let usedLrclib = false;
    let usedAI = false;
    let foundRecord = null;

    try {
        const params = new URLSearchParams();

        if (titleForSearch) {
            params.set('track_name', titleForSearch);
        } else if (originalTitle) {
            params.set('q', originalTitle);
        }

        if (artist) params.set('artist_name', artist);
        if (album) params.set('album_name', album);

        const headers = {
            'User-Agent': 'KythiaBot v0.9.8-beta (https://github.com/kenndeclouv/kythia)',
        };

        const lrclibUrl = `https://lrclib.net/api/search?${params.toString()}`;
        const response = await fetch(lrclibUrl, { headers });
        if (response.status === 200) {
            const list = await response.json();

            if (Array.isArray(list) && list.length > 0) {
                foundRecord =
                    list.find((record) => {
                        return (
                            record.trackName &&
                            record.artistName &&
                            record.trackName.toLowerCase().includes(titleForSearch.toLowerCase()) &&
                            record.artistName.toLowerCase().includes(artist.toLowerCase())
                        );
                    }) || list[0];

                if (foundRecord && (foundRecord.plainLyrics || foundRecord.syncedLyrics)) {
                    lyrics = foundRecord.plainLyrics || foundRecord.syncedLyrics;
                    usedLrclib = true;
                }
            }
        }
    } catch (e) {
        logger.error(`LRCLIB API request failed: ${e.stack}`);
    }

    if (!lyrics && kythia.addons.ai.geminiApiKeys && kythia.addons.music.useAI) {
        try {
            lyrics = await generateLyricsWithTranscript(artist, titleForSearch, track.info.uri);
            usedAI = !!lyrics;
        } catch (e) {
            logger.error(`Gemini AI lyrics generation failed: ${e.stack}`);
        }
    }

    if (!lyrics) {
        const embed = new EmbedBuilder()
            .setColor('Orange')
            .setDescription(await t(interaction, 'music.helpers.handlers.music.lyrics.lyrics.not.found'))
            .setFooter(await embedFooter(interaction));
        return interaction.editReply({ embeds: [embed] });
    }

    const trimmedLyrics = lyrics.length > 4096 ? lyrics.substring(0, 4093) + '...' : lyrics;

    let footer;
    if (usedLrclib) {
        footer = {
            text: ' • Source: lrclib.net',
            iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }),
        };
    } else if (usedAI) {
        footer = {
            text: ' • Generated by AI',
            iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }),
        };
    } else {
        footer = await embedFooter(interaction);
    }

    let embedArtist = artist,
        embedTitle = titleForSearch;
    if (foundRecord) {
        embedArtist = foundRecord.artistName || embedArtist;
        embedTitle = foundRecord.trackName || embedTitle;
    }

    const embed = new EmbedBuilder()
        .setColor(kythia?.bot?.color || 'Blue')
        .setTitle(`${embedArtist} - ${embedTitle}`)
        .setURL(track.info.uri)
        .setThumbnail(track.info.artworkUrl ?? track.info.image)
        .setDescription(trimmedLyrics)
        .setFooter(footer);

    return interaction.editReply({ embeds: [embed] });
}

async function handlePlaylist(interaction, player) {
    await interaction.deferReply();
    const s = interaction.options.getSubcommand();
    if (s === 'save') return _handlePlaylistSave(interaction, player);
    if (s === 'load') return _handlePlaylistLoad(interaction, player);
    if (s === 'list') return _handlePlaylistList(interaction);
    if (s === 'delete') return _handlePlaylistDelete(interaction);
    if (s === 'append') return _handlePlaylistAppend(interaction, player);
    if (s === 'rename') return _handlePlaylistRename(interaction);
    if (s === 'track-remove') return _handlePlaylistRemoveTrack(interaction);
    if (s === 'track-list') return _handlePlaylistTrackList(interaction);
    if (s === 'track-add') return _handlePlaylistTrackAdd(interaction);
    if (s === 'share') return _handlePlaylistShare(interaction);
    if (s === 'import') return _handlePlaylistImport(interaction);
}

async function _handlePlaylistSave(interaction, player) {
    const client = interaction.client;
    const playlistName = interaction.options.getString('name');
    const userId = interaction.user.id;

    const playlistCount = await Playlist.countWithCache({ where: { userId } });
    let isPremium = await checkIsPremium(userId);

    if (!isOwner(interaction.user.id) && playlistCount >= kythia.addons.music.playlistLimit && !isPremium) {
        const embed = new EmbedBuilder()
            .setColor('Red')
            .setFooter(await embedFooter(interaction))
            .setDescription(
                await t(interaction, 'music.helpers.handlers.music.playlist.save.limit.desc', { count: kythia.addons.music.playlistLimit })
            );
        return interaction.editReply({ embeds: [embed] });
    }

    if (!player || (!player.currentTrack && player.queue.length === 0)) {
        const embed = new EmbedBuilder()
            .setColor('Red')
            .setFooter(await embedFooter(interaction))
            .setDescription(await t(interaction, 'music.helpers.handlers.music.playlist.save.empty.queue'));
        return interaction.editReply({ embeds: [embed] });
    }

    const existing = await Playlist.getCache({ userId: userId, name: playlistName });
    if (existing) {
        const embed = new EmbedBuilder()
            .setColor('Red')
            .setFooter(await embedFooter(interaction))
            .setDescription(await t(interaction, 'music.helpers.handlers.music.playlist.save.duplicate', { name: playlistName }));
        return interaction.editReply({ embeds: [embed] });
    }

    const playlist = await Playlist.create({ userId, name: playlistName });

    const tracksToSave = [];
    if (player.currentTrack) {
        tracksToSave.push({
            playlistId: playlist.id,
            title: player.currentTrack.info.title,
            identifier: player.currentTrack.info.identifier,
            author: player.currentTrack.info.author,
            length: player.currentTrack.info.length,
            uri: player.currentTrack.info.uri,
        });
    }
    for (const track of player.queue) {
        tracksToSave.push({
            playlistId: playlist.id,
            title: track.info.title,
            identifier: track.info.identifier,
            author: track.info.author,
            length: track.info.length,
            uri: track.info.uri,
        });
    }

    await PlaylistTrack.bulkCreate(tracksToSave);

    const embed = new EmbedBuilder()
        .setColor(kythia.bot.color)
        .setFooter(await embedFooter(interaction))
        .setDescription(
            await t(interaction, 'music.helpers.handlers.music.playlist.save.success', { name: playlistName, count: tracksToSave.length })
        );
    await interaction.editReply({ embeds: [embed] });
}

async function _handlePlaylistLoad(interaction, player) {
    const client = interaction.client;
    const playlistName = interaction.options.getString('name');
    const userId = interaction.user.id;

    const playlist = await Playlist.getCache({
        userId: userId,
        name: playlistName,
        include: [{ model: PlaylistTrack, as: 'tracks' }],
    });

    if (!playlist) {
        const embed = new EmbedBuilder()
            .setColor('Red')
            .setFooter(await embedFooter(interaction))
            .setDescription(await t(interaction, 'music.helpers.handlers.music.playlist.load.not.found', { name: playlistName }));
        return interaction.editReply({ embeds: [embed] });
    }

    if (!playlist.tracks || playlist.tracks.length === 0) {
        const embed = new EmbedBuilder()
            .setColor('Red')
            .setFooter(await embedFooter(interaction))
            .setDescription(await t(interaction, 'music.helpers.handlers.music.playlist.load.empty', { name: playlistName }));
        return interaction.editReply({ embeds: [embed] });
    }

    if (player) {
        player.queue.clear();
    }

    const newPlayer =
        player ||
        client.poru.createConnection({
            guildId: interaction.guild.id,
            voiceChannel: interaction.member.voice.channel.id,
            textChannel: interaction.channel.id,
            deaf: true,
        });

    let added = 0;
    for (const trackData of playlist.tracks) {
        const poruTrack = await client.poru.resolve({ query: trackData.uri, requester: interaction.user });
        if (poruTrack.tracks && poruTrack.tracks[0]) {
            newPlayer.queue.add(poruTrack.tracks[0]);
            added++;
        }
    }

    if (!newPlayer.isPlaying) newPlayer.play();

    const embed = new EmbedBuilder()
        .setColor(kythia.bot.color)
        .setFooter(await embedFooter(interaction))
        .setDescription(await t(interaction, 'music.helpers.handlers.music.playlist.load.success', { count: added, name: playlistName }));
    await interaction.editReply({ embeds: [embed] });
}

async function _handlePlaylistList(interaction) {
    const client = interaction.client;
    const userId = interaction.user.id;

    const playlists = await Playlist.getAllCache({
        where: { userId: userId },
        order: [['name', 'ASC']],
        cacheTags: [`Playlist:byUser:${userId}`],
    });

    if (!playlists || playlists.length === 0) {
        const embed = new EmbedBuilder()
            .setColor('Red')
            .setFooter(await embedFooter(interaction))
            .setDescription(await t(interaction, 'music.helpers.handlers.music.playlist.list.empty'));
        return interaction.editReply({ embeds: [embed] });
    }

    const itemsPerPage = 10;
    const totalPages = Math.ceil(playlists.length / itemsPerPage) || 1;

    async function createPlaylistListContainer(page = 1) {
        page = Math.max(1, Math.min(page, totalPages));
        const start = (page - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const currentPagePlaylists = playlists.slice(start, end);

        const list = currentPagePlaylists.map((p, idx) => `**${start + idx + 1}.** ${p.name}`).join('\n');

        const buttons = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`playlistlist_prev_${page}`)
                .setEmoji('◀️')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(page === 1),
            new ButtonBuilder()
                .setCustomId(`playlistlist_next_${page}`)
                .setEmoji('▶️')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(page === totalPages)
        );

        const container = new ContainerBuilder()
            .setAccentColor(convertColor(kythia.bot.color, { from: 'hex', to: 'decimal' }))
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`${await t(interaction, 'music.helpers.handlers.music.playlist.list.title')}`)
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(list || (await t(interaction, 'music.helpers.handlers.music.playlist.list.empty')))
            )
            .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
            .addActionRowComponents(buttons)
            .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    await t(interaction, 'music.helpers.handlers.queue.footer', {
                        page: page,
                        totalPages: totalPages,
                        totalTracks: playlists.length,
                    })
                )
            );

        return {
            components: [container],
            flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2,
            fetchReply: true,
        };
    }

    let initialPage = 1;
    if (interaction.isChatInputCommand()) {
        initialPage = interaction.options.getInteger('page') || 1;
    }

    const messageOptions = await createPlaylistListContainer(initialPage);
    const message = await interaction.editReply(messageOptions);

    const collector = message.createMessageComponentCollector({
        filter: (i) => i.user.id === interaction.user.id,
        time: 5 * 60 * 1000,
    });

    collector.on('collect', async (buttonInteraction) => {
        const [prefix, action, currentPageStr] = buttonInteraction.customId.split('_');
        let currentPage = parseInt(currentPageStr, 10);

        if (action === 'next') {
            currentPage++;
        } else if (action === 'prev') {
            currentPage--;
        }

        const updatedMessageOptions = await createPlaylistListContainer(currentPage);
        await buttonInteraction.update(updatedMessageOptions);
    });

    collector.on('end', async () => {
        if (message.editable) {
            const finalState = await createPlaylistListContainer(1);
            finalState.components = [];
            await message.edit(finalState).catch(() => {});
        }
    });
}

async function _handlePlaylistDelete(interaction) {
    const client = interaction.client;
    const playlistName = interaction.options.getString('name');
    const userId = interaction.user.id;

    const playlist = await Playlist.getCache({ userId: userId, name: playlistName });
    if (!playlist) {
        const embed = new EmbedBuilder()
            .setColor('Red')
            .setFooter(await embedFooter(interaction))
            .setDescription(await t(interaction, 'music.helpers.handlers.music.playlist.delete.not.found', { name: playlistName }));
        return interaction.editReply({ embeds: [embed] });
    }

    await PlaylistTrack.destroy({ where: { playlistId: playlist.id } });
    await playlist.destroy();

    const embed = new EmbedBuilder()
        .setColor(kythia.bot.color)
        .setFooter(await embedFooter(interaction))
        .setDescription(await t(interaction, 'music.helpers.handlers.music.playlist.delete.success', { name: playlistName }));
    await interaction.editReply({ embeds: [embed] });
}

async function _handlePlaylistAppend(interaction, player) {
    const { client, user } = interaction;
    const playlistName = interaction.options.getString('name');

    if (!player) {
        const embed = new EmbedBuilder()
            .setColor('Red')
            .setFooter(await embedFooter(interaction))
            .setDescription(await t(interaction, 'music.helpers.handlers.music.playlist.append.no.player'));
        return interaction.editReply({ embeds: [embed] });
    }

    const playlist = await Playlist.getCache({
        userId: user.id,
        name: playlistName,
        include: { model: PlaylistTrack, as: 'tracks' },
    });

    if (!playlist) {
        const embed = new EmbedBuilder()
            .setColor('Red')
            .setFooter(await embedFooter(interaction))
            .setDescription(await t(interaction, 'music.helpers.handlers.music.playlist.load.not.found', { name: playlistName }));
        return interaction.editReply({ embeds: [embed] });
    }

    if (!playlist.tracks || playlist.tracks.length === 0) {
        const embed = new EmbedBuilder()
            .setColor('Red')
            .setFooter(await embedFooter(interaction))
            .setDescription(await t(interaction, 'music.helpers.handlers.music.playlist.load.empty', { name: playlistName }));
        return interaction.editReply({ embeds: [embed] });
    }

    let addedCount = 0;

    for (const trackData of playlist.tracks) {
        const res = await client.poru.resolve({ query: trackData.uri, requester: user });
        if (res && res.tracks.length) {
            player.queue.add(res.tracks[0]);
            addedCount++;
        }
    }

    const embed = new EmbedBuilder()
        .setColor(kythia.bot.color)
        .setFooter(await embedFooter(interaction))
        .setDescription(
            await t(interaction, 'music.helpers.handlers.music.playlist.append.success.v2', { count: addedCount, name: playlistName })
        );
    await interaction.editReply({ embeds: [embed] });
}

async function _handlePlaylistRemoveTrack(interaction) {
    const client = interaction.client;
    const playlistName = interaction.options.getString('name');
    const position = interaction.options.getInteger('position');
    const userId = interaction.user.id;

    const playlist = await Playlist.getCache({
        userId: userId,
        name: playlistName,
        include: [{ model: PlaylistTrack, as: 'tracks', order: [['id', 'ASC']] }],
    });

    if (!playlist) {
        const embed = new EmbedBuilder()
            .setColor('Red')
            .setFooter(await embedFooter(interaction))
            .setDescription(await t(interaction, 'music.helpers.handlers.music.playlist.remove.track.not.found', { name: playlistName }));
        return interaction.editReply({ embeds: [embed] });
    }
    if (!playlist.tracks || playlist.tracks.length === 0) {
        const embed = new EmbedBuilder()
            .setColor('Red')
            .setFooter(await embedFooter(interaction))
            .setDescription(await t(interaction, 'music.helpers.handlers.music.playlist.remove.track.empty', { name: playlistName }));
        return interaction.editReply({ embeds: [embed] });
    }
    if (position < 1 || position > playlist.tracks.length) {
        const embed = new EmbedBuilder()
            .setColor('Red')
            .setFooter(await embedFooter(interaction))
            .setDescription(await t(interaction, 'music.helpers.handlers.music.playlist.remove.track.invalid.position'));
        return interaction.editReply({ embeds: [embed] });
    }

    const track = playlist.tracks[position - 1];
    await track.destroy();

    const embed = new EmbedBuilder()
        .setColor(kythia.bot.color)
        .setFooter(await embedFooter(interaction))
        .setDescription(
            await t(interaction, 'music.helpers.handlers.music.playlist.remove.track.success', { position, name: playlistName })
        );
    await interaction.editReply({ embeds: [embed] });
}

async function _handlePlaylistRename(interaction) {
    const client = interaction.client;
    const playlistName = interaction.options.getString('name');
    const newName = interaction.options.getString('new_name');
    const userId = interaction.user.id;

    const playlist = await Playlist.getCache({ userId: userId, name: playlistName });
    if (!playlist) {
        const embed = new EmbedBuilder()
            .setColor('Red')
            .setFooter(await embedFooter(interaction))
            .setDescription(await t(interaction, 'music.helpers.handlers.music.playlist.rename.not.found', { name: playlistName }));
        return interaction.editReply({ embeds: [embed] });
    }

    const existing = await Playlist.getCache({ userId: userId, name: newName });
    if (existing) {
        const embed = new EmbedBuilder()
            .setColor('Red')
            .setFooter(await embedFooter(interaction))
            .setDescription(await t(interaction, 'music.helpers.handlers.music.playlist.rename.duplicate', { name: newName }));
        return interaction.editReply({ embeds: [embed] });
    }

    playlist.name = newName;
    await playlist.saveAndUpdateCache();

    const embed = new EmbedBuilder()
        .setColor(kythia.bot.color)
        .setFooter(await embedFooter(interaction))
        .setDescription(await t(interaction, 'music.helpers.handlers.music.playlist.rename.success', { oldName: playlistName, newName }));
    await interaction.editReply({ embeds: [embed] });
}

async function _handlePlaylistTrackList(interaction) {
    const client = interaction.client;
    const playlistName = interaction.options.getString('name');
    const userId = interaction.user.id;

    const playlist = await Playlist.getCache({
        userId: userId,
        name: playlistName,
        include: [{ model: PlaylistTrack, as: 'tracks' }],
    });

    if (!playlist) {
        const embed = new EmbedBuilder()
            .setColor('Red')
            .setFooter(await embedFooter(interaction))
            .setDescription(await t(interaction, 'music.helpers.handlers.music.playlist.track.list.not.found', { name: playlistName }));
        return interaction.editReply({ embeds: [embed] });
    }

    if (!playlist.tracks || playlist.tracks.length === 0) {
        const embed = new EmbedBuilder()
            .setColor('Red')
            .setFooter(await embedFooter(interaction))
            .setDescription(await t(interaction, 'music.helpers.handlers.music.playlist.track.list.empty', { name: playlistName }));
        return interaction.editReply({ embeds: [embed] });
    }

    const itemsPerPage = 10;
    const totalPages = Math.ceil(playlist.tracks.length / itemsPerPage) || 1;

    async function createTrackListContainer(page = 1) {
        page = Math.max(1, Math.min(page, totalPages));
        const start = (page - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const currentTracks = playlist.tracks.slice(start, end);

        const trackList = currentTracks.map((t, i) => `**${start + i + 1}.** [${t.title}](${t.uri})`).join('\n');

        const buttons = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`playlisttracklist_prev_${page}`)
                .setEmoji('◀️')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(page === 1),
            new ButtonBuilder()
                .setCustomId(`playlisttracklist_next_${page}`)
                .setEmoji('▶️')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(page === totalPages)
        );

        const container = new ContainerBuilder()
            .setAccentColor(convertColor(kythia.bot.color, { from: 'hex', to: 'decimal' }))
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `${(await t(interaction, 'music.helpers.handlers.music.playlist.track.list.title', { name: playlistName })) || playlistName}`
                )
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(trackList || (await t(interaction, 'music.helpers.handlers.music.more')))
            )
            .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
            .addActionRowComponents(buttons)
            .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    await t(interaction, 'music.helpers.handlers.queue.footer', {
                        page: page,
                        totalPages: totalPages,
                        totalTracks: playlist.tracks.length,
                    })
                )
            );

        return {
            components: [container],
            flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2,
            fetchReply: true,
        };
    }

    let initialPage = 1;
    const messageOptions = await createTrackListContainer(initialPage);

    const message = await interaction.editReply(messageOptions);

    const collector = message.createMessageComponentCollector({
        filter: (i) => i.user.id === interaction.user.id,
        time: 5 * 60 * 1000,
    });

    collector.on('collect', async (buttonInteraction) => {
        const [action, currentPageStr] = buttonInteraction.customId.split('_').slice(1);
        let currentPage = parseInt(currentPageStr, 10);

        if (action === 'next') {
            currentPage++;
        } else if (action === 'prev') {
            currentPage--;
        }

        const updatedMessageOptions = await createTrackListContainer(currentPage);

        await buttonInteraction.update(updatedMessageOptions);
    });

    collector.on('end', async () => {
        if (message.editable) {
            const finalState = await createTrackListContainer(1);
            finalState.components = [];
            await message.edit(finalState).catch(() => {});
        }
    });
}

async function _handlePlaylistTrackAdd(interaction) {
    const { client, user } = interaction;
    const playlistName = interaction.options.getString('name');
    const query = interaction.options.getString('search');

    const playlist = await Playlist.getCache({ userId: user.id, name: playlistName });
    if (!playlist) {
        return interaction.editReply({
            content: await t(interaction, 'music.helpers.handlers.music.playlist.load.not.found', { name: playlistName }),
        });
    }

    const res = await client.poru.resolve({ query, requester: user });
    if (!res || !res.tracks || res.tracks.length === 0) {
        return interaction.editReply({ content: await t(interaction, 'music.helpers.handlers.music.play.no.results') });
    }

    const trackToAdd = res.tracks[0];

    const existingTrack = await PlaylistTrack.getCache({
        playlistId: playlist.id,

        identifier: trackToAdd.info.identifier,
    });

    if (existingTrack) {
        return interaction.editReply({
            content: await t(interaction, 'music.helpers.handlers.music.playlist.track.add.duplicate', {
                track: trackToAdd.info.title,
                name: playlistName,
            }),
        });
    }

    try {
        await _saveTracksToPlaylist(playlist, [trackToAdd]);

        await interaction.editReply({
            content: await t(interaction, 'music.helpers.handlers.music.playlist.track.add.success', {
                track: trackToAdd.info.title,
                name: playlistName,
            }),
        });
    } catch (e) {
        logger.error('Error adding track to playlist:', e);
        await interaction.editReply({ content: await t(interaction, 'music.helpers.handlers.music.playlist.track.add.error') });
    }
}

async function _handlePlaylistShare(interaction) {
    const playlistName = interaction.options.getString('name');
    const userId = interaction.user.id;

    const playlist = await Playlist.getCache({ userId: userId, name: playlistName });
    if (!playlist) {
        const embed = new EmbedBuilder()
            .setColor('Red')
            .setDescription(
                `${await t(interaction, 'music.helpers.handlers.playlist.share.not.found.title')}\n${await t(
                    interaction,
                    'music.helpers.handlers.playlist.share.not.found.desc',
                    { name: playlistName }
                )}`
            );
        return interaction.editReply({ embeds: [embed] });
    }

    let shareCode = playlist.shareCode;

    if (!shareCode) {
        shareCode = `KYPL-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
        playlist.shareCode = shareCode;
        await playlist.saveAndUpdateCache();
    }

    const embed = new EmbedBuilder()
        .setColor(kythia.bot.color)
        .setDescription(
            `${await t(interaction, 'music.helpers.handlers.playlist.share.title', { name: playlist.name })}\n${await t(
                interaction,
                'music.helpers.handlers.playlist.share.desc'
            )}\n\n**${await t(interaction, 'music.helpers.handlers.playlist.share.code.label')}**: \`${shareCode}\``
        );

    await interaction.editReply({ embeds: [embed] });
}

/**
 * 📥 Import playlist from share code or Spotify URL.
 */
async function _handlePlaylistImport(interaction) {
    const codeOrUrl = interaction.options.getString('code');
    const userId = interaction.user.id;
    const { client } = interaction;

    if (/^https?:\/\/open\.spotify\.com\/playlist\/[a-zA-Z0-9]+/i.test(codeOrUrl.trim())) {
        return _importFromSpotify(interaction, codeOrUrl);
    }

    try {
        const originalPlaylist = await Playlist.getCache({
            shareCode: codeOrUrl,
            include: [{ model: PlaylistTrack, as: 'tracks' }],
        });

        if (!originalPlaylist) {
            const embed = new EmbedBuilder()
                .setColor('Red')
                .setDescription(
                    `${await t(interaction, 'music.helpers.handlers.playlist.import.invalid.title')}\n${await t(
                        interaction,
                        'music.helpers.handlers.playlist.import.invalid.desc'
                    )}`
                );
            return interaction.editReply({ embeds: [embed] });
        }

        let newPlaylistName = originalPlaylist.name;

        const existing = await Playlist.getCache({ userId: userId, name: newPlaylistName });
        if (existing) {
            newPlaylistName = `${newPlaylistName} (Share)`;
        }

        const playlistCount = await Playlist.countWithCache({ userId: userId });
        const isPremium = await checkIsPremium(userId);
        if (!isOwner(userId) && playlistCount >= kythia.addons.music.playlistLimit && !isPremium) {
            const embed = new EmbedBuilder()
                .setColor('Red')
                .setDescription(
                    `${await t(interaction, 'music.helpers.handlers.music.playlist.save.limit.title')}\n${await t(
                        interaction,
                        'music.helpers.handlers.music.playlist.save.limit.desc',
                        { count: kythia.addons.music.playlistLimit }
                    )}`
                );
            return interaction.editReply({ embeds: [embed] });
        }

        const newPlaylist = await Playlist.create({
            userId: userId,
            name: newPlaylistName,
        });

        const tracksToCopy = originalPlaylist.tracks.map((track) => ({
            playlistId: newPlaylist.id,
            title: track.title,
            identifier: track.identifier,
            author: track.author,
            length: track.length,
            uri: track.uri,
        }));

        await PlaylistTrack.bulkCreate(tracksToCopy);

        const embed = new EmbedBuilder()
            .setColor(kythia.bot.color)
            .setDescription(
                `${await t(interaction, 'music.helpers.handlers.playlist.import.success.title')}\n${await t(
                    interaction,
                    'music.helpers.handlers.playlist.import.success.desc',
                    { original: originalPlaylist.name, name: newPlaylist.name, count: tracksToCopy.length }
                )}`
            );

        return interaction.editReply({ embeds: [embed] });
    } catch (error) {
        logger.error('Playlist import from code failed:', error);
        const embed = new EmbedBuilder()
            .setColor('Red')
            .setDescription(
                `${await t(interaction, 'music.helpers.handlers.playlist.import.error.title')}\n${await t(interaction, 'music.helpers.handlers.playlist.import.error.desc')}`
            );
        return interaction.editReply({ embeds: [embed] });
    }
}

async function _importFromSpotify(interaction, url) {
    const { client, user } = interaction;
    const userId = user.id;

    const res = await client.poru.resolve({
        query: url,
        requester: user,
    });
    if (!res || res.loadType !== 'PLAYLIST_LOADED' || !res.tracks.length) {
        const embed = new EmbedBuilder()
            .setColor('Red')
            .setDescription(await t(interaction, 'music.helpers.handlers.playlist.import.failed'));
        return interaction.editReply({ embeds: [embed] });
    }

    const spotifyPlaylistName = res.playlistInfo.name;
    const tracksFromSpotify = res.tracks;

    const existingPlaylist = await Playlist.getCache({ userId: userId, name: spotifyPlaylistName });

    if (existingPlaylist) {
        const embed = new EmbedBuilder()
            .setColor('Yellow')
            .setDescription(await t(interaction, 'music.helpers.handlers.playlist.import.duplicate.prompt', { name: spotifyPlaylistName }));

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('import_overwrite')
                .setLabel(await t(interaction, 'music.helpers.handlers.playlist.import.btn.overwrite'))
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('import_copy')
                .setLabel(await t(interaction, 'music.helpers.handlers.playlist.import.btn.copy'))
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('import_cancel')
                .setLabel(await t(interaction, 'music.helpers.handlers.playlist.import.btn.cancel'))
                .setStyle(ButtonStyle.Secondary)
        );

        const reply = await interaction.editReply({ embeds: [embed], components: [row] });

        const collector = reply.createMessageComponentCollector({
            filter: (i) => i.user.id === user.id,
            time: 60000,
        });

        collector.on('collect', async (i) => {
            await i.deferUpdate();

            if (i.customId === 'import_overwrite') {
                await PlaylistTrack.destroy({ where: { playlistId: existingPlaylist.id } });
                await _saveTracksToPlaylist(existingPlaylist, tracksFromSpotify);

                const successEmbed = new EmbedBuilder().setColor(kythia.bot.color).setDescription(
                    await t(interaction, 'music.helpers.handlers.playlist.import.overwrite.success', {
                        count: tracksFromSpotify.length,
                        name: spotifyPlaylistName,
                        source: 'spotify',
                    })
                );
                await i.editReply({ embeds: [successEmbed], components: [] });
            } else if (i.customId === 'import_copy') {
                let newName = '';
                let copyNum = 1;
                let isNameAvailable = false;

                while (!isNameAvailable) {
                    newName = `${spotifyPlaylistName} (${copyNum})`;
                    const check = await Playlist.getCache({ userId: userId, name: newName });
                    if (!check) {
                        isNameAvailable = true;
                    } else {
                        copyNum++;
                    }
                }

                const newPlaylist = await Playlist.create({ userId, name: newName });
                await _saveTracksToPlaylist(newPlaylist, tracksFromSpotify);

                const successEmbed = new EmbedBuilder().setColor(kythia.bot.color).setDescription(
                    await t(interaction, 'music.helpers.handlers.playlist.import.copy.success', {
                        count: tracksFromSpotify.length,
                        newName: newName,
                        source: 'spotify',
                    })
                );
                await i.editReply({ embeds: [successEmbed], components: [] });
            } else if (i.customId === 'import_cancel') {
                const cancelEmbed = new EmbedBuilder()
                    .setColor('Grey')
                    .setDescription(await t(interaction, 'music.helpers.handlers.playlist.import.cancelled'));
                await i.editReply({ embeds: [cancelEmbed], components: [] });
            }
            collector.stop();
        });

        collector.on('end', async (collected, reason) => {
            if (reason === 'time') {
                const timeoutEmbed = new EmbedBuilder()
                    .setColor('Red')
                    .setDescription(await t(interaction, 'music.helpers.handlers.playlist.import.timeout'));
                interaction.editReply({ embeds: [timeoutEmbed], components: [] });
            }
        });
    } else {
        const playlistCount = await Playlist.countWithCache({ userId: userId });
        const isPremium = await checkIsPremium(userId);
        if (!isOwner(userId) && playlistCount >= kythia.addons.music.playlistLimit && !isPremium) {
            const embed = new EmbedBuilder().setColor('Red').setDescription(
                await t(interaction, 'music.helpers.handlers.music.playlist.save.limit.desc', {
                    count: kythia.addons.music.playlistLimit,
                })
            );
            return interaction.editReply({ embeds: [embed] });
        }

        const newPlaylist = await Playlist.create({ userId, name: spotifyPlaylistName });
        await _saveTracksToPlaylist(newPlaylist, tracksFromSpotify);

        const embed = new EmbedBuilder().setColor(kythia.bot.color).setDescription(
            await t(interaction, 'music.helpers.handlers.playlist.import.success.text', {
                count: tracksFromSpotify.length,
                name: spotifyPlaylistName,
                source: 'spotify',
            })
        );
        await interaction.editReply({ embeds: [embed] });
    }
}

async function _saveTracksToPlaylist(playlist, tracks) {
    const tracksToSave = tracks.map((track) => ({
        playlistId: playlist.id,
        title: track.info.title,
        identifier: track.info.identifier,
        author: track.info.author,
        length: track.info.length,
        uri: track.info.uri,
    }));
    await PlaylistTrack.bulkCreate(tracksToSave);
}

async function handleFavorite(interaction, player) {
    let s;
    if (interaction.isChatInputCommand()) {
        s = interaction.options.getSubcommand();
    } else {
        s = interaction.customId.split('_')[2];
    }
    if (s === 'play') return _handleFavoritePlay(interaction, player);
    if (s === 'list') return _handleFavoriteList(interaction);
    if (s === 'add') return _handleFavoriteAdd(interaction, player);
    if (s === 'remove') return _handleFavoriteRemove(interaction);
}

async function _handleFavoritePlay(interaction, player) {
    await interaction.deferReply();

    const append = interaction.options.getBoolean('append') || false;
    const client = interaction.client;
    const userId = interaction.user.id;

    const favorites = await Favorite.getAllCache({
        where: { userId },
        order: [['createdAt', 'ASC']],
        cacheTags: [`Favorite:byUser:${userId}`],
    });

    if (!favorites || favorites.length === 0) {
        const embed = new EmbedBuilder().setColor('Red').setDescription(await t(interaction, 'music.helpers.handlers.favorite.play.empty'));
        return interaction.editReply({ embeds: [embed] });
    }

    if (player && !append) {
        player.queue.clear();
    }

    const newPlayer =
        player ||
        client.poru.createConnection({
            guildId: interaction.guild.id,
            voiceChannel: interaction.member.voice.channel.id,
            textChannel: interaction.channel.id,
            deaf: true,
        });

    let added = 0;
    for (const fav of favorites) {
        const poruTrack = await client.poru.resolve({ query: fav.uri, requester: interaction.user });
        if (poruTrack.tracks && poruTrack.tracks[0]) {
            newPlayer.queue.add(poruTrack.tracks[0]);
            added++;
        }
    }

    if (!newPlayer.isPlaying) newPlayer.play();

    const embed = new EmbedBuilder()
        .setColor(kythia.bot.color)
        .setDescription(await t(interaction, 'music.helpers.handlers.favorite.play.success', { count: added }));
    await interaction.editReply({ embeds: [embed] });
}

async function _handleFavoriteList(interaction) {
    await interaction.deferReply();
    const userId = interaction.user.id;

    const favorites = await Favorite.getAllCache({
        where: { userId },
        order: [['createdAt', 'ASC']],
        cacheTags: [`Favorite:byUser:${userId}`],
    });

    if (!favorites || favorites.length === 0) {
        const embed = new EmbedBuilder().setColor('Red').setDescription(await t(interaction, 'music.helpers.handlers.favorite.list.empty'));
        return interaction.editReply({ embeds: [embed] });
    }

    const itemsPerPage = 10;
    const totalPages = Math.ceil(favorites.length / itemsPerPage) || 1;

    async function createFavoriteListContainer(page = 1) {
        page = Math.max(1, Math.min(page, totalPages));
        const start = (page - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const currentPageFavorites = favorites.slice(start, end);

        const list = currentPageFavorites.map((f, idx) => `**${start + idx + 1}.** [${f.title}](${f.uri})`).join('\n');

        const buttons = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`favoritelist_prev_${page}`)
                .setEmoji('◀️')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(page === 1),
            new ButtonBuilder()
                .setCustomId(`favoritelist_next_${page}`)
                .setEmoji('▶️')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(page === totalPages)
        );

        const container = new ContainerBuilder()
            .setAccentColor(convertColor(kythia.bot.color, { from: 'hex', to: 'decimal' }))
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`${await t(interaction, 'music.helpers.handlers.favorite.list.title')}`)
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(list || (await t(interaction, 'music.helpers.handlers.favorite.list.empty')))
            )
            .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
            .addActionRowComponents(buttons)
            .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    await t(interaction, 'music.helpers.handlers.queue.footer', {
                        page: page,
                        totalPages: totalPages,
                        totalTracks: favorites.length,
                    })
                )
            );

        return {
            components: [container],
            flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2,
            fetchReply: true,
        };
    }

    let initialPage = 1;
    if (interaction.isChatInputCommand()) {
        initialPage = interaction.options.getInteger('page') || 1;
    }

    const messageOptions = await createFavoriteListContainer(initialPage);
    const message = await interaction.editReply(messageOptions);

    const collector = message.createMessageComponentCollector({
        filter: (i) => i.user.id === interaction.user.id,
        time: 5 * 60 * 1000,
    });

    collector.on('collect', async (buttonInteraction) => {
        const [prefix, action, currentPageStr] = buttonInteraction.customId.split('_');
        let currentPage = parseInt(currentPageStr, 10);

        if (action === 'next') {
            currentPage++;
        } else if (action === 'prev') {
            currentPage--;
        }

        const updatedMessageOptions = await createFavoriteListContainer(currentPage);
        await buttonInteraction.update(updatedMessageOptions);
    });

    collector.on('end', async () => {
        if (message.editable) {
            const finalState = await createFavoriteListContainer(1);
            finalState.components = [];
            await message.edit(finalState).catch(() => {});
        }
    });
}

async function _handleFavoriteAdd(interaction, player) {
    await interaction.deferReply();

    const userId = interaction.user.id;
    let track;

    if (interaction.isChatInputCommand()) {
        const query = interaction.options.getString('search');
        const res = await interaction.client.poru.resolve({ query, requester: interaction.user });
        if (!res || !res.tracks || res.tracks.length === 0) {
            const embed = new EmbedBuilder()
                .setColor('Red')
                .setDescription(await t(interaction, 'music.helpers.handlers.favorite.add.no.track'));
            return interaction.editReply({ embeds: [embed] });
        }
        track = res.tracks[0];
    } else {
        track = player?.currentTrack;
    }

    if (!track) {
        const embed = new EmbedBuilder()
            .setColor('Red')
            .setDescription(await t(interaction, 'music.helpers.handlers.favorite.add.no.track'));
        return interaction.editReply({ embeds: [embed] });
    }

    const existing = await Favorite.getCache({
        where: {
            userId,
            identifier: track.info.identifier,
        },
    });

    if (existing) {
        const embed = new EmbedBuilder()
            .setColor('Yellow')
            .setDescription(
                await t(interaction, 'music.helpers.handlers.favorite.add.duplicate', { title: track.info.title || track.info.name })
            );
        return interaction.editReply({ embeds: [embed] });
    }

    await Favorite.create({
        userId,
        identifier: track.info.identifier,
        title: track.info.title,
        author: track.info.author,
        length: track.info.length,
        uri: track.info.uri,
    });

    const embed = new EmbedBuilder()
        .setColor(kythia.bot.color)
        .setDescription(
            await t(interaction, 'music.helpers.handlers.favorite.add.success', { title: track.info.title || track.info.name })
        );
    await interaction.editReply({ embeds: [embed] });
}

async function _handleFavoriteRemove(interaction) {
    await interaction.deferReply();

    const userId = interaction.user.id;
    const name = interaction.options.getString('name');

    const favorite = await Favorite.getCache({
        userId: userId,
        title: name,
    });

    if (!favorite) {
        const embed = new EmbedBuilder().setColor('Red').setDescription(await t(interaction, 'music.helpers.handlers.favorite.list.empty'));
        return interaction.editReply({ embeds: [embed] });
    }

    if (!favorite) {
        const embed = new EmbedBuilder()
            .setColor('Red')
            .setDescription(await t(interaction, 'music.helpers.handlers.favorite.remove.invalid.name'));
        return interaction.editReply({ embeds: [embed] });
    }

    await favorite.destroy();

    const embed = new EmbedBuilder()
        .setColor(kythia.bot.color)
        .setDescription(await t(interaction, 'music.helpers.handlers.favorite.remove.success', { title: favorite.title }));
    await interaction.editReply({ embeds: [embed] });
}

/**
 * Handles the 24/7 (always-on) music mode for the player.
 * When enabled, the bot will attempt to stay in the voice channel even when the queue is empty.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
async function handle247(interaction, player) {
    await interaction.deferReply();
    const { client, member, guild, channel } = interaction;

    let playerInstance = player;
    if (!playerInstance) {
        if (!member.voice.channel) {
            const embed = new EmbedBuilder().setColor('Red').setDescription(await t(interaction, 'music.errors.no_voice_channel'));
            return interaction.editReply({ embeds: [embed] });
        }
        playerInstance = client.poru.createConnection({
            guildId: guild.id,
            voiceChannel: member.voice.channel.id,
            textChannel: channel.id,
            deaf: true,
        });

        playerInstance._247 = false;
    }

    const newState = !playerInstance._247;
    playerInstance._247 = newState;

    let msgKey;

    if (newState === true) {
        try {
            await Music247.findOrCreateWithCache({
                where: { guildId: guild.id },
                defaults: {
                    guildId: guild.id,
                    textChannelId: playerInstance.textChannel,
                    voiceChannelId: playerInstance.voiceChannel,
                },
            });
            msgKey = 'music.helpers.handlers.247.enabled';
        } catch (dbErr) {
            logger.error('Failed to save 24/7 to DB:', dbErr);
            msgKey = 'music.helpers.handlers.247.db_error';
        }
    } else {
        try {
            await Music247.destroy({ where: { guildId: guild.id } });
            msgKey = 'music.helpers.handlers.247.disabled';
        } catch (dbErr) {
            logger.error('Failed to remove 24/7 from DB:', dbErr);
            msgKey = 'music.helpers.handlers.247.db_error';
        }
    }

    const embed = new EmbedBuilder().setColor(kythia.bot.color).setDescription(await t(interaction, msgKey));
    await interaction.editReply({ embeds: [embed] });
}

module.exports = {
    handlePlay,
    handlePause,
    handleResume,
    handlePauseResume,
    handleSkip,
    handleStop,
    handleQueue,
    handleNowPlaying,
    handleLoop,
    handleAutoplay,
    handleVolume,
    handleShuffle,
    handleBack,
    handleFilter,
    handleRemove,
    handleMove,
    handleClear,
    handleSeek,
    handleLyrics,
    handlePlaylist,
    handleFavorite,
    handle247,
};
