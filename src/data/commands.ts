import { supabase, Command as DBCommand } from '../lib/supabase';
import DBWrapper from './db-wrapper';
import { Command } from '../commands/command';

export default class Commands extends DBWrapper<Command, DBCommand> {
    protected async getOrCreate(command: Command): Promise<DBCommand> {
        return this.create(command);
    }

    protected async create(command: Command): Promise<DBCommand> {
        const { data, error } = await supabase
            .from('commands')
            .upsert({
                name: command.name,
                summary: command.summary,
                module: command.module,
                usage: command.usage ?? this.getCommandUsage(command),
                precondition: command.precondition
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    getCommandUsage(command: Command): string {
        const args = command.execute
            .toString()
            .split('{')[0]
            .replace(/function \(|\)/g, '')
            .replace(/,/g, '')
            .replace(/ctx/, '')
            .trim();
        return (args) ? `${command.name} ${args}` : command.name;
    }

    async getAll(): Promise<DBCommand[]> {
        const { data, error } = await supabase
            .from('commands')
            .select('*');

        if (error) throw error;
        return data || [];
    }
}