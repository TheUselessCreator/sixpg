import { Bot, MessageFilter } from '../../../lib/supabase';
import { ContentValidator } from './content-validator';
import { ValidationError } from '../auto-mod';

export default class BadWordValidator implements ContentValidator {
    filter = MessageFilter.Words;

    validate(content: string, bot: Bot) {
        const msgWords = content.split(' ');
        for (const word of msgWords) {
            const isExplicit = bot.config.autoMod.banWords
                .some(w => w.toLowerCase() === word.toLowerCase());
            if (isExplicit) {
                throw new ValidationError('Message contains banned words.', this.filter);
            }
        }
    }
}