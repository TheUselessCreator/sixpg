import { Router } from 'express';
import { supabase, Member } from '../../lib/supabase';
import { AuthClient } from '../server';
import Deps from '../../utils/deps';
import Members from '../../data/members';
import Ranks from '../modules/ranks';
import Users from '../../data/users';
import Bots from '../../data/bots';
import Logs from '../../data/logs';
import AuditLogger from '../modules/audit-logger';
import { User } from 'discord.js';
import Leveling from '../../modules/xp/leveling';
import { getUser } from './user-routes';
import { sendError } from './api-routes';
import GlobalBots from '../../global-bots';
import AES from 'crypto-js/aes';
import EventsService from '../../services/events.service';
import { XPCardGenerator } from '../modules/image/xp-card-generator';

export const router = Router();

const events = Deps.get<EventsService>(EventsService),
      logs = Deps.get<Logs>(Logs),
      members = Deps.get<Members>(Members),
      users = Deps.get<Users>(Users),
      bots = Deps.get<Bots>(Bots);

router.get('/', async (req, res) => {
    try {
        const clients = await getManageableBots(req.query.key as string);
        
        res.json(clients);
    } catch (error) { sendError(res, 400, error as Error); }
});

router.post('/', async (req, res) => {
    try {
        const authUser = await getUser(req.query.key);

        const bot = await events.startBot(req.body.token);

        const savedBot = await bots.get(bot.user);

        const exists = await bots.exists(bot.user);
        if (!exists) {
            savedBot.id = bot.user.id;
            savedBot.owner_id = authUser.id;
        }
        savedBot.token_hash = AES.encrypt(req.body.token, process.env.ENCRYPTION_KEY || '') as any;
        await bots.save(savedBot);

        res.json(savedBot);
    } catch (error) { sendError(res, 400, error as Error); }
});

router.patch('/:id', async (req, res) => {
    try {
        try {
            const bot = await events.startBot(req.body.token);
    
            res.json(bot.user);
        } catch (error) {
            throw new TypeError('Invalid token, reverting back.');
        }
    } catch (error) { sendError(res, 400, error as Error); }    
});

router.delete('/:id', async (req, res) => {
    try {
        const id = req.params.id;

        GlobalBots.remove(id);
        await bots.delete(id);

        res.json({ success: true });
    } catch (error) { sendError(res, 400, error as Error); }
});

router.put('/:id/:module', async (req, res) => {
    try {
        const { id, module } = req.params;

        await validateBotOwner(req.query.key as string, id);

        const user = await getUser(req.query.key);
        const savedConfig = await bots.get({ id });
        
        const change = AuditLogger.getChanges({
            old: (savedConfig.config as any)[module],
            new: req.body
        }, module, user.id);

        (savedConfig.config as any)[module] = req.body;
        await bots.save(savedConfig);
       
        const log = await logs.get({ id });
        
        log.changes.push(change);
        await logs.save(log);
            
        res.json(savedConfig);
    } catch (error) { sendError(res, 400, error as Error); }
});

router.get('/:id/config', async (req, res) => {
    try {
        const savedConfig = await bots.get({ id: req.params.id });

        res.json(savedConfig);
    } catch (error) { sendError(res, 400, error as Error); }
});

router.get('/:id/log', async(req, res) => {
    try {
        const bot = GlobalBots.get(req.params.id);
        const log = await logs.get(bot!.user);

        res.send(log);
    } catch (error) { sendError(res, 400, error as Error); }
});

router.get('/:id/public', (req, res) => {
    const bot = GlobalBots.get(req.params.id);
    res.json(bot);
});

router.get('/:botId/guilds', (req, res) => {
    try {
        const { botId } = req.params;
        const bot = GlobalBots.get(botId);
        if (!bot)
            throw new TypeError('Bot not found.');

        res.json(Array.from(bot.guilds.cache.values()));        
    } catch (error) { sendError(res, 400, error as Error); }
});

router.get('/:botId/guilds/:guildId', (req, res) => {
    try {
        const { botId, guildId } = req.params;
        const bot = GlobalBots.get(botId);
        if (!bot)
            throw new TypeError('Bot not found.');

        const guild = bot.guilds.cache.get(guildId);

        res.json(guild);        
    } catch (error) { sendError(res, 400, error as Error); }
});

router.get('/:botId/guilds/:guildId/members', async (req, res) => {
    try {
        const { botId, guildId } = req.params;
        const bot = GlobalBots.get(botId);

        const savedMembers = await members.findByGuild(guildId);        
        let rankedMembers = [];
        for (const member of savedMembers) {
            const user = bot!.users.cache.get(member.user_id);
            if (!user) continue;
            
            const xpInfo = Leveling.xpInfo(member.xp);
            rankedMembers.push(leaderboardMember(user, xpInfo));
        }
        rankedMembers.sort((a, b) => b.xp - a.xp);
    
        res.json(rankedMembers);
    } catch (error) { sendError(res, 400, error as Error); }
});

router.get('/:botId/guilds/:guildId/members/:memberId/xp-card', async (req, res) => {
    try {
        const { botId, guildId, memberId } = req.params;
        const bot = GlobalBots.get(botId);

        const guild = bot!.guilds.cache.get(guildId);
        const member = guild?.members.cache.get(memberId);        
        if (!member)
            throw Error('Member not found');

        const user = bot!.users.cache.get(memberId);
        const savedUser = await users.get(user!);
        
        const savedMember = await members.get(member);  
        const savedMembers = await members.findByGuild(guildId);
        const rank = Ranks.get(member, savedMembers);
        
        const image = await XPCardGenerator.generateXPCard({
            username: user!.username,
            level: Leveling.xpInfo(savedMember.xp).level,
            xp: savedMember.xp,
            xpToNext: Leveling.xpInfo(savedMember.xp).xpForNextLevel,
            rank,
            avatarUrl: user!.displayAvatarURL({ extension: 'png' })
        });
        
        // Convert base64 to buffer
        const buffer = Buffer.from(image.split(',')[1], 'base64');
        
        res.set({'Content-Type': 'image/png'}).send(buffer);
    } catch (error) { sendError(res, 400, error as Error); }
});

export async function validateBotOwner(key: string, botId: string) {
    if (!key)
        throw new TypeError('No key provided.');

    const manageableBots = await getManageableBots(key);
    const isManageable = manageableBots.some(b => b?.id === botId);
    if (!isManageable)
        throw new TypeError('You cannot manage this bot.')
}

export async function getManageableBots(key: string) {
    const authUser = await AuthClient.getUser(key);
    return bots.getManageableBots(authUser.id);
}

function leaderboardMember(user: User, xpInfo: any) {
    return {
        id: user.id,
        username: user.username,
        tag: '#' + user.discriminator,
        displayAvatarURL: user.displayAvatarURL({ extension: 'png' }),
        ...xpInfo
    };
}