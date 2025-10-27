import { REST } from 'discord.js';
import { Redis } from 'ioredis';
import { Sequelize } from 'sequelize';
import { Logger } from 'winston';

import AddonManager from '../managers/AddonManager';
import EventManager from '../managers/EventManager';
import InteractionManager from '../managers/InteractionManager';
import ShutdownManager from '../managers/ShutdownManager';

import KythiaClient from '../KythiaClient';

export interface KythiaConfig {
	bot: {
		token: string;
		clientId: string;
		clientSecret: string;
		devGuildId?: string;
	};
	db: {
		driver: string;
		host: string;
		port: number;
		name: string;
		user: string;
	};
	sentry: {
		dsn: string;
	};
	env: string;
}

export interface ITranslator {
	t: (key: string, ...args: any[]) => string;
	loadLocales: () => void;
}

export interface KythiaDependencies {
	config: KythiaConfig;
	logger: Logger;
	redis: Redis;
	sequelize: Sequelize;
	translator: ITranslator;
	models: any; // TODO: Define model types
	helpers: any; // TODO: Define helper types
	utils: any; // TODO: Define util types
}

export interface KythiaContainer extends KythiaDependencies {
	client: KythiaClient;
}

export interface CommandData {
	type?: number;
}

export default class IKythia {
	kythiaConfig: KythiaConfig;
	client: KythiaClient;
	rest: REST;
	models: any; // TODO: Define model types
	helpers: any; // TODO: Define helper types
	utils: any; // TODO: Define util types
	redis: Redis;
	sequelize: Sequelize;
	logger: Logger;
	translator: ITranslator;
	container: KythiaContainer;
	dbReadyHooks: Array<(c: KythiaClient) => void>;
	clientReadyHooks: Array<(c: KythiaClient) => void>;
	addonManager: AddonManager | null;
	interactionManager: InteractionManager | null;
	eventManager: EventManager | null;
	shutdownManager: ShutdownManager | null;
}
