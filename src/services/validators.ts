import { Command } from "../commands/command";
import { GuildMember, TextChannel, Message } from "discord.js";
import { Bot } from "../lib/supabase";

export default class Validators {
    checkCommand(command: Command, bot: Bot, msg: Message) {
        const config = bot.config.commands.configs.find(c => c.name === command.name);
        if (!config) return;

        if (!config.enabled)
            throw new TypeError('Command not enabled!');
    }

    checkPreconditions(command: Command, executor: GuildMember) {
        if (command.precondition && !executor.permissions.has(command.precondition))
            throw new TypeError(`**Required Permission**: \`${command.precondition}\``);
    }

    checkChannel(channel: TextChannel, savedBot: Bot) {
        const isIgnored = savedBot.config.general.ignoredChannelNames
            .some(name => name === channel.name);
        if (isIgnored)
            throw new TypeError('Commands cannot be executed in this channel.');
    }
}