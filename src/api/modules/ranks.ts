import { Member } from "../../lib/supabase";
import { GuildMember } from "discord.js";

export default class Ranks {
    static get(member: GuildMember, savedMembers: Member[]) {
        return savedMembers
            .sort((a, b) => b.xp - a.xp)
            .findIndex(m => m.user_id === member.id) + 1;
    }
}