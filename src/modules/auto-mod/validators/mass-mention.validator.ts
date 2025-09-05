import { Bot, MessageFilter } from '../../../lib/supabase';
import { ContentValidator } from './content-validator';
import { ValidationError } from '../auto-mod';

export default class MassMentionValidator implements ContentValidator {
    filter = MessageFilter.MassMention;
    
    validate(content: string, bot: Bot) {
        const pattern = /<@![0-9]{18}>/gm;
        const severity = bot.config.autoMod.filterThreshold;       

        const invalid = (content.match(pattern)?.length || 0) >= severity;
        if (invalid)
            throw new ValidationError('Message contains too many mentions.', this.filter);
    }
}