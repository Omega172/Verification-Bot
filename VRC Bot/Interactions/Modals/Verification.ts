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
        await Interaction.channel.send({ content: `Now to continue you need to choose one of the verification methods listed here: https://discord.com/channels/1179642958975348847/1265518498784743446/1265519207689490573 and follow the methods linked steps to provide the needed information.` });

        return Interaction.reply({ content: `Thanks for providing your profile link`, ephemeral: true });
    }

    console.error(`Verification.ts Unreachable ID[NULL]: ${Interaction.customId}`);
    Discord.LogMessage(`Verification.ts Unreachable ID[NULL]: ${Interaction.customId}`, true);
    return Interaction.reply( {content: 'How did you get here, what the fuck?', ephemeral: true });
}

export const IDs: string[] = [
    "BeginVerificationModal"
];