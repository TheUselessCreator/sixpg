import { supabase, Bot } from '../lib/supabase';
import DBWrapper from './db-wrapper';
import SnowflakeEntity from './snowflake-entity';
import GlobalBots from '../global-bots';

export default class Bots extends DBWrapper<SnowflakeEntity, Bot> {
    protected async getOrCreate({ id }: SnowflakeEntity): Promise<Bot> {
        if (!id) throw new Error('Bot ID is required');

        const { data: bot } = await supabase
            .from('bots')
            .select('*')
            .eq('id', id)
            .single();

        return bot || await this.create({ id });
    }

    protected async create({ id }: SnowflakeEntity): Promise<Bot> {
        const { data, error } = await supabase
            .from('bots')
            .insert({
                id,
                owner_id: '', // Will be set when bot is registered
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async getAll(): Promise<Bot[]> {
        const { data, error } = await supabase
            .from('bots')
            .select('*');

        if (error) throw error;
        return data || [];
    }

    async getManageableBots(ownerId: string) {
        const { data: savedBots, error } = await supabase
            .from('bots')
            .select('*')
            .eq('owner_id', ownerId);

        if (error) throw error;

        return (savedBots || [])
            .map(b => GlobalBots.get(b.id)?.user)
            .filter(Boolean);
    }

    async exists({ id }: SnowflakeEntity): Promise<boolean> {
        const { data, error } = await supabase
            .from('bots')
            .select('id')
            .eq('id', id)
            .single();

        return !error && !!data;
    }

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('bots')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }

    async save(bot: Bot): Promise<Bot> {
        const { data, error } = await supabase
            .from('bots')
            .upsert({
                ...bot,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }
}