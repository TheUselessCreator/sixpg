import { GuildMember } from 'discord.js';
import { supabase, Member } from '../lib/supabase';
import DBWrapper from './db-wrapper';

export default class Members extends DBWrapper<GuildMember, Member> {
    protected async getOrCreate(member: GuildMember): Promise<Member> {
        if (member.user.bot) {
            throw new TypeError(`Bots don't have accounts`);
        }

        const { data: savedMember } = await supabase
            .from('members')
            .select('*')
            .eq('user_id', member.id)
            .eq('guild_id', member.guild.id)
            .single();

        return savedMember || await this.create(member);
    }

    protected async create(member: GuildMember): Promise<Member> {
        const { data, error } = await supabase
            .from('members')
            .insert({
                user_id: member.id,
                guild_id: member.guild.id,
                xp: 0,
                warnings: [],
                recent_messages: []
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async save(member: Member): Promise<Member> {
        const { data, error } = await supabase
            .from('members')
            .upsert({
                ...member,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async findByGuild(guildId: string): Promise<Member[]> {
        const { data, error } = await supabase
            .from('members')
            .select('*')
            .eq('guild_id', guildId)
            .order('xp', { ascending: false });

        if (error) throw error;
        return data || [];
    }
}