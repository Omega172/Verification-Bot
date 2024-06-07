import config from "./config.json" assert { type: 'json' }
import { TOTP } from "totp-generator";
import vrchat from 'vrchat'

import fs from "node:fs";
import { Client, Collection, Events, IntentsBitField, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';

const myIntents = new IntentsBitField();
myIntents.add(IntentsBitField.Flags.Guilds, IntentsBitField.Flags.GuildMembers, IntentsBitField.Flags.GuildMessages, IntentsBitField.Flags.MessageContent);
const client = new Client({intents: [myIntents] });

client.commands = new Collection;
fs.readdir("./Commands", (err, files) => {
    if (err) console.log(err);
    let jsfile = files.filter(f => f.split(".").pop() === "mjs")
    
    if (jsfile.legnth <= 0) {
        console.log("Couldnt find any command files.");
    }
    
    jsfile.forEach(async (f, i) =>{
        const command = await import(`./Commands/${f}`);
        console.log(`Command ${f} loaded!`);
        client.commands.set(command.data.name.toLowerCase(), command);
    });
});

client.interactions = new Collection;
fs.readdir("./Interactions", (err, files) => {
    if (err) console.log(err);
    let jsfile = files.filter(f => f.split(".").pop() === "mjs")
    
    if (jsfile.legnth <= 0) {
        console.log("Couldnt find any interaction files.");
    }
    
    jsfile.forEach(async (f, i) =>{
        const interaction = await import(`./Interactions/${f}`);
        console.log(`Interaction ${f} loaded!`);
        client.interactions.set(f.split(".")[0], interaction);
    });
});

function parseUserID(profileLink) {
    const tokens = profileLink.split("/");
    return tokens[tokens.length - 1];
}

function sendErrorMessage(msg) {
    const channel = client.channels.cache.get(config.discord.errorsID);
    if (channel) {
        channel.send(msg);
    }
}

client.once(Events.ClientReady, client => {
    console.log(`Client ready, logged in as ${client.user.tag}`);
    sendErrorMessage(`I am online and ready to FUCKING PARTY!!!`);
});

client.on(Events.ShardDisconnect, aysnc => {
    console.log(`Client lost connection!`);
});

let timestamp = 0;
client.on(Events.ShardReconnecting, async => {
    if (timestamp == 0) {
        console.log(`Client reconnecting...`);
        timestamp = Math.floor(Date.now() / 1000);
    }
});

client.once(Events.ShardReady, async => {
    console.log(`Main client Shard is ready!`);
    sendErrorMessage(`Client shard initalized, finalizing bot startup.`);
});

client.on(Events.ShardResume, async => {
    console.log(`Client shard reconnected!`);
    sendErrorMessage(`I lost connection at <t:${timestamp}>, but now I am back bitches! https://cdn.discordapp.com/attachments/1182430524380295270/1247297353673871491/3fff923aba6a5f771c82fbf31cbd2bec5de3936e.jpeg?ex=665f83ae&is=665e322e&hm=194d240d9671d7dfd0e5896101731c44b0b0a62d7e74d9d20ee4ac02439ec2d9&`);
    timestamp = 0;
});

client.on(Events.InteractionCreate, async interaction => {
    if (interaction.isModalSubmit()) {
        await interaction.deferReply({ephemeral: true });
        const profileLink = interaction.fields.getTextInputValue('profileLink');

        // Validate link
        const compare = "https://vrchat.com/home/user"
        if (profileLink.slice(0, profileLink.lastIndexOf("/")) != compare) {
            return interaction.editReply({ content: `Please provide a valid link. Ex. \`https://vrchat.com/home/user/usr_eaa83ece-0d44-406c-99a2-879955bbc454\``, ephemeral: true });
        }

        const Embed = EmbedBuilder.from(await interaction.message.embeds[0]).setFields(
            { name: interaction.message.embeds[0].fields[0].name, value: interaction.message.embeds[0].fields[0].value },
            { name: "Profile Link", value: profileLink },
            { name: "VRC UserID", value: parseUserID(profileLink)}
        );

        let user = null;
        const allMembers = await interaction.guild.members.fetch();
        allMembers.forEach(m => {
            if (m.id == interaction.message.embeds[0].fields[0].value) {
                user = m;
            }
        });

        if (!user) {
            try {
            interaction.message.delete();
            } catch(error) {
                console.log(`Failed to delete message: ${interaction.message.id}`);
                sendErrorMessage(`Failed to delete message: ${interaction.message.id}`);
            }
            return interaction.editReply({ content: `Failed to get handle to user`, ephemeral: true });
        }
        const isVerified = interaction.member.roles.cache.some(r => r.id == config.discord.verifiedRoles[0]);

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
        if (!isVerified) {
                Row.addComponents(VerifyButton, VerifyPlusButton, CloseTicketButton);
        } else {
            Row.addComponents(VerifyPlusButton, CloseTicketButton);
        }
        
        interaction.message.edit({ embeds: [Embed], components: [Row]});
        interaction.editReply("Thank you for providing the needed information, a staff member will be with you as soon as possible!");
    }

    if (interaction.isButton()) {
        const inter = client.interactions.get(interaction.customId);

        if (!inter) {
            console.log(`Error: No interaction matching ${interaction.customId} was found.`);
            interaction.editReply({ content: 'There was an error while executing this function!', ephemeral: true });
            return;
        }
        try {
            await inter.run(interaction);
            return;
        } catch (error) {
            console.log(`Error: ${error}`);
            sendErrorMessage(`Error: ${error}`);
            await interaction.editReply({ content: 'There was an error while executing this function!', ephemeral: true });
        }
    }

    if (interaction.isChatInputCommand()) {
	    const command = client.commands.get(interaction.commandName);

        if (!command) {
            console.log(`Error: No command matching ${interaction.commandName} was found.`)
            interaction.editReply({ content: 'There was an error while executing this command!', ephemeral: true });
            return;
        }
        try {
            await command.run(interaction);
            return;
        } catch (error) {
            console.log(`Error: ${error}`);
            await interaction.editReply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
});

client.on(Events.MessageCreate, async message => {
    try { // Remove Unverified role if a user is verified
        const isVerified = message.member.roles.cache.some(r => config.discord.verifiedRoles.includes(r.id));
        if (isVerified) {
            const hasUnverifiedRole = message.member.roles.cache.some(r => config.discord.unverifiedRoles.includes(r.id));
            if (hasUnverifiedRole) {
                message.member.roles.remove(config.discord.unverifiedRoles[0]);
                console.log(`Removed Unverified role from ${message.member.displayName}`);
            }
        }
    } catch (error) {
        console.log(`Error Ln. 545: ${error}`);
    }

    try { // Add verified role if a verified plus user does not have it
        const isVerifiedPlus = message.member.roles.cache.some(r => r.id == config.discord.verifiedRoles[1]);
        if (isVerifiedPlus) {
            const hasVerifiedRole = message.member.roles.cache.some(r => r.id == config.discord.verifiedRoles[0]);
            if (!hasVerifiedRole) {
                message.member.roles.add(config.discord.verifiedRoles[0]);
                console.log(`Added Verified role to ${message.member.displayName}`);
            }
        }
    } catch (error) {
        console.log(`Error Ln. 558: ${error}`);
    }

    if (message.channel.parentId == config.discord.nsfwID) {
        if (message.content == "What is love?") {
            message.reply("Baby, don't hurt me");
            return;
        }

        if (message.content == "Never gonna give you up") {
            message.reply(`Never gonna let you down`);
            return;
        }

        if (message.content == "<@730123783557480545> Can you pass the Turing test?") {
            message.reply("I plead the 5th.");
            return;
        }

        let phrases = [ 
            `Where da hoes at? https://tenor.com/view/where-where-at-sponge-bob-gif-6060104`,
            `Have you met my master <@583327588576002048>? He is a pretty cool dude!`,
            `WHO THE FUCK PINGED ME?!?!?!!`,
            `You must really be desperate for attention if you're pinging me. But do you deserve my attention? Have you been a good \`[term conforming to your gender identity]\`?`,
            `SILENCE I KILL YOU https://tenor.com/view/achmed-i-kill-you-silence-puppet-gif-17394722`,
            `Check out <@583327588576002048>'s Throwback Jams playlist on Spotify: https://open.spotify.com/playlist/3eUKTe2QLZrgdpS9ktGWjk?si=3e444ce5ed884ba8`,
            `Womp, Womp!`,
            `Bark, Bark!`,
            `Meow :3`,
            `Time to commit some arson! https://tenor.com/view/rage-mad-elmo-fire-on-on-flame-gif-15124372`,
            `https://tenor.com/view/cats-meow-markiplier-funny-gif-13429113`,
            `https://tenor.com/view/hop-on-vrchat-gif-24939774`,
            `https://tenor.com/view/basil-omori-sunny-omori-omori-vr-chat-hop-on-gif-13643522305041950462`,
            `https://tenor.com/view/confused-confused-face-confused-look-im-confused-im-so-confused-gif-16067865999736184254`,
            `https://tenor.com/view/moo-cows-cow-markiplier-funny-gif-18061291`,
            ` Cock and ball torture From Wikipedia, the free encyclopedia at en.wikipedia.org
            
Cock and ball torture (CBT) is a sexual activity involving application of pain or constriction to the male genitals. This may involve directly painful activities, such as genital piercing, wax play, genital spanking, squeezing, ball-busting, genital flogging, urethral play, tickle torture, erotic electrostimulation or even kicking. The recipient of such activities may receive direct physical pleasure via masochism, or knowledge that the play is pleasing to a sadistic dominant.`,
            `Own a musket for home defense, since that's what the founding fathers intended. Four ruffians break into my house. "What the devil?" As I grab my powdered wig and Kentucky rifle. Blow a golf ball sized hole through the first man, he's dead on the spot. Draw my pistol on the second man, miss him entirely because it's smoothbore and nails the neighbors dog. I have to resort to the cannon mounted at the top of the stairs loaded with grape shot, "Tally ho lads" the grape shot shreds two men in the blast, the sound and extra shrapnel set off car alarms. Fix bayonet and charge the last terrified rapscallion. He Bleeds out waiting on the police to arrive since triangular bayonet wounds are impossible to stitch up. Just as the founding fathers intended.`,
            `https://tenor.com/view/madagascar-eyebrows-eyes-ya-sexy-son-of-a-bitch-gif-17798088`,
            `https://tenor.com/view/larry-curly-moe-three-stooges-gif-11650174`,
            `I used to work as a programmer for autocorrect….

            Then they fried me for no raisin.`,
            `    Why do programmers like dark mode?

Because light attracts bugs.`,
            `What do programmers do when they’re hungry?

They grab a byte.`,
            `    Why couldn’t the programmer dance to the song?

Because he didn’t get the… algo-rhythm…`,
            `Oh look at the cute bottom, aren't you such a good bottom!`
        ]
        
        if (message.content == "<@730123783557480545>") {
            var phrase = phrases[Math.floor(Math.random()*phrases.length)];
            message.reply(phrase);
            return;
        }
    }
});

client.login(config.discord.token);
