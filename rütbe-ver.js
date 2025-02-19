const { EmbedBuilder } = require('discord.js');
const noblox = require('noblox.js');
const config = require('./config.json');

module.exports = {
  execute: async (interaction) => {
    await interaction.deferReply();

    const allowedRoleId = config.ALLOWED_ROLE_ID;
    if (!interaction.member.roles.cache.has(allowedRoleId)) {
      return await interaction.editReply({
        content: "Bu komutu kullanmak için gerekli izne sahip değilsin!",
        ephemeral: true,
      });
    }

    try {
      const robloxUsername = interaction.options.getString('kişi');
      const newRole = interaction.options.getString('rütbe');
      const reason = interaction.options.getString('sebep');

      await noblox.setCookie(config.ROBLOX_COOKIE);

      const userId = await noblox.getIdFromUsername(robloxUsername);

      const roles = await noblox.getRoles(config.ROBLOX_GROUP_ID);
      
      const role = roles.find((r) => r.name.toLowerCase() === newRole.toLowerCase());
      
      if (!role) throw new Error('Belirtilen rütbe bulunamadı.');

      await noblox.setRank(config.ROBLOX_GROUP_ID, userId, role.id);

      const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('İşlemler Tamamlandı')
        .setDescription(
          `**${robloxUsername} (${userId})** isimli kişiye **${role.name}** rütbesi başarıyla verildi.\n\nSebep: ${reason}`
        );
      
      await interaction.editReply({ embeds: [embed] });

      const logEmbed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('Rütbe Değişikliği')
        .setDescription(
          `**${interaction.user.username}** isimli yetkili, **${robloxUsername} (${userId})** isimli kişiye **${role.name}** rütbesini verdi.\n\nSebep: ${reason}`
        );

      const logChannel = interaction.guild.channels.cache.get(config.LOG_CHANNEL_ID);
      if (logChannel) {
        await logChannel.send({ embeds: [logEmbed] });
      } else {
        console.error('Log kanalı bulunamadı!');
      }

    } catch (error) {
      console.error('Rütbe değiştirilirken hata oluştu:', error);
      await interaction.editReply({
        content: `Hata: ${error.message}`,
        ephemeral: true,
      });
    }
  },
};