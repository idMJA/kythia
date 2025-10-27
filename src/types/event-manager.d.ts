import { Logger } from 'winston';

import { KythiaClient } from '../KythiaClient';
import { KythiaContainer } from './kythia';

export type EventHandler = (manager: EventManager, ...args: any[]) => Promise<boolean | void>;

export interface EventManager {
	client: KythiaClient;
	container: KythiaContainer;
	eventHandlers: Map<string, EventHandler[]>;
	logger: Logger;
}
