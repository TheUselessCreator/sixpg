import { Bot, MessageFilter } from '../../../lib/supabase';

export interface ContentValidator {
    filter: MessageFilter;
    
    validate(content: string, bot: Bot): void;
}