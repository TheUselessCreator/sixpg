import AnnounceHandler from './announce-handler';
import { Message } from 'discord.js';
import { EventType } from '../../lib/supabase';
import EventVariables from '../../modules/announce/event-variables';

export default class MessageDeleteHandler extends AnnounceHandler {
    on = 'messageDelete';
    event = EventType.MessageDeleted;

    async invoke(msg: Message) {
        if (!msg.author?.bot && msg.guild)
            await super.announce(msg.guild, [ msg ]);
    }
    
    protected applyEventVariables(content: string, msg: Message) {                
        return new EventVariables(content)
            .guild(msg.guild!)
            .memberCount(msg.guild!)
            .message(msg)
            .user(msg.author)
            .toString();
    }
}