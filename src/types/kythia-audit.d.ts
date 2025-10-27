import { AuditLogEvent, Guild, GuildAuditLogsEntry } from 'discord.js';
import IKythia from '../Kythia';
import { KythiaClient } from '../KythiaClient';

export interface AuditLogger {
	bot: IKythia;
	client: KythiaClient;
	initialize(): void;
	onAuditLogEntryCreate(entry: GuildAuditLogsEntry, guild: Guild): Promise<void>;
	_formatEntry(entry: GuildAuditLogsEntry): LogData;
}

export interface LogData {
	color: number | string;
	description: string;
	fields: {
		name: string;
		value: string;
		inline?: boolean;
	}[];
}
