import { Message } from 'discord.js';
import { Logger } from 'winston';

import { KythiaClient } from '../KythiaClient';
import { KythiaContainer } from './kythia';

export interface ShutdownManager {
	client: KythiaClient;
	container: KythiaContainer;
	_activeIntervals: Set<NodeJS.Timeout>;
	_messagesWithActiveCollectors: Set<Message>;
	_collectorPatched: boolean;
	_cleanupAttached: boolean;
	logger: Logger;

	initializeGlobalIntervalTracker(): void;
	initializeShutdownCollectors(): void;
	initialize(): void;
	getActiveIntervalsCount(): number;
	getActiveCollectorsCount(): number;
	forceCleanup(): void;
}
