import { CacheType, ButtonInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle, Message, ChannelType, EmbedBuilder, GuildMember, MessageActionRowComponent, AttachmentBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { DiscordType, SessionType, Ticket, VerifyConfig } from '../../Types.js';
import VRChat from 'vrchat'

async function Verify(Discord: DiscordType, Interaction: ButtonInteraction<CacheType>, Config: VerifyConfig) {
    if (!Config.IsStaff) {
        Discord.LogMessage(`<@${Interaction.user.id}> probably tried to verify themself LMFAO!`);
        return Interaction.reply({ content: 'You do not have the permissions to verify users', ephemeral: true });
    }

    const Tickets = Discord.Database.getCollection<Ticket>('Tickets');
    const Result: (Ticket & LokiObj)[] = Tickets.where((Ticket) => {
        return Ticket.ChannelID == Interaction.channelId && Ticket.Open;
    });

    if (!Result.length || !Result[0].VRChatID) {
        return Interaction.reply( {content: `There was an error, somehow this ticket does not exist :)`, ephemeral: true });;
    }

    const AuthAPI = await Discord.GetSession(Interaction);
    if (AuthAPI == null) {
        return Interaction.reply({ content: `Failed to authenticate with VRChat API`, ephemeral: true });
    }

    const GroupsAPI = new VRChat.GroupsApi(Discord.Credentials);
    try {
        let MemberResponse = await GroupsAPI.getGroupMember(Discord.Config.VRChat.GroupID, Result[0].VRChatID);
        if (MemberResponse.status != 200) {
            return Interaction.reply({ content: `Failed to get group member data from VRChat API`, ephemeral: true });
        }

        if (MemberResponse.data == null) {
            try {
                const InviteResponse = await GroupsAPI.createGroupInvite(Discord.Config.VRChat.GroupID, { userId: Result[0].VRChatID, confirmOverrideBlock: false });
                if (InviteResponse.status != 200) {
                    return Interaction.reply({ content: `Failed to send invite using the VRChat API`, ephemeral: true });
                }
                
                return Interaction.reply({ content: `<@${Result[0].VRChatID}> you have been invited to the group, please let staff know when you have accepted the invite.`, ephemeral: true });
            } catch(Error: any) {
                console.log(Error);
                return Interaction.reply({ content: `Failed to send invite using the VRChat API`, ephemeral: true });
            }
        }

        if (MemberResponse.status == 200 && MemberResponse.data.membershipStatus == 'invited') {
            return Interaction.reply({ content: `The user has already been invited to the group please try again when they have joined`, ephemeral: false });
        }

        if (Config.VerifyPlus) {
            try {
                const AddRoleResponse = await GroupsAPI.addGroupMemberRole(Discord.Config.VRChat.GroupID, Result[0].VRChatID, Discord.Config.VRChat.GroupRoleID);
                if (AddRoleResponse.status != 200) {
                    return Interaction.reply({ content: `Failed to edit user roles using the VRChat API`, ephemeral: true });
                }
            } catch (Error: any) {
                console.log(Error);
                return Interaction.reply({ content: `Failed to edit user roles using the VRChat API`, ephemeral: true });
            }
        }
    } catch (Error: any) {
        console.error(Error);
        return Interaction.reply({ content: `Failed to get group member data from VRChat API`, ephemeral: true });
    }

    const UsersAPI = new VRChat.UsersApi(Discord.Credentials);
    try {
        const UserResponse = await UsersAPI.getUser(Result[0].VRChatID);
        if (UserResponse.status != 200) {
            return Interaction.reply({ content: `Failed to get user data from VRChat API`, ephemeral: true });
        }

        const GuildMembers = await Interaction.guild?.members.fetch();
        if (!GuildMembers) {
            return Interaction.reply({ content: `Failed to fetch guild members collection`, ephemeral: true });
        }

        const User = GuildMembers.find((Member) => {
            return Member.id == Result[0].UserID;
        })
        if (!User) {
            return Interaction.reply({ content: `Failed to get discord user data for <@${Result[0].UserID}>`, ephemeral: true });
        }

        if (!Config.IsVerified) {
            await User.roles.add(Discord.Config.VerifiedRoleID);
        }

        if (Config.VerifyPlus) {
            await User.roles.add(Discord.Config.VerifiedPlusRoleID);
        }

        if (Config.IsUnverified) {
            await User.roles.remove(Discord.Config.UnverifiedRoleID);
        }

        try {
            await User.setNickname(UserResponse.data.displayName);
        } catch (Error: any) {
            Result[0].VerificationType = (Config.VerifyPlus) ? "Verified Plus" : "Verified";
            Tickets.update(Result);

            const Message: Message = await Interaction.message.channel.messages.fetch(Result[0].Embed);
            if (!Message) {
                Interaction.reply('There was an error, DID SOMEONE DELETE THE EMBED!!!');
            }

            const Embed = EmbedBuilder.from(Message.embeds[0]);
            const Component: MessageActionRowComponent | undefined = Message.components[0].components.find((Component, Index) => {
                if (Component.customId == 'Verify') {
                    return true;
                }
            });
            if (Component) {
                const Index = Message.components[0].components.indexOf(Component);
                Message.components[0].components.splice(Index, 1);
            }

            if (Config.VerifyPlus) {
                const Component2: MessageActionRowComponent | undefined = Message.components[0].components.find((Component, Index) => {
                    if (Component.customId == 'VerifyPlus') {
                        return true;
                    }
                });
                if (Component2) {
                    const Index = Message.components[0].components.indexOf(Component2);
                    Message.components[0].components.splice(Index, 1);
                }
            }

            Message.edit({ content: Message.content, components: Message.components, embeds: [Embed] });

            return Interaction.reply({ content: `<@${Result[0].UserID}> has been verified, but I failed to change their nickname to ${UserResponse.data.displayName}`, ephemeral: false });
        }

    } catch (Error: any) {
        console.log(Error);
        return Interaction.reply({ content: `Failed to get user data from VRChat API`, ephemeral: true });
    }

    Result[0].VerificationType = (Config.VerifyPlus) ? "Verified Plus" : "Verified";
    Tickets.update(Result);

    const Message: Message = await Interaction.message.channel.messages.fetch(Result[0].Embed);
    if (!Message) {
        Interaction.reply('There was an error, DID SOMEONE DELETE THE EMBED!!!');
    }

    const Embed = EmbedBuilder.from(Message.embeds[0]);
    const Component: MessageActionRowComponent | undefined = Message.components[0].components.find((Component, Index) => {
        if (Component.customId == 'Verify') {
            return true;
        }
    });
    if (Component) {
        const Index = Message.components[0].components.indexOf(Component);
        Message.components[0].components.splice(Index, 1);
    }

    if (Config.VerifyPlus) {
        const Component2: MessageActionRowComponent | undefined = Message.components[0].components.find((Component, Index) => {
            if (Component.customId == 'VerifyPlus') {
                return true;
            }
        });
        if (Component2) {
            const Index = Message.components[0].components.indexOf(Component2);
            Message.components[0].components.splice(Index, 1);
        }
    }

    Message.edit({ content: Message.content, components: Message.components, embeds: [Embed] });

    return Interaction.reply({ content: `<@${Result[0].UserID}> has been verified`, ephemeral: false });
}

export async function Run(Discord: DiscordType, Interaction: ButtonInteraction<CacheType>) {
    if (!Interaction.member) {
        console.error(`Ticket.ts Unreachable ID[0]: ${Interaction.customId}`);
        Discord.LogMessage(`Ticket.ts Unreachable ID[0]: ${Interaction.customId}`, true);
        return Interaction.reply( {content: 'How did you get here, what the fuck?', ephemeral: true });
    }

    var HasStaff: boolean = (Interaction.member as GuildMember).roles.cache.some(Role => Discord.Config.StaffRoleIDs.includes(Role.id));

    var Unverified: boolean = false;
    var Verified: boolean = false;

    const Tickets = Discord.Database.getCollection<Ticket>('Tickets');
    const Result: (Ticket & LokiObj)[] = Tickets.where((Ticket) => {
        return Ticket.ChannelID == Interaction.channelId&& Ticket.Open;
    });

    if (Result.length) {
        const GuildMembers = await Interaction.guild?.members.fetch();
        if (!GuildMembers) {
            return Interaction.reply({ content: `Failed to fetch guild members collection`, ephemeral: true });
        }

        const Member = GuildMembers.find((GuildMember) => { return GuildMember.id == Result[0].UserID; })
        if (!Member) {
            return Interaction.reply({ content: `Failed to get discord user data for <@${Result[0].UserID}>`, ephemeral: true });
        }

        Member.roles.cache.forEach((Role) => {
            if (Role.id == Discord.Config.UnverifiedRoleID) {
                Unverified = true;
            }

            if (Role.id == Discord.Config.VerifiedRoleID) {
                Verified = true;
            }
        });
    }

    if (Interaction.customId == IDs[0]) { // TicketCreate
        if (Result.length) {
            return Interaction.reply( {content: `You already have a ticket open: <#${Result[0].ChannelID}>`, ephemeral: true });;
        }

        if ((Interaction.member as GuildMember).roles.cache.some(Role => Role.id == Discord.Config.VerifiedPlusRoleID)) {
            return Interaction.reply({ content: `You are already fully verified`, ephemeral: true });
        }

        let Channel = await Interaction.guild?.channels.create({
            name: Interaction.user.displayName,
            type: ChannelType.GuildText,
            parent: Discord.Config.TicketCategoryID
        });
        if (!Channel) {
            return Interaction.reply({content: `Failed to create the ticket channel`});
        }
        Channel.permissionOverwrites.create(Interaction.user.id, { ViewChannel: true });

        const TicketEmbed = new EmbedBuilder()
            .setColor(0x00ffff)
            .setTitle('Verification Ticket Controls')
            .addFields({ name: 'User', value: `<@${Interaction.user.id}>` })
            .setTimestamp()
            .setFooter({ text: 'Made by Omega172', iconURL: Interaction.user.displayAvatarURL() })

        const BeginButton = new ButtonBuilder()
            .setCustomId('BeginVerification')
            .setLabel('Begin Verification')
            .setStyle(ButtonStyle.Primary);

        const VerifyButton = new ButtonBuilder()
            .setCustomId('Verify')
            .setLabel('Verify User')
            .setStyle(ButtonStyle.Secondary)

        const VerifyPlusButton = new ButtonBuilder()
            .setCustomId('VerifyPlus')
            .setLabel('Verify Plus User')
            .setStyle(ButtonStyle.Secondary);

        const ClaimTicketButton = new ButtonBuilder()
            .setCustomId('TicketClaim')
            .setLabel('Claim Ticket')
            .setStyle(ButtonStyle.Success);

        const CloseTicketButton = new ButtonBuilder()
            .setCustomId('TicketClose')
            .setLabel('Close Ticket')
            .setStyle(ButtonStyle.Danger);

        const Row: ActionRowBuilder<ButtonBuilder> = new ActionRowBuilder<ButtonBuilder>();
        if (!(Interaction.member as GuildMember).roles.cache.some(Role => Role.id == Discord.Config.VerifiedRoleID)) {
            Row.addComponents(BeginButton, VerifyButton, VerifyPlusButton, ClaimTicketButton, CloseTicketButton);
        } else {
            Row.addComponents(BeginButton, VerifyPlusButton, ClaimTicketButton, CloseTicketButton);
        }

        const Message = await Channel.send({ embeds: [TicketEmbed], components: [Row] });
        Channel.send(`Hello, <@${Interaction.user.id}> please press the \`Begin Verification\` button to start.`);

        const Ticket: Ticket = {
            UserID: Interaction.user.id,
            ChannelID: Channel.id,
            Open: true,
            VRChatProfileLink: null,
            VRChatID: null,
            VerificationType: null,
            StaffMember: null,
            Messages: [],
            Embed: Message.id,
            Timestamp: Date.now()
        }
        Tickets.insert(Ticket);

        return Interaction.reply({ content: `Ticket created: <#${Channel.id}>`, ephemeral: true});
    }

    if (Interaction.customId == IDs[1]) { // TicketClaim
        if (!HasStaff) {
            return Interaction.reply({ content: 'You do not have the permissions to claim a ticket', ephemeral: true });
        }

        if (!Result.length) {
            return Interaction.reply( {content: `There was an error, somehow this ticket does not exist :)`, ephemeral: true });;
        }

        if (Result[0].StaffMember != null) {
            return Interaction.reply({ content: `Ticket already clamed by <@${Result[0].StaffMember}>`, ephemeral: true });
        }

        const Message: Message = await Interaction.message.channel.messages.fetch(Result[0].Embed);
        if (!Message) {
            Interaction.reply('There was an error, DID SOMEONE DELETE THE EMBED!!!');
        }

        const Embed = EmbedBuilder.from(Message.embeds[0]).addFields({ name: 'Staff Member', value: `<@${Interaction.user.id}>` });
        const Component: MessageActionRowComponent | undefined = Message.components[0].components.find((Component, Index) => {
            if (Component.customId == 'TicketClaim') {
                return true;
            }
        });
        if (Component) {
            const Index = Message.components[0].components.indexOf(Component);
            Message.components[0].components.splice(Index, 1);
        }

        Message.edit({ content: Message.content, components: Message.components, embeds: [Embed] });

        Result[0].StaffMember = Interaction.user.id;
        Tickets.update(Result);
        return Interaction.reply( {content: 'Ticket claimed!', ephemeral: true })
    }

    if (Interaction.customId == IDs [2]) { // TicketClose
        if (!Result.length) {
            return Interaction.reply( {content: `There was an error, somehow this ticket does not exist :)`, ephemeral: true });;
        }

        if (Result[0].StaffMember != null && (Interaction.user.id != (Result[0].StaffMember || Result[0].UserID))) {
            return Interaction.reply({ content: `Only <@${Result[0].StaffMember}> or <@${Result[0].UserID}> can close this ticket`, ephemeral: true });
        }

        if (!Discord.Config.TranscriptsChannelID) {
            return Interaction.reply({ content: 'Could not find transcript the channel', ephemeral: true });
        }

        const Embed = new EmbedBuilder()
            .setColor(0x00FFFF)
            .setTitle('Confirm')
            .addFields(
                { name: 'Are you sure?', value: `Close ticket verify <@${Result[0].UserID}>`},
            )
            .setTimestamp()
            .setFooter({ text: 'Made by Omega172', iconURL: Interaction.user.displayAvatarURL() });

        const ConfirmButton = new ButtonBuilder()
            .setCustomId('TicketCloseConfirm')
            .setLabel('Confirm')
            .setStyle(ButtonStyle.Danger);

        const CancelButton = new ButtonBuilder()
            .setCustomId('TicketCloseCancel')
            .setLabel('Cancel')
            .setStyle(ButtonStyle.Success);

        const Row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(ConfirmButton, CancelButton);

        return Interaction.reply({ embeds: [Embed], components: [Row] });
    }

    if (Interaction.customId == IDs[3]) { // TicketCloseConfirm
        if (!Result.length) {
            return Interaction.reply( {content: `There was an error, somehow this ticket does not exist :)`, ephemeral: true });;
        }

        if (Result[0].StaffMember != null && (Interaction.user.id != (Result[0].StaffMember || Result[0].UserID))) {
            return Interaction.reply({ content: `Only <@${Result[0].StaffMember}> or <@${Result[0].UserID}> can close this ticket`, ephemeral: true });
        }

        if (!Discord.Config.TranscriptsChannelID) {
            return Interaction.reply({ content: 'Could not find transcript the channel', ephemeral: true });
        }

        const Embed = new EmbedBuilder()
            .setColor(0x00FFFF)
            .setTitle('Transcript')
            .addFields(
                { name: 'Staff Member', value: `${(Result[0].StaffMember != null) ? `<@${Result[0].StaffMember}>` : "Ticket not claimed"}`},
                { name: 'User', value: `<@${Result[0].UserID}>`},
                { name: 'User VRChat Link', value: (Result[0].VRChatProfileLink != null) ? Result[0].VRChatProfileLink : "Profile link not provided"},
                { name: 'Verification Type', value: (Result[0].VerificationType != null) ? Result[0].VerificationType : "Not Verified" }
            )
            .setTimestamp()
            .setFooter({ text: 'Made by Omega172', iconURL: Interaction.user.displayAvatarURL() })

        const Channel = Discord.Client.channels.cache.get(Discord.Config.TranscriptsChannelID);

        const Attachment = new AttachmentBuilder(Buffer.from(JSON.stringify(Result[0], null, 4)))
            .setName(`Ticket_${Result[0].UserID}_${Result[0].$loki}.json`);

        if (Channel && Channel.isTextBased()) {
            Channel.send({ embeds: [Embed], files: [Attachment]});
        }

        Result[0].Open = false;
        Tickets.update(Result);

        Interaction.channel?.delete();
        return Interaction.reply(`Done!`);
    }

    if (Interaction.customId == IDs[4]) { // TicketCloseCancel
        Interaction.message.delete();

        return Interaction.reply({ content: 'Ticket close canceled', ephemeral: true });
    }

    if (Interaction.customId == IDs[5]) { // BeginVerification
        if (!Result.length) {
            return Interaction.reply( {content: `There was an error, somehow this ticket does not exist :)`, ephemeral: true });;
        }

        const Modal = new ModalBuilder()
            .setCustomId('BeginVerificationModal')
            .setTitle('Verification');

        const LinkInput = new TextInputBuilder()
            .setCustomId('ProfileLink')
            .setLabel("Please input your VRChat profile link")
            .setStyle(TextInputStyle.Short);

        const Row = new ActionRowBuilder<TextInputBuilder>()
            .addComponents(LinkInput);

        Modal.addComponents(Row);
        await Interaction.showModal(Modal);
        return;
    }

    if (!Result.length) {
        return Interaction.reply( {content: `There was an error, somehow this ticket does not exist :)`, ephemeral: true });;
    }

    if (!HasStaff) {
        return Interaction.reply({ content: 'You do not have the permissions to verify users', ephemeral: true });
    }

    if (Result[0].VRChatID == null) {
        return Interaction.reply({ content: `The user must begin their verifiction before you can verify them`, ephemeral: true });
    }

    if (Result[0].StaffMember == null) {
        return Interaction.reply({ content: `The ticket must be claimed before you can verify this user`, ephemeral: true });
    }

    if (Result[0].StaffMember != Interaction.user.id) {
        return Interaction.reply({ content: `Only <@${Result[0].StaffMember}> can verify this user`, ephemeral: true });
    }

    if (Interaction.customId == IDs[6]) { // Verify
        const Embed = new EmbedBuilder()
            .setColor(0x00FFFF)
            .setTitle('Confirm')
            .addFields(
                { name: 'Are you sure?', value: `Verify <@${Result[0].UserID}>`},
            )
            .setTimestamp()
            .setFooter({ text: 'Made by Omega172', iconURL: Interaction.user.displayAvatarURL() });

        const ConfirmButton = new ButtonBuilder()
            .setCustomId('VerifyConfirm')
            .setLabel('Confirm')
            .setStyle(ButtonStyle.Danger);

        const CancelButton = new ButtonBuilder()
            .setCustomId('VerifyCancel')
            .setLabel('Cancel')
            .setStyle(ButtonStyle.Success);

        const Row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(ConfirmButton, CancelButton);

        return Interaction.reply({ embeds: [Embed], components: [Row] });
    }

    if (Interaction.customId == IDs[7]) { // VerifyConfirm
        await Verify(Discord, Interaction, { IsUnverified: Unverified, IsVerified: Verified, IsStaff: HasStaff, VerifyPlus: false });

        Interaction.message.delete();
        if (Interaction.isRepliable() && !Interaction.replied) {
            return Interaction.reply({ content: 'How did you get here?', ephemeral: true });
        } else {
            return;
        }
    }

    if (Interaction.customId == IDs[8]) { // VerifyCancel
        Interaction.message.delete();

        return Interaction.reply({ content: 'Verify user canceled', ephemeral: true });
    }

    if (Interaction.customId == IDs[9]) { // VerifyPlus
        const Embed = new EmbedBuilder()
            .setColor(0x00FFFF)
            .setTitle('Confirm')
            .addFields(
                { name: 'Are you sure?', value: `Verify Plus <@${Result[0].UserID}>`},
            )
            .setTimestamp()
            .setFooter({ text: 'Made by Omega172', iconURL: Interaction.user.displayAvatarURL() });

        const ConfirmButton = new ButtonBuilder()
            .setCustomId('VerifyPlusConfirm')
            .setLabel('Confirm')
            .setStyle(ButtonStyle.Danger);

        const CancelButton = new ButtonBuilder()
            .setCustomId('VerifyPlusCancel')
            .setLabel('Cancel')
            .setStyle(ButtonStyle.Success);

        const Row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(ConfirmButton, CancelButton);

        return Interaction.reply({ embeds: [Embed], components: [Row] });
    }

    if (Interaction.customId == IDs[10]) { // VerifyPlusConfirm
        await Verify(Discord, Interaction, { IsUnverified: Unverified, IsVerified: Verified, IsStaff: HasStaff, VerifyPlus: true });

        Interaction.message.delete();
        if (Interaction.isRepliable() && !Interaction.replied) {
            return Interaction.reply({ content: 'How did you get here?', ephemeral: true });
        } else {
            return;
        }
    }

    if (Interaction.customId == IDs[11]) { // VerifyPlusCancel
        Interaction.message.delete();

        return Interaction.reply({ content: 'Verify plus user canceled', ephemeral: true });
    }

    console.error(`Ticket.ts Unreachable ID[NULL]: ${Interaction.customId}`);
    Discord.LogMessage(`Ticket.ts Unreachable ID[NULL]: ${Interaction.customId}`, true);
    return Interaction.reply( {content: 'How did you get here, what the fuck?', ephemeral: true });
}

export const IDs: string[] = [
    "TicketCreate",
    "TicketClaim",
    "TicketClose",
    "TicketCloseConfirm",
    "TicketCloseCancel",
    "BeginVerification",
    "Verify",
    "VerifyConfirm",
    "VerifyCancel",
    "VerifyPlus",
    "VerifyPlusConfirm",
    "VerifyPlusCancel"
];