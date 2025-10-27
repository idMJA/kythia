import {
	ButtonInteraction,
	ChatInputCommandInteraction,
	ModalSubmitInteraction,
	UserContextMenuCommandInteraction,
	MessageContextMenuCommandInteraction,
	AutocompleteInteraction,
	AutoModerationActionExecution,
} from 'discord.js';
import { Logger } from 'winston';
import { KythiaClient } from '../KythiaClient';

import { KythiaContainer, KythiaConfig } from './kythia';

type Interaction =
	| ChatInputCommandInteraction
	| AutocompleteInteraction
	| ButtonInteraction
	| ModalSubmitInteraction
	| UserContextMenuCommandInteraction
	| MessageContextMenuCommandInteraction;

export type FormatPerms = (perms: string[]) => string;

export interface InteractionManager {
	client: KythiaClient;
	container: KythiaContainer;
	buttonHandlers: Map<string, (interaction: ButtonInteraction, container: KythiaContainer) => Promise<void>>;
	modalHandlers: Map<string, (interaction: ModalSubmitInteraction, container: KythiaContainer) => Promise<void>>;
	selectMenuHandlers: Map<string, any>;
	autocompleteHandlers: Map<string, (interaction: AutocompleteInteraction, container: KythiaContainer) => Promise<void>>;
	commandCategoryMap: Map<string, string>;
	categoryToFeatureMap: Map<string, string>;
	kythiaConfig: KythiaConfig;
	models: any;
	helpers: any;
	logger: Logger;
	t: (interaction: Interaction | null, key: string, options?: any, locale?: string) => Promise<string>;
	ServerSetting: any;
	KythiaVoter: any;
	isTeam: (user: any) => Promise<boolean>;
	isOwner: (userId: string) => boolean;
	initialize(): void;
	_handleChatInputCommand(interaction: ChatInputCommandInteraction, formatPerms: FormatPerms): Promise<void>;
	_handleAutocomplete(interaction: AutocompleteInteraction): Promise<void>;
	_handleButton(interaction: ButtonInteraction): Promise<void>;
	_handleModalSubmit(interaction: ModalSubmitInteraction): Promise<void>;
	_handleContextMenuCommand(
		interaction: UserContextMenuCommandInteraction | MessageContextMenuCommandInteraction,
		formatPerms: FormatPerms
	): Promise<void>;
	_handleAutoModerationAction(execution: AutoModerationActionExecution): Promise<void>;
	_handleInteractionError(interaction: Interaction, error: Error): Promise<void>;
}
