import { AutoUpdate } from '@omega172/autoupdatejs';
import BotConfig from './Config.json' with { type: 'json' };
import PKG from './package.json' with { type: 'json' };
import { Client, Collection, Events, GatewayIntentBits, Interaction, TextChannel, ButtonInteraction, CacheType } from 'discord.js';
import { DiscordType, ModalInteractionType, ButtonInteractionType, CommandInteractionType, Ticket, MsgType, Edit, SessionType, Package } from './Types.js';
import Loki from 'lokijs';
import { TOTP } from 'totp-generator';
import VRChat from 'vrchat'

const { Guilds, GuildMembers, GuildMessages, MessageContent } = GatewayIntentBits;
const Discord: DiscordType = {
    Client: new Client({ intents: [Guilds, GuildMembers, GuildMessages, MessageContent]}),
    Config: BotConfig,
    Database: new Loki('./Tickets.json', {
        autoload: true,
        autoloadCallback: async (Error) => {
            if (Error) {
                return console.log(Error);
            }

            if (!Discord.Database.getCollection<Ticket>('Tickets')) {
                Discord.Database.addCollection<Ticket>('Tickets');
            }

            if (!Discord.Database.getCollection<Ticket>('Session')) {
                Discord.Database.addCollection<SessionType>('Session');

                const Session = Discord.Database.getCollection<SessionType>('Session');
                Session.insert({ Name: 'Session', Value: null });

                await Discord.GetSession();
            }

            console.log('Database loaded!');
        },
        autosave: true,
        autosaveInterval: 4000,
        autosaveCallback: (Error) => {
            if (Error) {
                return console.log(Error);
            }

            console.log('Database saved!');
        },
        serializationMethod: "pretty"
    }),
    Interactions: {
        ModalInteractions: new Collection<string, ModalInteractionType>(),
        ButtonInteractions: new Collection<string, ButtonInteractionType>(),
        CommandInteractions: new Collection<string, CommandInteractionType>()
    },
    LogMessage: (Message: string, Error?: boolean): void => {
        if (!Discord.Config.LogChannelID) {
            return;
        }

        const Channel = Discord.Client.channels.cache.get(Discord.Config.LogChannelID);
        if (Channel && Channel.isTextBased()) {
            Error ? Channel.send(`<@${Discord.Config.DevID}> \n ${Message}`) : Channel.send(Message);
        }
    
        return;
    },
    Credentials: new VRChat.Configuration({
        apiKey: 'JlE5Jldo5Jibnk5O5hTx6XVqsJu4WJ26', // No I am not worried about sharing this key publicly (Reason: https://vrchatapi.github.io/docs/api/#overview--getting-started)
        username: BotConfig.VRChat.Username,
        password: BotConfig.VRChat.Password,
        baseOptions: {
            headers: {
                "User-Agent": BotConfig.VRChat.UserAgent
            }
        }
    }),
    GetOTP: (): string => {
        const { otp, expires } = TOTP.generate(Discord.Config.VRChat.TOTPSecret);
        console.log(`TOTP Code: ${otp} expires iat ${new Date(expires)}`);
        return otp;
    },
    GetSession: async (Interaction?: ButtonInteraction<CacheType>): Promise<VRChat.AuthenticationApi | null> => {
        const Session = Discord.Database.getCollection<SessionType>('Session');
        const Result = Session.find({ Name: 'Session' });
        if (Result[0].Value != null && Result[0].Value.getCurrentUser != undefined) {
            console.log(`Using stored session`);
            return Result[0].Value;
        }

        try {
            const AuthAPI = new VRChat.AuthenticationApi(Discord.Credentials);
            const ResCurrentUser = await AuthAPI.getCurrentUser();
            if (ResCurrentUser.status == 200 && (ResCurrentUser as any).data.requiresTwoFactorAuth) {
                const Res2FA = await AuthAPI.verify2FA({ code: Discord.GetOTP() });
                if (Res2FA.status != 200) {
                    console.error(`2FA Failed`);
                    Discord.LogMessage(`2FA Failed`, true);
                    if (Interaction) {
                        Interaction.reply({ content: `There was an error accessing the VRChat API`, ephemeral: true});
                    }
                    return null;
                }

                console.log(`Storing new session`);
                Result[0].Value = AuthAPI;
                Session.update(Result);
                return AuthAPI;
            } else {
                console.error(`Failed to get current user`);
                Discord.LogMessage(`Failed to get current user`, true);
                if (Interaction) {
                    Interaction.reply({ content: `There was an error accessing the VRChat API`, ephemeral: true});
                }
                return null;
            }
        } catch(Error: any) {
            console.error(`VRChat API failed to authenticate, probably rate-limited\n${Error}`);
            Discord.LogMessage(`VRChat API failed to authenticate, probably rate-limited\n${Error}`, true);
            return null;
        }
    }
}

new AutoUpdate({
    RepoURL: 'https://github.com/Omega172/Verification-Bot/',
    Branch: 'main',
    PathToPackage: '/VRC Bot/',
    ExecuteOnComplete: 'echo Update complete!',
    ExitOnComplete: true
}).CheckForUpdate((UpdateAvailable) => {
    console.log(`Current Version: ${(PKG as Package).version}`);
    if (UpdateAvailable) {
        console.log('You should update!');
    } else {
        console.log('All up to date!');
    }
});

import FS from "node:fs";
FS.readdir("./Interactions/Modals", (Error, Files) => {
    if (Error) {
        console.error(`${Error}`);
    }

    let JSFile: any = Files.filter(File => File.split(".").pop() === ("ts" || "js"))
    
    if (JSFile.legnth <= 0) {
        console.log("Couldnt find any command files.");
    }
    
    JSFile.forEach(async (File: string) =>{
        const ModalInteraction: ModalInteractionType = await import(`./Interactions/Modals/${File}`);
        console.log(`Modal interaction ${File} loaded!`);

        ModalInteraction.IDs.forEach((ID) => {
            Discord.Interactions.ModalInteractions.set(ID, ModalInteraction);
        });
    });
});
FS.readdir("./Interactions/Buttons", (Error, Files) => {
    if (Error) {
        console.error(`${Error}`);
    }

    let JSFile: any = Files.filter(File => File.split(".").pop() === ("ts" || "js"))
    
    if (JSFile.legnth <= 0) {
        console.log("Couldnt find any command files.");
    }
    
    JSFile.forEach(async (File: string) =>{
        const ButtonInteraction: ButtonInteractionType = await import(`./Interactions/Buttons/${File}`);
        console.log(`Button interaction ${File} loaded!`);

        ButtonInteraction.IDs.forEach((ID) => {
            Discord.Interactions.ButtonInteractions.set(ID, ButtonInteraction);
        });
    });
});
FS.readdir("./Interactions/Commands", (Error, Files) => {
    if (Error) {
        console.error(`${Error}`);
    }

    let JSFile: any = Files.filter(File => File.split(".").pop() === ("ts" || "js"))
    
    if (JSFile.legnth <= 0) {
        console.log("Couldnt find any command files.");
    }
    
    JSFile.forEach(async (File: string) =>{
        const CommandInteraction: CommandInteractionType = await import(`./Interactions/Commands/${File}`);
        console.log(`Command interaction ${File} loaded!`);
        Discord.Interactions.CommandInteractions.set(CommandInteraction.Data.name, CommandInteraction);
    });
});

Discord.Client.on(Events.InteractionCreate, async (Interaction: Interaction) => {
    if (Interaction.isModalSubmit()) {
        const StoredModalInteraction: ModalInteractionType | undefined = Discord.Interactions.ModalInteractions.get(Interaction.customId);
        if (StoredModalInteraction == undefined) {
            console.log(`No modal interaction matching \`${Interaction.customId}\` was found!`);

            if (Interaction.isRepliable()) {
                Interaction.reply({ content: `No modal interaction matching \`${Interaction.customId}\` was found!`, ephemeral: true });
            }
            return;
        }

        try {
            await StoredModalInteraction.Run(Discord, Interaction);
            return;
        } catch (Error: any) {
            console.error(Error);
            if (!Interaction.isRepliable()) {
                return;
            }

            const ErrorMessage = 'There was an error while executing this modal interaction!';
            Discord.LogMessage(`\`\`\`ts\n${Error}\`\`\``, true);
            if (Interaction.replied) {
                await Interaction.editReply({ content: ErrorMessage});
            } else {
                await Interaction.reply({ content: ErrorMessage, ephemeral: true });
            }
        }
    }

    if (Interaction.isButton()) {
        const StoredButtonInteraction: ButtonInteractionType | undefined = Discord.Interactions.ButtonInteractions.get(Interaction.customId);
        if (StoredButtonInteraction == undefined) {
            console.log(`No button interaction matching \`${Interaction.customId}\` was found!`);

            if (Interaction.isRepliable()) {
                Interaction.reply({ content: `No button interaction matching \`${Interaction.customId}\` was found!`, ephemeral: true });
            }
            return;
        }

        try {
            await StoredButtonInteraction.Run(Discord, Interaction);
            return;
        } catch (Error: any) {
            console.error(Error);
            if (!Interaction.isRepliable()) {
                return;
            }

            const ErrorMessage = 'There was an error while executing this button interaction!';
            Discord.LogMessage(`\`\`\`ts\n${Error}\`\`\``, true);
            if (Interaction.replied) {
                await Interaction.editReply({ content: ErrorMessage});
            } else {
                await Interaction.reply({ content: ErrorMessage, ephemeral: true });
            }
        }
    }

    if (Interaction.isChatInputCommand()) {
        const StoredCommandInteraction: CommandInteractionType | undefined = Discord.Interactions.CommandInteractions.get(Interaction.commandName);
        if (StoredCommandInteraction == undefined) {
            console.log(`No command interaction matching \`${Interaction.commandName}\` was found!`);

            if (Interaction.isRepliable()) {
                Interaction.reply({ content: `No command interaction matching \`${Interaction.commandName}\` was found!`, ephemeral: true });
            }
            return;
        }

        try {
            await StoredCommandInteraction.Run(Discord, Interaction);
            return;
        } catch (Error: any) {
            console.error(Error);
            if (!Interaction.isRepliable()) {
                return;
            }

            const ErrorMessage = 'There was an error while executing this command!';
            Discord.LogMessage(`\`\`\`ts\n${Error}\`\`\``, true);
            if (Interaction.replied) {
                await Interaction.editReply({ content: ErrorMessage});
            } else {
                await Interaction.reply({ content: ErrorMessage, ephemeral: true });
            }
        }
    }
});

Discord.Client.on(Events.MessageCreate, (Message) => {
    if (Message.author.id == Discord.Client.user?.id) {
        return;
    }

    if (!Message.channel || !Message.channel.isTextBased() || (Message.channel as TextChannel).parentId != Discord.Config.TicketCategoryID) {
        return;
    }

    const Tickets = Discord.Database.getCollection<Ticket>('Tickets');
    const Result = Tickets.where((Ticket) => {
        return Ticket.ChannelID == Message.channelId;
    });
    if (!Result.length) {
        return;
    }

    const Msg: MsgType = {
        SenderID: Message.author.id,
        Content: Message.content,
        HasAttachment: (Message.attachments.size != 0),
        NumAttachments: Message.attachments.size,
        ID: Message.id,
        Edited: (Message.editedAt != null),
        Edits: [],
        Deleted: false,
        Timestamp: Date.now()
    }

    Result[0].Messages.push(Msg);
    Tickets.update(Result);
});

Discord.Client.on(Events.MessageUpdate, (OldMessage, NewMessage) => {
    if (NewMessage.author?.id == Discord.Client.user?.id) {
        return;
    }

    if (!NewMessage.channel || !NewMessage.channel.isTextBased() || (NewMessage.channel as TextChannel).parentId != Discord.Config.TicketCategoryID) {
        return;
    }

    if (!NewMessage.content) {
        return;
    }

    const Tickets = Discord.Database.getCollection<Ticket>('Tickets');
    const Result = Tickets.where((Ticket) => {
        return Ticket.ChannelID == NewMessage.channelId;
    });
    if (!Result.length) {
        return;
    }

    var Index: number = 0;
    const Message: MsgType | undefined = Result[0].Messages.find((Msg, I) => {
        Index = I;
        return Msg.ID == NewMessage.id;
    });
    if (!Message) {
        return;
    }

    Result[0].Messages[Index].Edited = true;

    const Edit: Edit = {
        Content: NewMessage.content,
        HasAttachment: (NewMessage.attachments.size != 0),
        NumAttachments: NewMessage.attachments.size,
        Timestamp: Date.now()
    }

    Result[0].Messages[Index].Edits.push(Edit);
    Tickets.update(Result);
});

Discord.Client.on(Events.MessageDelete, (Message) => {
    if (Message.author?.id == Discord.Client.user?.id) {
        return;
    }

    if (!Message.channel || !Message.channel.isTextBased() || (Message.channel as TextChannel).parentId != Discord.Config.TicketCategoryID) {
        return;
    }

    const Tickets = Discord.Database.getCollection<Ticket>('Tickets');
    const Result = Tickets.where((Ticket) => {
        return Ticket.ChannelID == Message.channelId;
    });
    if (!Result.length) {
        return;
    }

    var Index: number = 0;
    const Msg: MsgType | undefined = Result[0].Messages.find((Msg, I) => {
        Index = I;
        return Msg.ID == Message.id;
    });
    if (!Msg) {
        return;
    }

    Result[0].Messages[Index].Deleted = true;
    Tickets.update(Result);
})

Discord.Client.once(Events.ClientReady, async (Client) => {
    await Discord.GetSession();

    console.log(`I am online as ${Client.user.tag}!`);
    Discord.LogMessage(`I am online as ${Client.user.tag}!`);
});

Discord.Client.login(Discord.Config.Token);