const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const noblox = require('noblox.js');
const config = require('./config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rütbe-terfi')
        .setDescription('Bir kişiye terfi ver')
        .addStringOption(option => 
            option.setName('kişi')
                .setDescription('Terfi verilecek kişi, Roblox adını yaz')
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

        const username = interaction.options.getString('kişi');
        const reason = interaction.options.getString('sebep');

        try {
            await noblox.setCookie(config.ROBLOX_COOKIE);

            const userId = await noblox.getIdFromUsername(username);
            if (!userId) {
                return interaction.reply({
                    content: `Kullanıcı adı **${username}** bulunamadı.`,
                    ephemeral: false
                });
            }

            const roles = await noblox.getRoles(config.ROBLOX_GROUP_ID);
            const userCurrentRole = await noblox.getRankInGroup(config.ROBLOX_GROUP_ID, userId);
            
            const currentRoleIndex = roles.findIndex(role => role.rank === userCurrentRole);
            if (currentRoleIndex === -1) {
                return interaction.reply({
                    content: `**${username}** kullanıcısının mevcut rütbesi bulunamadı.`,
                    ephemeral: false
                });
            }

            const nextRole = roles[currentRoleIndex + 1];
            if (!nextRole) {
                return interaction.reply({
                    content: `**${username}** kullanıcısının bir üst rütbesi bulunamadı.`,
                    ephemeral: false
                });
            }

            await noblox.setRank(config.ROBLOX_GROUP_ID, userId, nextRole.rank);

            const successEmbed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('İşlemler Tamamlandı')
                .setDescription(
                    `**${username} (${userId})** isimli kişiye **${nextRole.name}** rütbe terfisi başarıyla verildi.\n\nSebep: ${reason}`
                );

            const logEmbed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('Terfi Verildi')
                .setDescription(
                    `**${interaction.user.username}** isimli yetkili, **${username} (${userId})** isimli kişiye **${nextRole.name}** rütbesine terfi etti.\n\nSebep: ${reason}`
                );

            const logChannel = await interaction.client.channels.fetch(config.LOG_CHANNEL_ID2);
            if (logChannel) {
                logChannel.send({ embeds: [logEmbed] });
            }

            return interaction.reply({
                embeds: [successEmbed],
                ephemeral: false
            });

        } catch (error) {
            return interaction.reply({
                content: 'Terfi işlemi sırasında bir hata oluştu. Lütfen tekrar deneyin.',
                ephemeral: false
            });
        }
    },
};