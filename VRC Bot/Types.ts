import { CacheType, ChatInputCommandInteraction, ButtonInteraction, SlashCommandBuilder, ModalSubmitInteraction, Client, Collection } from 'discord.js';
import Loki from 'lokijs';
import VRChat from 'vrchat';

export type ModalInteractionType = {
    Run(Discord: DiscordType, Interaction: ModalSubmitInteraction<CacheType>): Promise<void>
    IDs: string[]
}

export type ButtonInteractionType = {
    Run(Discord: DiscordType, Interaction: ButtonInteraction<CacheType>): Promise<void>
    IDs: string[] // Ment to be used for confirmation prompts
};

export type CommandInteractionType = {
    Run(Discord: DiscordType, Interaction: ChatInputCommandInteraction): Promise<void>
    Data: SlashCommandBuilder
};

export type DiscordType = {
    Client: Client
    Config: Config
    Database: Loki
    Interactions: {
        ModalInteractions: Collection<string, ModalInteractionType>
        ButtonInteractions: Collection<string, ButtonInteractionType>
        CommandInteractions: Collection<string, CommandInteractionType>
    },
    LogMessage: (Message: string, Error?: boolean) => void
    Credentials: VRChat.Configuration
    GetOTP: () => string
    GetSession: (Interaction?: ButtonInteraction<CacheType>) => Promise<VRChat.AuthenticationApi | null>
}

export type Config = {
    DevID: string

    Token: string
    AppID: string
    InviteLink: string

    ServerID: string

    LogChannelID: string

    TicketCategoryID: string
    TranscriptsChannelID: string

    StaffRoleIDs: string[]

    VerifiedPlusRoleID: string
    UnverifiedRoleID:string 

    VRChat: {
        TOTPSecret: string

        Username: string
        Password: string
        
        UserAgent: string

        GroupID: string
        GroupRoleID: string
    }
}

export type Package = {
    name: string
    version: string
    description: string
    main: string
    types: string
    scripts: {
        [key: string]: string
    }
    author: string
    license: string
    type: string
    dependencies: {
        [key: string]: string
    }
    devDependencies: {
        [key: string]: string
    }
}

export type Edit = {
    Content: string
    HasAttachment: boolean
    NumAttachments: number
    Timestamp: number
}

export type MsgType = {
    SenderID: string
    Content: string
    HasAttachment: boolean
    NumAttachments: number
    ID: string
    Edited: boolean
    Edits: Edit[]
    Deleted: boolean
    Timestamp: number
}

export type Ticket = {
    UserID: string
    ChannelID: string
    Open: boolean
    VRChatProfileLink: string | null
    VRChatID: string | null
    VerificationType: string | null
    StaffMember: string | null
    Messages: MsgType[]
    Embed: string
    Timestamp: number
    UnclaimTimestamp: number | null
}

export type VerifyConfig = {
    IsUnverified: boolean
    IsVerified: boolean

    IsStaff: boolean
    
    VerifyPlus: boolean
}

export type SessionType = {
    Name: string
    Value: VRChat.AuthenticationApi | null;
}