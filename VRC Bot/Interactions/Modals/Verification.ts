import { CacheType, ModalSubmitInteraction, Message, EmbedBuilder, MessageActionRowComponent } from 'discord.js';
import { DiscordType, Ticket } from '../../Types.js';
export async function Run(Discord: DiscordType, Interaction: ModalSubmitInteraction<CacheType>) {
    const Tickets = Discord.Database.getCollection<Ticket>('Tickets');
    const Result: (Ticket & LokiObj)[] = Tickets.where((Ticket) => {
        return Ticket.ChannelID == Interaction.channelId && Ticket.Open;
    });

    if (!Result.length) {
        return Interaction.reply( {content: `There was an error, somehow this ticket does not exist :)`, ephemeral: true });;
    }

    if (Interaction.customId == IDs[0]) {
        const ProfileLink: string = Interaction.fields.getTextInputValue('ProfileLink');
        if (ProfileLink.slice(0, ProfileLink.lastIndexOf("/")) != "https://vrchat.com/home/user") {
            return Interaction.reply({ content: `Please provide a valid link. Ex. \`https://vrchat.com/home/user/usr_eaa83ece-0d44-406c-99a2-879955bbc454\``, ephemeral: true });
        }

        Result[0].VRChatProfileLink = ProfileLink;

        const Tokens: string[] = ProfileLink.split("/");
        const ProfileID: string = Tokens[Tokens.length - 1];

        Result[0].VRChatID = ProfileID;

        Tickets.update(Result);

        if (!Interaction.channel) {
            return Interaction.reply('There was an error, Somehow the channel does not exist');
        }

        const Message: Message = await Interaction.channel.messages.fetch(Result[0].Embed);
        if (!Message) {
            Interaction.reply('There was an error, DID SOMEONE DELETE THE EMBED!!!');
        }

        const Embed = EmbedBuilder.from(Message.embeds[0])
        const Component: MessageActionRowComponent | undefined = Message.components[0].components.find((Component, Index) => {
            if (Component.customId == 'BeginVerification') {
                return true;
            }
        });
        if (Component) {
            const Index = Message.components[0].components.indexOf(Component);
            Message.components[0].components.splice(Index, 1);
        }

        Message.edit({ content: Message.content, components: Message.components, embeds: [Embed] });
        await Interaction.channel.send({ content: `Alright to finish the verification process you have three options:

Cross verify with one of these servers/platforms:
- LVC (Lewd VRC Collective)
- Red Light District
- Black Light District
- Verified Fansly
- Verified Pornhub

Send a picture of your ID on a piece of paper with the date, current time,  your discord/VRC name, and Inflicted Pleasures written on it. (Anything on the ID can be censored except DOB and security markings on the ID). **This option gets you the normal verified role, which lets everyone know you are 18+, but you cannot participate in events or access the IRL NSFW channels**

Send a selfie of you holding your ID on a piece of paper with the date, current time,  your discord/VRC name, and Inflicted Pleasures written on it next to your face. Your picture on your ID must be visible everything else can be Censored. **This option gets you the verified plus role, which allows you access to everything in the group and server including events**` });

        return Interaction.reply({ content: `Thanks for providing your profile link`, ephemeral: true });
    }

    console.error(`Verification.ts Unreachable ID[NULL]: ${Interaction.customId}`);
    Discord.LogMessage(`Verification.ts Unreachable ID[NULL]: ${Interaction.customId}`, true);
    return Interaction.reply( {content: 'How did you get here, what the fuck?', ephemeral: true });
}

export const IDs: string[] = [
    "BeginVerificationModal"
];