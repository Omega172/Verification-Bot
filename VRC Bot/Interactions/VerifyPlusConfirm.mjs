import Config from "./../Config.json" assert { type: 'json' }
import { TOTP } from "totp-generator";
import VRChat from 'vrchat'

export var Name = "VerifyPlusConfirm";

export async function Run(Interaction) {
    function SendErrorMessage(Message) {
        console.log(Message);
        const Channel = Interaction.client.channels.cache.get(Config.Discord.ErrorsID);
        if (Channel) {
            Channel.send(Message);
        }
    }
    await Interaction.deferReply({ephemeral: false });

    if (!Interaction.member.roles.cache.some(Role => Config.Discord.StaffRoles.includes(Role.id))) {
        SendErrorMessage(`This dumbass <@${Interaction.member.id}> probably tried to verify their self LMFAO!!`);
        return Interaction.editReply({ content: `You do not have the perms needed to verify users`, ephemeral: true });
    }

    if (Interaction.message.embeds[0].fields.length < 3) {
        return Interaction.editReply({ content: `User has not provided the needed information to auto verify`, ephemeral: true });
    }
    
    const Credentials = new VRChat.Configuration({
        username: Config.Auth.Username,
        password: Config.Auth.Password,
        baseOptions: {
            headers: {
                "User-Agent": Config.Auth.UserAgent,
            }
        }
    });
    
    function GetOTP() {
        const { OTP } = TOTP.generate(Config.Auth.TOTPSecret);
        return OTP;
    }
    
    async function GetSession() {
        const AuthAPI = new VRChat.AuthenticationApi(Credentials);
    
        const Res = await AuthAPI.getCurrentUser();
        if (Res.status == 200) {
            if (Res.data.requiresTwoFactorAuth) {
                const OTP = GetOTP();
                console.log(`Attempting 2FA OTP: ${OTP}`);
                const auth = await AuthAPI.verify2FA({ code: OTP });
                if (auth.status == 200) {
                    console.log("2FA auth sucessfull!");
                } else {
                    console.log(`2FA auth failed: ${auth.status}`);
                    return null;
                }
            }
    
            return AuthAPI;
        } else {
            console.log(`Pre-2FA auth failed: ${Res.status}`)
        }
    
        return null;
    }

    const Session = await GetSession();
    if (!Session) {
        console.log("Failed to get session bailing out");
        return Interaction.editReply({ content: `Error: Failed to grant VRC perms I might be rate limited`, ephemeral: false });
    }
    
    const GroupsAPI = new VRChat.GroupsApi(Credentials);
    let Res = await GroupsAPI.getGroupMember(Config.Group.ID, Interaction.message.embeds[0].fields[2].value);
    if (Res.data == null) {
        try {
            const Res = await GroupsAPI.createGroupInvite(Config.Group.ID, { userId: `${Interaction.message.embeds[0].fields[2].value}`, confirmOverrideBlock: false});
            if (Res.status == 200) {
                return Interaction.editReply({ content: `Error: Could not find the user in the group they have been invited please retry when they have joined`, ephemeral: false });
            }

            return Interaction.editReply({ content: `Error: Could not find the user in the group, and I was unable to invite them please try again when they have joined`, ephemeral: false });
        } catch(Error) {
            console.log(`Error: ${Error}`);
            return Interaction.editReply({ content: `Error: VRC API could not retrieve user`, ephemeral: false });
        }
    }

    if (Res.status == 200 && Res.data.membershipStatus == 'invited') {
        return Interaction.editReply({ content: `Error: The user has already been invited to the group please try again when they have joined`, ephemeral: false });
    }

    Res = await GroupsAPI.addGroupMemberRole(Config.Group.ID, Interaction.message.embeds[0].fields[2].value, Config.Group.RoleID);
    if (Res.status != 200) {
        console.log("Failed to get session bailing out");
        return Interaction.editReply({ content: `Error: Failed to grant VRC perms I might be rate limited`, ephemeral: false });
    }

    const UsersAPI = new VRChat.UsersApi(Credentials);
    Res = await UsersAPI.getUser(Interaction.message.embeds[0].fields[2].value);
    if (Res.status != 200) {
        console.log("Failed to get session bailing out");
        return Interaction.editReply({ content: `Error: Failed to grant VRC perms I might be rate limited`, ephemeral: false });
    }

    let User = null;
    const AllMembers = await Interaction.guild.members.fetch();
    AllMembers.forEach(Member => {
        if (Member.id == Interaction.message.embeds[0].fields[0].value) {
            User = Member;
        }
    });

    if (!User) {
        return Interaction.editReply({ content: `Failed to get handle to user, their roles in the discord were not updated`, ephemeral: true });
    } else {
        User.roles.add(Config.Discord.VerifiedRoles[0]);
        User.roles.add(Config.Discord.VerifiedRoles[1]);
        
        const hasUnverifiedRole = User.roles.cache.some(r => Config.discord.unverifiedRoles.includes(r.id));
        if (hasUnverifiedRole) {
            User.roles.remove(Config.discord.unverifiedRoles[0]);
        }
    }

    try {
        await User.setNickname(Res.data.displayName);
    } catch(Error) {
        console.log(`Error: ${Error}`);
        return Interaction.editReply({ content: `User verified but I failed to change the users nickname`, ephemeral: true });
    }

    return Interaction.editReply({ content: `Ok the user has been verified!`, ephemeral: false });
}