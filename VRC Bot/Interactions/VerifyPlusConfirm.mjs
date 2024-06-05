import config from "./../config.json" assert { type: 'json' }
import { TOTP } from "totp-generator";
import vrchat from 'vrchat'

export async function run(interaction) {
    function sendErrorMessage(msg) {
        const channel = client.channels.cache.get(config.discord.errorsID);
        if (channel) {
            channel.send(msg);
        }
    }
    await interaction.deferReply({ephemeral: true });

    if (!interaction.member.roles.cache.some(r => config.discord.staffRoles.includes(r.id))) {
        sendErrorMessage(`This dumbass <@${interaction.member.id}> probably tried to verify their self LMFAO!!`);
        return interaction.editReply({ content: `You do not have the perms needed to verify users`, ephemeral: true });
    }

    if (interaction.message.embeds[0].fields.length < 3) {
        return interaction.editReply({ content: `User has not provided the needed information to auto verify`, ephemeral: true });
    }
    
    const creds = new vrchat.Configuration({
        username: config.auth.Username,
        password: config.auth.Password,
        baseOptions: {
            headers: {
                "User-Agent": config.auth.UserAgent,
            }
        }
    });
    
    function getOTP() {
        const { otp } = TOTP.generate(config.auth.TOTPSecret);
    
        return otp;
    }
    
    async function getSession() {
        const authAPI = new vrchat.AuthenticationApi(creds);
    
        const res = await authAPI.getCurrentUser();
        if (res.status == 200) {
            if (res.data.requiresTwoFactorAuth) {
                const OTP = getOTP();
                console.log(`Attempting 2FA OTP: ${OTP}`);
                const auth = await authAPI.verify2FA({ code: OTP });
                if (auth.status == 200) {
                    console.log("2FA auth sucessfull!");
                } else {
                    console.log(`2FA auth failed: ${auth.status}`);
                    return null;
                }
            }
    
            return authAPI;
        } else {
            console.log(`Pre-2FA auth failed: ${res.status}`)
        }
    
        return null;
    }

    const session = await getSession();
    if (!session) {
        console.log("Failed to get session bailing out");
        return interaction.editReply({ content: `Error: Failed to grant VRC perms I might be rate limited`, ephemeral: false });
    }
    
    const groupsAPI = new vrchat.GroupsApi(creds);
    let res = await groupsAPI.getGroupMember(config.group.ID, interaction.message.embeds[0].fields[2].value);
    if (res.data == null) {
        try {
            const res = await groupsAPI.createGroupInvite(config.group.ID, { userId: `${interaction.message.embeds[0].fields[2].value}`, confirmOverrideBlock: false});
            if (res.status == 200) {
                return interaction.editReply({ content: `Error: Could not find the user in the group they have been invited please retry when they have joined`, ephemeral: false });
            }

            return interaction.editReply({ content: `Error: Could not find the user in the group, and I was unable to invite them please try again when they have joined`, ephemeral: false });
        } catch(err) {
            console.log(err);
            return interaction.editReply({ content: `Error: VRC API could not retrieve user`, ephemeral: false });
        }
    }

    if (res.status == 200 && res.data.membershipStatus == 'invited') {
        return interaction.editReply({ content: `Error: The user has already been invited to the group please try again when they have joined`, ephemeral: false });
    }

    res = await groupsAPI.addGroupMemberRole(config.group.ID, interaction.message.embeds[0].fields[2].value, config.group.RoleID);
    if (res.status != 200) {
        console.log("Failed to get session bailing out");
        return interaction.editReply({ content: `Error: Failed to grant VRC perms I might be rate limited`, ephemeral: false });
    }

    const usersAPI = new vrchat.UsersApi(creds);
    res = await usersAPI.getUser(interaction.message.embeds[0].fields[2].value);
    if (res.status != 200) {
        console.log("Failed to get session bailing out");
        return interaction.editReply({ content: `Error: Failed to grant VRC perms I might be rate limited`, ephemeral: false });
    }

    let user = null;
    const allMembers = await interaction.guild.members.fetch();
    allMembers.forEach(m => {
        if (m.id == interaction.message.embeds[0].fields[0].value) {
            user = m;
        }
    });

    if (!user) {
        return interaction.editReply({ content: `Failed to get handle to user, their roles in the discord were not updated`, ephemeral: true });
    } else {
        user.roles.add(config.discord.verifiedRoles[1]);
        
        const hasUnverifiedRole = user.roles.cache.some(r => config.discord.unverifiedRoles.includes(r.id));
        if (hasUnverifiedRole) {
            user.roles.remove(config.discord.unverifiedRoles[0]);
        }
    }

    try {
        await user.setNickname(res.data.displayName);
    } catch(error) {
        console.log(error)
        return interaction.editReply({ content: `User verified but I failed to change the users nickname`, ephemeral: true });
    }

    return interaction.editReply({ content: `Ok the user has been verified!`, ephemeral: false });
}