require('dotenv').config();
const { 
  Client, 
  GatewayIntentBits, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle, 
  REST, 
  Routes,
  PermissionFlagsBits
} = require('discord.js');
const crypto = require('crypto');
const express = require('express');
const { 
  joinVoiceChannel, 
  createAudioPlayer, 
  createAudioResource, 
  AudioPlayerStatus 
} = require('@discordjs/voice');
const path = require('path');
const fs = require('fs');

// =============== إعداد سيرفر الويب (لإبقاء البوت شغال 24/7 مجاناً) ===============
const webServer = express();
webServer.get('/', (req, res) => res.send('T3N Bot is Alive 24/7!'));
const PORT = process.env.PORT || 3000;
webServer.listen(PORT, () => console.log(`🚀 Keep-Alive Web Server is running on port ${PORT}`));
// =================================================================================

// ====== Firebase Setup ======
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, getDoc, deleteDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyB9mFTUF1_mBzTl3VvxNq5G-mdhrJvzI0A",
  authDomain: "t3n-stor-cd7d7.firebaseapp.com",
  projectId: "t3n-stor-cd7d7",
  storageBucket: "t3n-stor-cd7d7.firebasestorage.app",
  messagingSenderId: "1026259276675",
  appId: "1:1026259276675:web:8b1b49fb23373151531cb6",
  measurementId: "G-273H5TJ98L"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ====== Discord Setup ======
const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMessages, 
    GatewayIntentBits.GuildVoiceStates
  ] 
});

const TARGET_CHANNEL_ID = process.env.CHANNEL_ID || '1472704260452909146';
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

if (!DISCORD_TOKEN) {
  console.error('⚠️ [ERROR] DISCORD_TOKEN is not set in .env file!');
  process.exit(1);
}

// ====== Order Generation Logic ======
// Note: Orders are typically created via Salla, but for testing/manual we can create dummy ones
function generateOrderNumber() {
  const chars = '0123456789';
  let result = '2';
  for (let i = 0; i < 8; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

async function createDatabaseKey(username) {
  let orderId = '';
  let exists = true;
  while (exists) {
    orderId = generateOrderNumber();
    const orderRef = doc(db, "orders", orderId);
    const orderSnap = await getDoc(orderRef);
    exists = orderSnap.exists();
  }
  
  const orderRef = doc(db, "orders", orderId);
  await setDoc(orderRef, {
    status: 'active', 
    createdAt: new Date().toISOString(),
    activatedAt: null,
    usedByEmail: null,
    usedByUid: null,
    createdBy: `Discord (${username})`
  });
  return orderId;
}

// ====== Ready & Slash Commands Registration ======
client.once('ready', async () => {
  console.log(`✅ Logged in to Discord as ${client.user.tag}`);
  
  // Registering the slash command /koz to the specific guild for instant updates
  const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);
  const GUILD_ID = '1396959491786018826'; // His actual server ID
  
  try {
    console.log('🔄 Registering slash commands for the Guild...');
    await rest.put(
      Routes.applicationGuildCommands(client.user.id, GUILD_ID),
      { body: [
        {
          name: 'koz',
          description: 'فتح لوحة تحكم مفاتيح T3N (للأدمن فقط)',
          default_member_permissions: String(PermissionFlagsBits.Administrator)
        },
        {
          name: 'promo',
          description: 'إرسال رسالة ترويجية مع صورة وأزرار (للأدمن فقط)',
          default_member_permissions: String(PermissionFlagsBits.Administrator)
        }
      ] }
    );
    console.log('✅ Slash commands registered successfully.');
  } catch (error) {
    console.error('⚠️ [ERROR] Failed to register slash commands:', error);
  }
});

// ====== Interaction Handler ======
client.on('interactionCreate', async (interaction) => {
  
  if (interaction.isChatInputCommand()) {
    
    // --- 0. /promo Command (Promo Message) ---
    if (interaction.commandName === 'promo') {
      if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ content: '❌ لا تملك صلاحيات.', ephemeral: true });
      }

      const promoEmbed = new EmbedBuilder()
        .setTitle('🔥 عرض ألتيمت السبوفر ! 🔥')
        .setDescription('احصل عليه الان من خلال الموقع الرسمي وتخطى جميع انواع الحظر. اضغط على الزر بالأسفل للذهاب للمتجر ↓')
        .setImage('https://media.discordapp.net/attachments/1396959491786018826/1396967239948701859/Spfr.png') // Example banner URL
        .setColor('#00E5FF');

      const promoRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel('🛒 متجر T3N')
          .setURL('https://t3n-2a2i.vercel.app/')
          .setStyle(ButtonStyle.Link)
      );

      return interaction.reply({ embeds: [promoEmbed], components: [promoRow] });
    }

    // --- 1. /koz Command (Show Panel) ---
    if (interaction.commandName === 'koz') {
      
      // Security: Check if it's the right channel
      if (interaction.channelId !== TARGET_CHANNEL_ID) {
        return interaction.reply({ 
          content: `❌ هذا الأمر لا يعمل هنا. يرجى استخدامه في القناة المخصصة له <#${TARGET_CHANNEL_ID}>`, 
          ephemeral: true 
        });
      }

      // 🛡️ Security: Check Discord Admninistrator Permission
      if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ content: '❌ لا تملك صلاحيات الأدمن لاستخدام هذه اللوحة.', ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setTitle('👑 T3N ORDERS MANAGEMENT - لوحة تحكم الطلبات')
        .setDescription('مرحباً بك في لوحة تحكم طلبات T3N.\nأي إجراء تقوم به هنا ينعكس فوراً على الموقع الرسمي (Real-Time).\nالرجاء اختيار أحد الإجراءات من الأزرار بالأسفل:')
        .setColor('#FFA500') // Orange/Amber Theme
        .setThumbnail(client.user.displayAvatarURL())
        .setFooter({ text: `T3N Security System - Requested by ${interaction.user.tag}` })
        .setTimestamp();

      const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('btn_create_single').setLabel('🔑 إنشاء طلب مانوال').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('btn_create_bulk').setLabel('📋 إنشاء متعدد 🔑').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('btn_ban').setLabel('🚫 حظر طلب').setStyle(ButtonStyle.Danger)
      );

      const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('btn_freeze').setLabel('❄️ تجميد طلب').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('btn_unban').setLabel('✅ فك حظر/تجميد').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('btn_delete').setLabel('🗑️ حذف طلب').setStyle(ButtonStyle.Danger)
      );

      await interaction.reply({ embeds: [embed], components: [row1, row2], ephemeral: true });
    }
    return;
  }

  // Permissions Check for buttons/modals
  if (interaction.isButton() || interaction.isModalSubmit()) {
    if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ صلاحيات مرفوضة.', ephemeral: true });
    }
  }

  // --- 2. Button Interactions ---
  if (interaction.isButton()) {
    
    // A. Single Key Creation
    if (interaction.customId === 'btn_create_single') {
      await interaction.deferReply();
      try {
        const key = await createDatabaseKey(interaction.user.tag);
        const embed = new EmbedBuilder()
          .setTitle('✅ تم إنشاء المفتاح بنجاح')
          .setDescription(`\`\`\`${key}\`\`\``)
          .addFields({ name: 'الحالة', value: '🟢 جاهز للاستخدام', inline: true })
          .setColor('#001F3F') // كحلي Navy Blue
          .setFooter({ text: 'تمت المزامنة فوراً مع قاعدة البيانات' });
        await interaction.editReply({ embeds: [embed] });
      } catch (err) {
        console.error(err);
        await interaction.editReply({ content: '❌ حدث خطأ داخلي أثناء إنشاء المفتاح.' });
      }
    }

    // B. Bulk Creation Modal
    else if (interaction.customId === 'btn_create_bulk') {
      const modal = new ModalBuilder()
        .setCustomId('modal_create_bulk')
        .setTitle('إنشاء مفاتيح متعددة');
      const amountInput = new TextInputBuilder()
        .setCustomId('input_amount')
        .setLabel('كم عدد المفاتيح التي تريد إنشاءها؟ (الحد: 50)')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMinLength(1)
        .setMaxLength(2)
        .setPlaceholder('مثال: 10');
      modal.addComponents(new ActionRowBuilder().addComponents(amountInput));
      await interaction.showModal(modal);
    }

    // C. Common Modal Launcher for Ban/Freeze/Unban/Delete
    else if (['btn_ban', 'btn_freeze', 'btn_unban', 'btn_delete'].includes(interaction.customId)) {
      const actionLabels = {
        'btn_ban': 'حظر',
        'btn_freeze': 'تجميد',
        'btn_unban': 'فك حظر',
        'btn_delete': 'حذف'
      };
      const actionName = actionLabels[interaction.customId];
      
      const modal = new ModalBuilder()
        .setCustomId(`modal_${interaction.customId.replace('btn_', '')}`)
        .setTitle(`${actionName} طلب`);
      const keyInput = new TextInputBuilder()
        .setCustomId('input_key')
        .setLabel(`أدخل الطلب المراد ${actionName}ه:`)
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(9)
        .setPlaceholder('2XXXXXXXX');
      modal.addComponents(new ActionRowBuilder().addComponents(keyInput));
      await interaction.showModal(modal);
    }
  }

  // --- 3. Modal Interactions ---
  if (interaction.isModalSubmit()) {
    
    // A. Bulk Creation Handler
    if (interaction.customId === 'modal_create_bulk') {
      await interaction.deferReply();
      const amountStr = interaction.fields.getTextInputValue('input_amount');
      const amount = parseInt(amountStr);
      
      if (isNaN(amount) || amount <= 0 || amount > 50) {
        return interaction.editReply({ content: '❌ الرجاء إدخال رقم صحيح بين 1 و 50.' });
      }

      try {
        const keys = [];
        for (let i = 0; i < amount; i++) {
          const k = await createDatabaseKey(interaction.user.tag);
          keys.push(k);
        }
        
        const keysStr = keys.join('\n');
        const embed = new EmbedBuilder()
          .setTitle('✅ إنشاء متعدد - نجاح!')
          .setDescription(`تم إنشاء **${amount}** مفتاح وإضافتهم فوراً للقاعدة:\n\`\`\`\n${keysStr}\n\`\`\``)
          .setColor('#001F3F') // كحلي Navy Blue
          .setFooter({ text: 'T3N Database Sync' });
        
        await interaction.editReply({ embeds: [embed] });
      } catch (err) {
        console.error(err);
        await interaction.editReply({ content: '❌ فشل في إنشاء المفاتيح المتعددة بسبب خطأ داخلي.' });
      }
    }

    // B. Ban / Freeze / Unban Handler
    else if (['modal_ban', 'modal_freeze', 'modal_unban'].includes(interaction.customId)) {
      await interaction.deferReply({ ephemeral: true });
      const keyId = interaction.fields.getTextInputValue('input_key').trim().replace(/\s/g, '');
      
      if (!/^2\d{8}$/.test(keyId)) {
        return interaction.editReply({ content: '❌ صيغة رقم الطلب غير صحيحة. يجب أن يبدأ بـ 2 ويتكون من 9 أرقام.' });
      }

      try {
        let newStatus = '';
        let color = '';
        let title = '';
        
        if (interaction.customId === 'modal_ban') {
          newStatus = 'banned'; color = '#FF0000'; title = '🚫 تم حظر الطلب';
        } else if (interaction.customId === 'modal_freeze') {
          newStatus = 'frozen'; color = '#00FFFF'; title = '❄️ تم تجميد الطلب';
        } else if (interaction.customId === 'modal_unban') {
          newStatus = 'active'; color = '#00FF00'; title = '✅ تم فك الحظر والتجميد عن الطلب';
        }

        const keyRef = doc(db, "orders", keyId);
        const keySnap = await getDoc(keyRef);
        
        if (!keySnap.exists()) {
          return interaction.editReply({ content: '❌ الطلب غير موجود في قاعدة البيانات.' });
        }
        
        const keyData = keySnap.data();

        if ((newStatus === 'banned' || newStatus === 'frozen') && keyData.usedByUid) {
          const userRef = doc(db, "users", keyData.usedByUid);
          await setDoc(userRef, { isVIP: false }, { merge: true });
        }

        await setDoc(keyRef, { status: newStatus }, { merge: true });

        const embed = new EmbedBuilder()
          .setTitle(title)
          .setDescription(`تم تطبيق الإجراء على المفتاح: \`${keyId}\``)
          .setColor(color)
          .setFooter({ text: 'تمت المزامنة فوراً مع الموقع' });
          
        await interaction.editReply({ embeds: [embed] });

      } catch (err) {
        console.error(err);
        await interaction.editReply({ content: '❌ فشل الاتصال بقاعدة البيانات. حاول ثانية.' });
      }
    }

    // C. Delete Handler
    else if (interaction.customId === 'modal_delete') {
      await interaction.deferReply({ ephemeral: true });
      const keyId = interaction.fields.getTextInputValue('input_key').trim().replace(/\s/g, '');
      
      try {
        const keyRef = doc(db, "orders", keyId);
        const keySnap = await getDoc(keyRef);
        
        if (!keySnap.exists()) {
          return interaction.editReply({ content: '❌ الطلب غير موجود في قاعدة البيانات.' });
        }
        
        const keyData = keySnap.data();
        if (keyData.usedByUid) {
          const userRef = doc(db, "users", keyData.usedByUid);
          await setDoc(userRef, { isVIP: false }, { merge: true });
        }

        await deleteDoc(keyRef);

        const embed = new EmbedBuilder()
          .setTitle('🗑️ تم حذف الطلب نهائياً')
          .setDescription(`الطلب \`${keyId}\` مُسح من قاعدة البيانات نهائياً.`)
          .setColor('#FF0000');
          
        await interaction.editReply({ embeds: [embed] });
      } catch (err) {
        console.error(err);
        await interaction.editReply({ content: '❌ فشل الحذف بسبب خطأ داخلي.' });
      }
    }
  }
});

// ====== Voice Welcome Logic ======
const WELCOME_VC_ID = '1396967239948701859';

async function connectToWelcomeChannel() {
  const guild = client.guilds.cache.get('1396959491786018826');
  if (!guild) return;
  const channel = guild.channels.cache.get(WELCOME_VC_ID);
  if (!channel) return;

  try {
    joinVoiceChannel({
      channelId: WELCOME_VC_ID,
      guildId: guild.id,
      adapterCreator: guild.voiceAdapterCreator,
    });
    console.log(`📡 [Voice] Permanent connection established in ${channel.name}`);
  } catch (err) {
    console.error('❌ Failed to join permanent channel:', err);
  }
}

client.on('ready', () => {
  connectToWelcomeChannel();
});

client.on('voiceStateUpdate', async (oldState, newState) => {
  // Only react if someone joins the specific Welcome VC
  if (!oldState.channelId && newState.channelId === WELCOME_VC_ID) {
    const channel = newState.channel;
    if (!channel) return;

    if (newState.member.user.bot) return;

    console.log(`🔊 [Voice] ${newState.member.user.tag} entered the welcome room. Playing sound...`);

    try {
      const connection = joinVoiceChannel({
        channelId: WELCOME_VC_ID,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator,
      });

      const player = createAudioPlayer();
      const resourcePath = path.join(__dirname, 'welcome.wav');
      
      if (!fs.existsSync(resourcePath)) {
        console.error('❌ welcome.wav missing.');
        return;
      }

      const resource = createAudioResource(resourcePath);
      player.play(resource);
      connection.subscribe(player);

      // We do NOT destroy the connection here so it stays static
      player.on('error', error => console.error(`❌ Audio error: ${error.message}`));

    } catch (error) {
      console.error('❌ [Voice Trigger Error]:', error);
    }
  }
});

console.log('🔄 Attempting Discord login...');
client.login(DISCORD_TOKEN).catch(err => {
  console.error('❌ FATAL: Discord login failed:', err.message);
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
});
