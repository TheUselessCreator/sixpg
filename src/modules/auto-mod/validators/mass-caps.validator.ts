import { Bot, MessageFilter } from '../../../lib/supabase';
import { ContentValidator } from './content-validator';
import { ValidationError } from '../auto-mod';

export default class MassCapsValidator implements ContentValidator {
    filter = MessageFilter.MassCaps;

    validate(content: string, bot: Bot) {
        const pattern = /[A-Z]/g;
        const severity = bot.config.autoMod.filterThreshold;
        
        const invalid = content.length > 5 
            && (content.match(pattern)?.length || 0) / content.length >= (severity / 10);
        if (invalid)
            throw new ValidationError('Message contains too many capital letters.', this.filter);
    }
}