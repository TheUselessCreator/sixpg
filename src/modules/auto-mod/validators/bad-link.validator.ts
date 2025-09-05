import { Bot, MessageFilter } from '../../../lib/supabase';
import { ContentValidator } from './content-validator';
import { ValidationError } from '../auto-mod';

export default class BadLinkValidator implements ContentValidator {
    filter = MessageFilter.Links;

    validate(content: string, bot: Bot) {
        const isExplicit = bot.config.autoMod.banLinks
            .some(l => content.includes(l));
        if (isExplicit) {
            throw new ValidationError('Message contains banned links.', this.filter);
        }
    }
}