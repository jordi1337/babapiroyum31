const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const noblox = require('noblox.js');
const config = require('./config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rütbe-rd')
        .setDescription('Bir kişiye rd ver (rütbesini düşür)')
        .addStringOption(option => 
            option.setName('kişi')
                .setDescription('Rütbesi düşürülecek kişi, Roblox adını yaz')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('sebep')
                .setDescription('Rütbelendirme sebebi, zorunlu. 3-300 karakter arası olmalıdır')
                .setRequired(true)
        ),
    
    async execute(interaction) {
        const allowedRoleId = "1330249838297747547";
        if (!interaction.member.roles.cache.has(allowedRoleId)) {
            return interaction.reply({
                content: "Bu komutu kullanmak için yetkin yok!",
                ephemeral: true,
            });
        }

        const robloxUsername = interaction.options.getString('isim');
        const reason = interaction.options.getString('sebep');

        try {
            await interaction.deferReply();

            await noblox.setCookie(config.ROBLOX_COOKIE);

            const userId = await noblox.getIdFromUsername(robloxUsername);
            if (!userId) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('Hata!')
                    .setDescription(`Kullanıcı adı **${robloxUsername}** bulunamadı.`)
                    .setFooter({ text: 'Lütfen doğru bir kullanıcı adı girin.' });
                return interaction.editReply({ embeds: [errorEmbed] });
            }

            const roles = await noblox.getRoles(config.ROBLOX_GROUP_ID);
            const userCurrentRole = await noblox.getRankInGroup(config.ROBLOX_GROUP_ID, userId);
            const currentRole = roles.find(role => role.rank === userCurrentRole);

            const sortedRoles = roles.sort((a, b) => b.rank - a.rank);
            const currentRoleIndex = sortedRoles.findIndex(role => role.rank === currentRole.rank);
            const prevRole = sortedRoles[currentRoleIndex + 1];

            if (!prevRole) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('Hata!')
                    .setDescription(`**${robloxUsername}** kullanıcısının bir alt rütbesi bulunamadı.`)
                    .setFooter({ text: 'Bu kullanıcı zaten en düşük rütbeye sahip.' });
                return interaction.editReply({ embeds: [errorEmbed] });
            }

            await noblox.setRank(config.ROBLOX_GROUP_ID, userId, prevRole.rank);

            const successEmbed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('İşlemler Tamamlandı')
                .setDescription(
                    `**${robloxUsername} (${userId})** isimli kişi **${currentRole.name}** rütbesinden **${prevRole.name}** rütbesine tenzil edildi.\n\nSebep: ${reason}`
                );
            await interaction.editReply({ embeds: [successEmbed] });

            const logEmbed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('Tenzil Edildi')
                .setDescription(
                    `**${robloxUsername} (${userId})** isimli kişi **${currentRole.name}** rütbesinden **${prevRole.name}** rütbesine tenzil edildi.\n\nSebep: ${reason}`
                );
            const logChannel = await interaction.client.channels.fetch(config.LOG_CHANNEL_ID3);
            if (logChannel) {
                logChannel.send({ embeds: [logEmbed] });
            }

        } catch (error) {
            console.error('Tenzil hatası:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Hata!')
                .setDescription('Tenzil işlemi sırasında bir hata oluştu. Lütfen tekrar deneyin.')
                .setFooter({ text: 'Hata devam ederse sistem yöneticisine başvurun.' });
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },
};