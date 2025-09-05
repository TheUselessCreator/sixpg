import { supabase, Log } from '../lib/supabase';
import DBWrapper from './db-wrapper';
import { Command } from '../commands/command';
import SnowflakeEntity from './snowflake-entity';
import { Message } from 'discord.js';

export default class Logs extends DBWrapper<SnowflakeEntity, Log> {
    protected async getOrCreate({ id }: SnowflakeEntity): Promise<Log> {
        const { data: savedLog } = await supabase
            .from('logs')
            .select('*')
            .eq('id', id)
            .single();

        return savedLog || await this.create({ id });
    }

    protected async create({ id }: SnowflakeEntity): Promise<Log> {
        const { data, error } = await supabase
            .from('logs')
            .insert({
                id,
                changes: [],
                commands: []
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }
    
    async logCommand(msg: Message, command: Command): Promise<void> {
        const log = await this.get(msg.client.user);
        
        const commandLog = {
            name: command.name,
            by: msg.author.id,
            at: new Date().toISOString()
        };

        const { error } = await supabase
            .from('logs')
            .update({
                commands: [...log.commands, commandLog],
                updated_at: new Date().toISOString()
            })
            .eq('id', log.id);

        if (error) throw error;
    }

    async save(log: Log): Promise<Log> {
        const { data, error } = await supabase
            .from('logs')
            .upsert({
                ...log,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }
}