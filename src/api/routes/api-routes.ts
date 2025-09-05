import { Router } from 'express';
import { AuthClient } from '../server';
import fs from 'fs';
import { router as botsRoutes } from './bots-routes';
import { router as musicRoutes } from './music-routes';
import { router as userRoutes } from './user-routes';
import { promisify } from 'util';
import { resolve } from 'path';
import Commands from '../../data/commands';
import Deps from '../../utils/deps';

const appendFile = promisify(fs.appendFile);
const dashboardLogsPath = resolve('./logs/dashboard');
const sessionDate = new Date()
  .toISOString()
  .replace(/:/g, '');

export const router = Router();

const commands = Deps.get<Commands>(Commands);

router.get('/', (req, res) => res.json({ hello: 'Welcome to 6PG API' }));

router.get('/commands', async (req, res) => {
  try {
    const allCommands = await commands.getAll();
    res.json(allCommands);
  } catch (error) {
    sendError(res, 500, error as Error);
  }
});

router.get('/auth', async (req, res) => {
  try {
    const key = await AuthClient.getAccess(req.query.code as string);
    res.json(key);
  } catch (error) { sendError(res, 400, error as Error); }
});

router.post('/error', async (req, res) => {
  try {
    const { message } = req.body;

    // Ensure logs directory exists
    if (!fs.existsSync(dashboardLogsPath)) {
      fs.mkdirSync(dashboardLogsPath, { recursive: true });
    }

    await appendFile(`${dashboardLogsPath}/${sessionDate}.log`, message + '\n');
  
    res.json({ code: 200, message: 'Success!' });
  } catch (error) { sendError(res, 400, error as Error); }
});

router.get('/invite', (req, res) => 
    res.redirect(`https://discord.com/api/oauth2/authorize?client_id=${process.env.CLIENT_ID}&redirect_uri=${process.env.DASHBOARD_URL}/dashboard&permissions=8&scope=bot`));

router.get('/login', (req, res) => res.redirect(AuthClient.authCodeLink.url));

router.use('/bots', botsRoutes);
router.use('/bots/:botId/guilds/:guildId/music', musicRoutes);
router.use('/user', userRoutes);

router.get('*', (req, res) => res.status(404).json({ code: 404, message: 'Route not found' }));

export function sendError(res: any, code: number, error: Error) {
  console.error('API Error:', error);
  return res.status(code).json({ code, message: error?.message || 'An error occurred' });
}