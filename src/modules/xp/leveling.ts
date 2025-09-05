import { Message, GuildMember } from 'discord.js';
import { Bot } from '../../lib/supabase';
import Members from '../../data/members';
import Deps from '../../utils/deps';
import { Member } from '../../lib/supabase';

export default class Leveling {
    constructor(private members = Deps.get<Members>(Members)) {}

    async validateXPMsg(msg: Message, savedBot: Bot) {
        if (!msg?.member || !savedBot || this.hasIgnoredXPRole(msg.member, savedBot))
            throw new TypeError('Member cannot earn XP');

        const savedMember = await this.members.get(msg.member);

        this.handleCooldown(savedMember, savedBot);

        const oldLevel = this.getLevel(savedMember.xp);
        savedMember.xp += savedBot.config.leveling.xpPerMessage;
        const newLevel = this.getLevel(savedMember.xp);

        if (newLevel > oldLevel)
            this.handleLevelUp(msg, newLevel, savedBot);

        await this.members.save!(savedMember);
    }

    handleCooldown(savedMember: Member, savedBot: Bot) {
        const now = new Date();
        const currentMinute = now.getMinutes();
        
        // Convert string dates back to Date objects for comparison
        const recentMessages = savedMember.recent_messages
            .map(dateStr => new Date(dateStr))
            .filter(date => date.getMinutes() === currentMinute);

        const inCooldown = recentMessages.length >= savedBot.config.leveling.maxMessagesPerMinute;
        if (inCooldown)
            throw new TypeError('User is in cooldown');

        // Clean old messages and add current message
        const lastMessage = recentMessages[recentMessages.length - 1];
        if (!lastMessage || lastMessage.getMinutes() !== currentMinute) {
            savedMember.recent_messages = [];
        }
        
        savedMember.recent_messages.push(now.toISOString());
    }

    private hasIgnoredXPRole(member: GuildMember, savedBot: Bot) {
        for (const [, role] of member.roles.cache) { 
            if (savedBot.config.leveling.ignoredRoleNames.some(name => name === role.name))
                return true;
        }
        return false;
    }

    private handleLevelUp(msg: Message, newLevel: number, savedBot: Bot) {
        // TODO: add disable xp message option
        msg.channel.send(`Level Up! ⭐\n**New Level**: \`${newLevel}\``);

        const levelRoleName = this.getLevelRoleName(newLevel, savedBot);
        if (levelRoleName) {
            const role = msg.guild!.roles.cache.find(r => r.name === levelRoleName);
            if (role) {
                msg.member!.roles.add(role);
            }
        }
    }

    private getLevelRoleName(level: number, savedBot: Bot) {
        return savedBot.config.leveling.levelRoleNames
            .find(r => r.level === level)?.roleName;
    }

    getLevel(xp: number) {
        const preciseLevel = (-75 + Math.sqrt(Math.pow(75, 2) - 300 * (-150 - xp))) / 150;            
        return Math.floor(preciseLevel);
    }

    static xpInfo(xp: number) {
        const preciseLevel = (-75 + Math.sqrt(Math.pow(75, 2) - 300 * (-150 - xp))) / 150;
        const level = Math.floor(preciseLevel);

        const xpForNextLevel = this.xpForNextLevel(level, xp);
        const nextLevelXP = xp + xpForNextLevel;        
         
        const levelCompletion = preciseLevel - level;

        return { level, xp, xpForNextLevel, levelCompletion, nextLevelXP };
    }

    private static xpForNextLevel(currentLevel: number, xp: number) {
        return ((75 * Math.pow(currentLevel + 1, 2)) + (75 * (currentLevel + 1)) - 150) - xp;
    }

    static getRank(member: Member, members: Member[]) {
        return members
            .sort((a, b) => b.xp - a.xp)
            .findIndex(m => m.id === member.id) + 1;
    }
}