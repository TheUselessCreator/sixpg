import { supabase, User } from '../lib/supabase';
import DBWrapper from './db-wrapper';

export interface PartialUser { 
    id: string; 
    bot: boolean; 
}

export default class Users extends DBWrapper<PartialUser, User> {
    protected async getOrCreate(user: PartialUser): Promise<User> {
        if (user.bot) {
            throw new TypeError(`Bots don't have accounts`);
        }

        const { data: savedUser } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

        return savedUser || await this.create(user);
    }

    async delete(user: PartialUser): Promise<void> {
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', user.id);

        if (error) throw error;
    }

    protected async create(user: PartialUser): Promise<User> {
        const { data, error } = await supabase
            .from('users')
            .insert({
                id: user.id,
                premium: false,
                votes: 0,
                xp_card: {
                    backgroundURL: '',
                    primary: '#7289da',
                    secondary: '#5865f2',
                    tertiary: '#ffffff'
                }
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async save(user: User): Promise<User> {
        const { data, error } = await supabase
            .from('users')
            .upsert({
                ...user,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }
}