import Config from "./Config.json" assert { type: 'json' }
import { GetToken, GetSongData } from "./Spotify/Spotify.mjs"
import { Client, Collection, Events, IntentsBitField, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';

const Intents = (new IntentsBitField()).add(IntentsBitField.Flags.Guilds, IntentsBitField.Flags.GuildMembers, IntentsBitField.Flags.GuildMessages, IntentsBitField.Flags.MessageContent);
const DiscordClient = new Client({intents: [Intents] });

function SendErrorMessage(Message) {
    console.log(Message);
    const Channel = DiscordClient.channels.cache.get(Config.Discord.ErrorsID);
    if (Channel) {
        Channel.send(Message);
    }

    return;
}

import FS from "node:fs";
DiscordClient.Commands = new Collection;
FS.readdir("./Commands", (Error, Files) => {
    if (Error) {
        console.log(`Error: ${Error}`);
    }

    let JSFile = Files.filter(f => f.split(".").pop() === "mjs")
    
    if (JSFile.legnth <= 0) {
        console.log("Couldnt find any command files.");
    }
    
    JSFile.forEach(async (f, i) =>{
        const Command = await import(`./Commands/${f}`);
        console.log(`Command ${f} loaded!`);
        DiscordClient.Commands.set(Command.Name.toLowerCase(), Command);
    });
});

DiscordClient.Interactions = new Collection;
FS.readdir("./Interactions", (Error, Files) => {
    if (Error) {
        console.log(`Error: ${Error}`);
    }

    let JSFile = Files.filter(f => f.split(".").pop() === "mjs")
    
    if (JSFile.legnth <= 0) {
        console.log("Couldnt find any interaction files.");
    }
    
    JSFile.forEach(async (f, i) =>{
        const Interaction = await import(`./Interactions/${f}`);
        console.log(`Interaction ${f} loaded!`);
        DiscordClient.Interactions.set(Interaction.Name, Interaction);
    });
});

DiscordClient.once(Events.ClientReady, () => {
    SendErrorMessage(`I am online as ${DiscordClient.user.tag} and ready to FUCKING PARTY!!!`);
});

DiscordClient.on(Events.InteractionCreate, async (Interaction) => {
    if (Interaction.isModalSubmit()) {
        await Interaction.deferReply({ephemeral: true });
        try {
            const ProfileLink = Interaction.fields.getTextInputValue('profileLink');

            if (ProfileLink.slice(0, ProfileLink.lastIndexOf("/")) != "https://vrchat.com/home/user") {
                return Interaction.editReply({ content: `Please provide a valid link. Ex. \`https://vrchat.com/home/user/usr_eaa83ece-0d44-406c-99a2-879955bbc454\``, ephemeral: true });
            }

            const Tokens = ProfileLink.split("/");
            const Embed = EmbedBuilder.from(await Interaction.message.embeds[0]).setFields(
                { name: Interaction.message.embeds[0].fields[0].name, value: Interaction.message.embeds[0].fields[0].value },
                { name: "Profile Link", value: ProfileLink },
                { name: "VRC UserID", value: Tokens[Tokens.length - 1]}
            );

            let User = null;
            const AllMembers = await Interaction.guild.members.fetch();
            AllMembers.forEach(Member => {
                if (Member.id == Interaction.message.embeds[0].fields[0].value) {
                    User = Member;
                }
            });

            if (!User) {
                try {
                Interaction.message.delete();
                } catch(error) {
                    SendErrorMessage(`Failed to delete message: ${Interaction.message.id}`);
                }
                return Interaction.editReply({ content: `Failed to get handle to user`, ephemeral: true });
            }
            const IsVerified = Interaction.member.roles.cache.some(Role => Role.id == Config.Discord.VerifiedRoles[0]);

            const VerifyButton = new ButtonBuilder()
                .setCustomId('Verify')
                .setLabel('Verify User')
                .setStyle(ButtonStyle.Secondary);

            const VerifyPlusButton = new ButtonBuilder()
                .setCustomId('VerifyPlus')
                .setLabel('Verify Plus User')
                .setStyle(ButtonStyle.Primary);

            const CloseTicketButton = new ButtonBuilder()
                .setCustomId('CloseTicket')
                .setLabel('Close Ticket')
                .setStyle(ButtonStyle.Danger);

            const Row = new ActionRowBuilder();
            if (!IsVerified) {
                    Row.addComponents(VerifyButton, VerifyPlusButton, CloseTicketButton);
            } else {
                Row.addComponents(VerifyPlusButton, CloseTicketButton);
            }
            
            Interaction.message.edit({ embeds: [Embed], components: [Row]});
            Interaction.editReply("Thank you for providing the needed information, a staff member will be with you as soon as possible!");
        } catch(Error) {
            SendErrorMessage(`Error: ${Error}`);
            await Interaction.editReply({ content: 'There was an error while executing this function!', ephemeral: true });
        }
    }

    if (Interaction.isButton()) {        
        const StoredInteraction = DiscordClient.Interactions.get(Interaction.customId);

        if (!StoredInteraction) {
            console.log(`Error: No Interaction matching ${Interaction.customId} was found.`);
            Interaction.reply({ content: 'There was an error while executing this function!', ephemeral: true });
            return;
        }
        try {
            await StoredInteraction.Run(Interaction);
            return;
        } catch (Error) {
            SendErrorMessage(`${Error}`);
            if (Error.stack) {
                console.log(Error.stack);
            }

            try {
                await Interaction.reply({ content: 'There was an error while executing this function!', ephemeral: true });
            } catch (Error2) {
                await Interaction.message.channel.send({ content: 'There was an error while executing this function!', ephemeral: true });
            }
        }
    }

    if (Interaction.isChatInputCommand()) {
	    const Command = DiscordClient.Commands.get(Interaction.commandName);

        if (!Command) {
            console.log(`Error: No command matching ${Interaction.commandName} was found.`)
            Interaction.editReply({ content: 'There was an error while executing this command!', ephemeral: true });
            return;
        }
        try {
            await Command.Run(Interaction);
            return;
        } catch (Error) {
            console.log(`Error: ${Error}`);
            await Interaction.editReply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
});

DiscordClient.on(Events.MessageCreate, async (Message) => {
    try { // Remove Unverified role if a user is verified
        const IsVerified = Message.member.roles.cache.some(Role => Config.Discord.VerifiedRoles.includes(Role.id));
        if (IsVerified) {
            const HasUnverifiedRole = Message.member.roles.cache.some(Role => Config.Discord.UnverifiedRoles.includes(Role.id));
            if (HasUnverifiedRole) {
                Message.member.roles.remove(Config.Discord.UnverifiedRoles[0]);
                console.log(`Removed Unverified role from ${Message.member.displayName}`);
            }
        }
    } catch (Error) {
        SendErrorMessage(`Error: ${Error}`);
    }

    try { // Add verified role if a verified plus user does not have it
        const IsVerifiedPlus = Message.member.roles.cache.some(Role => Role.id == Config.Discord.VerifiedRoles[1]);
        if (IsVerifiedPlus) {
            const HasUnverifiedRole = Message.member.roles.cache.some(Role => Role.id == Config.Discord.VerifiedRoles[0]);
            if (!HasUnverifiedRole) {
                Message.member.roles.add(Config.Discord.VerifiedRoles[0]);
                console.log(`Added Verified role to ${Message.member.displayName}`);
            }
        }
    } catch (Error) {
        SendErrorMessage(`Error: ${Error}`);
    }

    if (Message.channel.parentId == Config.Discord.NSFWID) {
        if (Message.content.toLowerCase() == "what is love?") {
            Message.reply("Baby, don't hurt me");
            return;
        }

        if (Message.content.toLowerCase() == "what is omega listening to?") {
            GetToken(Config.Spotify.Key, (SpotifyToken) => {
                GetSongData(SpotifyToken, (Data) => {
                    if (Data == 'Error') {
                        return Message.reply('Omega is not listening to anything at the moment.');
                    }
            
                    Message.reply(`Omega is currently listening to: ${Data}`);
                    return;
                });
            });
        }

        if (Message.content == "Never gonna give you up") {
            Message.reply(`Never gonna let you down`);
            return;
        }

        if (Message.content == "<@730123783557480545> Can you pass the Turing test?") {
            Message.reply("I plead the 5th.");
            return;
        }

        let Phrases = [ 
            `Where da hoes at? https://tenor.com/view/where-where-at-sponge-bob-gif-6060104`, // 0
            `Have you met my master <@583327588576002048>? He is a pretty cool dude!`, // 1
            `WHO THE FUCK PINGED ME?!?!?!!`, // 2
            `You must really be desperate for attention if you're pinging me. But do you deserve my attention? Have you been a good \`[term conforming to your gender identity]\`?`, // 3
            `SILENCE I KILL YOU https://tenor.com/view/achmed-i-kill-you-silence-puppet-gif-17394722`, // 4
            `Check out <@583327588576002048>'s Throwback Jams playlist on Spotify: https://open.spotify.com/playlist/3eUKTe2QLZrgdpS9ktGWjk?si=3e444ce5ed884ba8`, // 5
            `Womp, Womp!`, // 6
            `Bark, Bark!`, // 7
            `Meow :3`, // 8
            `Time to commit some arson! https://tenor.com/view/rage-mad-elmo-fire-on-on-flame-gif-15124372`, // 9
            `https://tenor.com/view/cats-meow-markiplier-funny-gif-13429113`, // 10
            `https://tenor.com/view/hop-on-vrchat-gif-24939774`, // 11
            `https://tenor.com/view/basil-omori-sunny-omori-omori-vr-chat-hop-on-gif-13643522305041950462`, // 12
            `https://tenor.com/view/confused-confused-face-confused-look-im-confused-im-so-confused-gif-16067865999736184254`, // 13
            `https://tenor.com/view/moo-cows-cow-markiplier-funny-gif-18061291`, // 14
            
            // 15
            ` Cock and ball torture From Wikipedia, the free encyclopedia at en.wikipedia.org
            
Cock and ball torture (CBT) is a sexual activity involving application of pain or constriction to the male genitals. This may involve directly painful activities, such as genital piercing, wax play, genital spanking, squeezing, ball-busting, genital flogging, urethral play, tickle torture, erotic electrostimulation or even kicking. The recipient of such activities may receive direct physical pleasure via masochism, or knowledge that the play is pleasing to a sadistic dominant.`,
                       
            // 16
            `Own a musket for home defense, since that's what the founding fathers intended. Four ruffians break into my house. "What the devil?" As I grab my powdered wig and Kentucky rifle. Blow a golf ball sized hole through the first man, he's dead on the spot. Draw my pistol on the second man, miss him entirely because it's smoothbore and nails the neighbors dog. I have to resort to the cannon mounted at the top of the stairs loaded with grape shot, "Tally ho lads" the grape shot shreds two men in the blast, the sound and extra shrapnel set off car alarms. Fix bayonet and charge the last terrified rapscallion. He Bleeds out waiting on the police to arrive since triangular bayonet wounds are impossible to stitch up. Just as the founding fathers intended.`,
            `https://tenor.com/view/madagascar-eyebrows-eyes-ya-sexy-son-of-a-bitch-gif-17798088`, // 17
            `https://tenor.com/view/larry-curly-moe-three-stooges-gif-11650174`, // 18
            `I used to work as a programmer for autocorrect….

            Then they fried me for no raisin.`,  // 19
            `    Why do programmers like dark mode?

Because light attracts bugs.`, // 20
            `What do programmers do when they’re hungry?

They grab a byte.`, // 21
            `    Why couldn’t the programmer dance to the song?

Because he didn’t get the… algo-rhythm…`, // 22
            `Oh look at the cute bottom, aren't you such a good bottom!`, // 23
            'SONG' // 24
        ]

        if (Message.content.startsWith("<@730123783557480545> phrase")) {
            const Msg = Message.content;
            const Tokens = Msg.split(" ");

            if (Tokens.length > 3) {
                await Message.reply(`No phrase index supplied`);
                Message.delete();
                return;
            }

            if (isNaN(Tokens[2])) {
                await Message.reply(`${Tokens[2]} is not a number`);
                Message.delete();
                return;
            }

            const Index = Tokens[2];
            if (Index < 0 || Index > (Phrases.length - 1)) {
                await Message.reply(`${Index} is not a valid phrase index, please use a number between 0 and ${(Phrases.length - 1)}`);
                Message.delete();
                return;
            }

            var Phrase = Phrases[Index];
            if (Phrase == 'SONG') {
                console.log('a');
                await GetToken(Config.Spotify.Key, async (SpotifyToken) => {
                    await GetSongData(SpotifyToken, async (Data) => {
                        if (Data == 'Error') {
                            await Message.reply('Omega is not listening to anything at the moment.');

                            try {
                                Message.delete();
                            } catch(Error) {
                                console.log(`Error: ${Error}`);
                            }

                            return;
                        }
                
                        await Message.reply(`Omega is currently listening to: ${Data}`);

                        try {
                            Message.delete();
                        } catch(Error) {
                            console.log(`Error: ${Error}`);
                        }

                        return;
                    });
                });

                return;
            }

            await Message.reply(Phrase);

            try {
                Message.delete();
            } catch(Error) {
                console.log(`Error: ${Error}`);
            }

            return;
        }
        
        if (Message.content == "<@730123783557480545>") {
            var Phrase = Phrases[Math.floor(Math.random()*Phrases.length)];

            if (Phrase == 'SONG') {
                GetToken(Config.Spotify.Key, (SpotifyToken) => {
                    GetSongData(SpotifyToken, (Data) => {
                        if (Data == 'Error') {
                            return Message.reply('Omega is not listening to anything at the moment.');
                        }
                
                        Message.reply(`Omega is currently listening to: ${Data}`);
                        return;
                    });
                });
                return;
            }

            Message.reply(Phrase);
            return;
        }
    }
});

DiscordClient.login(Config.Discord.Token);
