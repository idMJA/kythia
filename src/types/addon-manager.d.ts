import { Collection, SlashCommandBuilder, SlashCommandSubcommandBuilder, SlashCommandSubcommandGroupBuilder } from 'discord.js';
import { Logger } from 'winston';

import { KythiaClient } from '../KythiaClient';
import { KythiaContainer } from './kythia';

export type Handler = (interaction: any) => void;

export interface AddonManager {
	client: KythiaClient;
	container: KythiaContainer;
	logger: Logger;
	buttonHandlers: Map<string, Handler>;
	modalHandlers: Map<string, Handler>;
	selectMenuHandlers: Map<string, Handler>;
	autocompleteHandlers: Map<string, Handler>;
	commandCategoryMap: Map<string, string>;
	categoryToFeatureMap: Map<string, string>;
	embedDrafts: Collection<string, any>;
	eventHandlers: Map<string, Handler[]>;
}

export interface CommandModule {
	data: SlashCommandBuilder | ((builder: SlashCommandBuilder) => void);
	autocomplete?: (interaction: any) => void;
	subcommand?: boolean;
	slashCommand?: SlashCommandBuilder;
	contextMenuCommand?: any;
}

export interface GroupModule {
	data: (builder: SlashCommandSubcommandGroupBuilder) => void;
}

export interface SubcommandModule {
	data: (builder: SlashCommandSubcommandBuilder) => void;
	subcommand?: boolean;
}

export interface CommandSummary {
	type: 'single' | 'group';
	name: string;
	folder?: string;
	kind?: 'slash' | 'contextMenu';
	subcommands?: (string | { group: string; subcommands: string[] })[];
}

export interface AddonSummary {
	name: string;
	version: string;
	commands: CommandSummary[];
	events: string[];
	register: string[];
}
