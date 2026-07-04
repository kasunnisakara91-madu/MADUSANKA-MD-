const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const router = express.Router();
const pino = require('pino');
const moment = require('moment-timezone');
const Jimp = require('jimp');
const sharp = require('sharp');
const crypto = require('crypto');
const axios = require('axios');
const yts = require('yt-search');
const FileType = require('file-type');
const { MongoClient } = require('mongodb');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

//Fixed All Errors And add New Movie comand(MLFBDS)2026.05.07

const {
  default: makeWASocket,
  useMultiFileAuthState,
  delay,
  getContentType,
  jidNormalizedUser,
  downloadContentFromMessage,
  DisconnectReason
} = require('@whiskeysockets/baileys');

const BOT_NAME_FANCY = ' _©MADUSANKA-MD ||🇱🇰 _'; //configs updated by 2026/7/04

const FAKE_VCARD = (name) => `BEGIN:VCARD 
VERSION:3.0
N:${name};;;;
FN:${name}
ORG:Meta Platforms
TITLE:AI Assistant
TEL;type=CELL;type=VOICE;waid=13135550002:+1 313 555 0002
TEL;type=WORK;type=VOICE:+1 555 123 4567
EMAIL:dula9x@gmail.com
URL:https://dula-api-hub.zone.id/
ADR:;;Homagama;colomb;wp;;sri lanka
NOTE:This is an ofc bot develope by Dula for CineFliz MD. Contact owner for inquiries.
END:VCARD`; //My_Own_V_card_Ofc_ Maked_By_2026.5.7

const config = {
  AUTO_VIEW_STATUS: 'true',
  AUTO_LIKE_STATUS: 'true',
  AUTO_RECORDING: 'false',
  AUTO_TYPING: 'false',
  AUTO_LIKE_EMOJI: ['☘️','💗','🫂','🙈','🍁','🙃','🧸','😘','🏴‍☠️','👀','❤️‍🔥'],
  PREFIX: '.',
  MAX_RETRIES: 3,
  GROUP_INVITE_LINK: 'https://chat.whatsapp.com/BDuqLtgssja7Zpymb5kckq',
  DCT_OFC_IMAGE_PATH: 'https://i.ibb.co/dwZrP5c9/53d6ff1b2b5a.jpg',
  NEWSLETTER_JID: [
      '120363407179960904@newsletter', // Dula OFC DEV 1

      '120363418906972955@newsletter', // DULA OFC DEV 2

      '120363421785026867@newsletter',//MADUSANKA OFC DEV 1

      '120363423916773660@newsletter',//MADUSANKA OFC DEV 2

      '120363428670000697@newsletter',//Arslan-MD Official

      '120363419802728983@newsletter'//Vajira ofc
      ],
  OTP_EXPIRY: 300000,
  OWNER_NUMBER: process.env.OWNER_NUMBER ? process.env.OWNER_NUMBER.split(',') : ['94752978237','94787940686'],
  CHANNEL_LINK: 'https://whatsapp.com/channel/0029VbDH0dj7T8bXPXQFoM0B',
  BOT_NAME: ' _© MADUSANKA-MD 🇱🇰_',
  BOT_VERSION: '2.0.0V',
  OWNER_NAME: '☠ 𝙼𝙰𝙳𝚄𝚂𝙰𝙽𝙺𝙰,ᴅᴄᴛ ᴅᴜʟᴀ ᴅᴇᴠ </> ☠︎︎',
  IMAGE_PATH: 'https://i.ibb.co/Xf97VRG6/2c8d51c08f75.jpg',
  BOT_FOOTER: '> * _© MADUSANKA-MD || 🇱🇰_*',
  ERROR: 'http://raw.githubusercontent.com/dct-dula/database/refs/heads/main/error.png',
  API_YTMP3_URL: 'https://ytmp3-download-api.vercel.app',
  BUTTON_IMAGES: { ALIVE: 'https://i.ibb.co/dwZrP5c9/53d6ff1b2b5a.jpg' },
  
  // Default settings
  DEFAULT_SETTINGS: {
    WORK_TYPE: 'public',
    AUTO_VIEW_STATUS: 'true',
    AUTO_REPLY: 'true',
    AUTO_VOICE: 'on',
    AUTO_STICKER: 'false',
    ANTI_BAD: 'false',
    ANTI_LINK: 'false',
    ANTI_BOT: 'false',
    PRESENCE: 'online',
    READ_COMMAND: 'true',
    AUTO_RECORDING: 'false',
    AUTO_TYPING: 'false',
    AUTO_LIKE_STATUS: 'true',
    BAD_NO_BLOCK: 'false',
    AI_CHAT: 'true',
    ANTI_CALL: 'off',
    WELCOME_GOODBYE: 'false',
    ANTI_DELETE: 'off',
    AUTO_TIKTOK: 'false',
    AUTO_NEWS: 'false',
    AUTO_REPLY_MODE: 'default',
    MOVIE_MODE: 'public'
  }
};
// Helper to safely access primary owner number and owner JIDs
const getPrimaryOwnerNumber = () => {
  return Array.isArray(config.OWNER_NUMBER) ? String(config.OWNER_NUMBER[0]) : String(config.OWNER_NUMBER);
};

const getOwnerJids = () => {
  const list = Array.isArray(config.OWNER_NUMBER) ? config.OWNER_NUMBER : [config.OWNER_NUMBER];
  return list.map(num => `${String(num).replace(/[^0-9]/g, '')}@s.whatsapp.net`);
};

// ==================== MONGO SETUP ====================

// Config cache to avoid repeated database queries
const configCache = new Map();
const CONFIG_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://ransikavoice_db_user:Pv4nX6iyYaUPpg23@test.te0sgjd.mongodb.net/';
const MONGO_DB = process.env.MONGO_DB || 'MADUSHANKA_MD';

let mongoClient, mongoDB;
let sessionsCol, numbersCol, adminsCol, newsletterCol, configsCol, newsletterReactsCol;
let mongoInitialized = false;
let mongoInitPromise = null;

async function initMongo() {
  if (mongoInitialized && mongoClient) return;
  if (mongoInitPromise) return mongoInitPromise;
  
  mongoInitPromise = (async () => {
    try {
      if (mongoClient?.topology?.isConnected) return;
    } catch (e) { }
    
    mongoClient = new MongoClient(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true, maxPoolSize: 10 });
    await mongoClient.connect();
    mongoDB = mongoClient.db(MONGO_DB);

    sessionsCol = mongoDB.collection('sessions');
    numbersCol = mongoDB.collection('numbers');
    adminsCol = mongoDB.collection('admins');
    newsletterCol = mongoDB.collection('newsletter_list');
    configsCol = mongoDB.collection('configs');
    newsletterReactsCol = mongoDB.collection('newsletter_reacts');

    await Promise.all([
      sessionsCol.createIndex({ number: 1 }, { unique: true }),
      numbersCol.createIndex({ number: 1 }, { unique: true }),
      newsletterCol.createIndex({ jid: 1 }, { unique: true }),
      newsletterReactsCol.createIndex({ jid: 1 }, { unique: true }),
      configsCol.createIndex({ number: 1 }, { unique: true })
    ]);
    
    mongoInitialized = true;
    console.log('✅ Mongo initialized and collections ready');
  })();
  
  return mongoInitPromise;
}

// ==================== Mongo Helpers ====================

async function saveCredsToMongo(number, creds, keys = null) {
  try {
    if (!sessionsCol || !mongoInitialized) await initMongo();
    const sanitized = number.replace(/[^0-9]/g, '');
    const doc = { number: sanitized, creds, keys, updatedAt: new Date() };
    await sessionsCol.updateOne({ number: sanitized }, { $set: doc }, { upsert: true });
  } catch (e) { console.error('saveCredsToMongo error:', e); }
}

async function loadCredsFromMongo(number) {
  try {
    if (!sessionsCol || !mongoInitialized) await initMongo();
    const sanitized = number.replace(/[^0-9]/g, '');
    const doc = await sessionsCol.findOne({ number: sanitized });
    return doc || null;
  } catch (e) { console.error('loadCredsFromMongo error:', e); return null; }
}

async function removeSessionFromMongo(number) {
  try {
    if (!sessionsCol || !mongoInitialized) await initMongo();
    const sanitized = number.replace(/[^0-9]/g, '');
    await sessionsCol.deleteOne({ number: sanitized });
  } catch (e) { console.error('removeSessionFromMongo error:', e); }
}

async function addNumberToMongo(number) {
  try {
    if (!numbersCol || !mongoInitialized) await initMongo();
    const sanitized = number.replace(/[^0-9]/g, '');
    await numbersCol.updateOne({ number: sanitized }, { $set: { number: sanitized } }, { upsert: true });
  } catch (e) { console.error('addNumberToMongo', e); }
}

async function removeNumberFromMongo(number) {
  try {
    if (!numbersCol || !mongoInitialized) await initMongo();
    const sanitized = number.replace(/[^0-9]/g, '');
    await numbersCol.deleteOne({ number: sanitized });
  } catch (e) { console.error('removeNumberFromMongo', e); }
}

async function getAllNumbersFromMongo() {
  try {
    if (!numbersCol || !mongoInitialized) await initMongo();
    const docs = await numbersCol.find({}).toArray();
    return docs.map(d => d.number);
  } catch (e) { console.error('getAllNumbersFromMongo', e); return []; }
}

async function loadAdminsFromMongo() {
  try {
    if (!adminsCol || !mongoInitialized) await initMongo();
    const docs = await adminsCol.find({}).toArray();
    return docs.map(d => d.jid || d.number).filter(Boolean);
  } catch (e) { console.error('loadAdminsFromMongo', e); return []; }
}

async function addAdminToMongo(jidOrNumber) {
  try {
    if (!adminsCol || !mongoInitialized) await initMongo();
    const doc = { jid: jidOrNumber };
    await adminsCol.updateOne({ jid: jidOrNumber }, { $set: doc }, { upsert: true });
  } catch (e) { console.error('addAdminToMongo', e); }
}

async function removeAdminFromMongo(jidOrNumber) {
  try {
    if (!adminsCol || !mongoInitialized) await initMongo();
    await adminsCol.deleteOne({ jid: jidOrNumber });
  } catch (e) { console.error('removeAdminFromMongo', e); }
}

async function addNewsletterToMongo(jid, emojis = []) {
  try {
    if (!newsletterCol || !mongoInitialized) await initMongo();
    const doc = { jid, emojis: Array.isArray(emojis) ? emojis : [], addedAt: new Date() };
    await newsletterCol.updateOne({ jid }, { $set: doc }, { upsert: true });
  } catch (e) { console.error('addNewsletterToMongo', e); throw e; }
}

async function removeNewsletterFromMongo(jid) {
  try {
    if (!newsletterCol || !mongoInitialized) await initMongo();
    await newsletterCol.deleteOne({ jid });
  } catch (e) { console.error('removeNewsletterFromMongo', e); throw e; }
}

async function listNewslettersFromMongo() {
  try {
    if (!newsletterCol || !mongoInitialized) await initMongo();
    const docs = await newsletterCol.find({}).toArray();
    return docs.map(d => ({ jid: d.jid, emojis: Array.isArray(d.emojis) ? d.emojis : [] }));
  } catch (e) { console.error('listNewslettersFromMongo', e); return []; }
}

async function saveNewsletterReaction(jid, messageId, emoji, sessionNumber) {
  try {
    if (!mongoDB || !mongoInitialized) await initMongo();
    const col = mongoDB.collection('newsletter_reactions_log');
    const doc = { jid, messageId, emoji, sessionNumber, ts: new Date() };
    await col.insertOne(doc);
  } catch (e) { console.error('saveNewsletterReaction', e); }
}

async function setUserConfigInMongo(number, conf) {
  try {
    if (!configsCol || !mongoInitialized) await initMongo();
    const sanitized = number.replace(/[^0-9]/g, '');
    await configsCol.updateOne({ number: sanitized }, { $set: { number: sanitized, config: conf, updatedAt: new Date() } }, { upsert: true });
    // Invalidate cache
    configCache.delete(sanitized);
  } catch (e) { console.error('setUserConfigInMongo', e); }
}

async function loadUserConfigFromMongo(number) {
  try {
    const sanitized = number.replace(/[^0-9]/g, '');
    
    // Check cache first
    const cached = configCache.get(sanitized);
    if (cached && Date.now() - cached.time < CONFIG_CACHE_TTL) {
      return cached.config;
    }
    
    if (!configsCol || !mongoInitialized) await initMongo();
    const doc = await configsCol.findOne({ number: sanitized });
    const userConfig = doc ? doc.config : {};
    const result = { ...config.DEFAULT_SETTINGS, ...userConfig };
    
    // Cache the result
    configCache.set(sanitized, { config: result, time: Date.now() });
    return result;
  } catch (e) { console.error('loadUserConfigFromMongo', e); return { ...config.DEFAULT_SETTINGS }; }
}

// ==================== Basic Utils ====================

function formatMessage(title, content, footer) {
  return `${title}\n\n${content}\n\n> *${footer}*`;
}
function generateOTP() { return Math.floor(100000 + Math.random() * 900000).toString(); }
function getSriLankaTimestamp() { return moment().tz('Asia/Colombo').format('YYYY-MM-DD HH:mm:ss'); }

const activeSockets = new Map();
const socketCreationTime = new Map();
const otpStore = new Map();

// ==================== Helpers ====================

async function joinGroup(socket) {
  let retries = config.MAX_RETRIES;
  const inviteCodeMatch = (config.GROUP_INVITE_LINK || '').match(/chat\.whatsapp\.com\/([a-zA-Z0-9]+)/);
  if (!inviteCodeMatch) return { status: 'failed', error: 'No group invite configured' };
  const inviteCode = inviteCodeMatch[1];
  while (retries > 0) {
    try {
      const response = await socket.groupAcceptInvite(inviteCode);
      if (response?.gid) return { status: 'success', gid: response.gid };
      throw new Error('No group ID in response');
    } catch (error) {
      retries--;
      let errorMessage = error.message || 'Unknown error';
      if (error.message && error.message.includes('not-authorized')) errorMessage = 'Bot not authorized';
      else if (error.message && error.message.includes('conflict')) errorMessage = 'Already a member';
      else if (error.message && error.message.includes('gone')) errorMessage = 'Invite invalid/expired';
      if (retries === 0) return { status: 'failed', error: errorMessage };
      await delay(2000 * (config.MAX_RETRIES - retries));
    }
  }
  return { status: 'failed', error: 'Max retries reached' };
}

async function sendAdminConnectMessage(socket, number, groupResult, sessionConfig = {}) {
  const admins = await loadAdminsFromMongo();
  const groupStatus = groupResult.status === 'success' ? `Joined (ID: ${groupResult.gid})` : `Failed to join group: ${groupResult.error}`;
  const botName = sessionConfig.botName || BOT_NAME_FANCY;
  const image = sessionConfig.logo || config.DCT_OFC_IMAGE_PATH;
  const caption = formatMessage(botName, `*📞 𝗡ᴜᴍʙᴇʀ:* ${number}\n*🍁 𝗦ᴛᴀᴛᴜꜱ:* ${groupStatus}\n*🕒 𝗖ᴏɴɴᴇᴄᴛᴇᴅ 𝗔ᴛ:* ${getSriLankaTimestamp()}`, botName);
  for (const admin of admins) {
    try {
      const to = admin.includes('@') ? admin : `${admin}@s.whatsapp.net`;
      if (String(image).startsWith('http')) {
        await socket.sendMessage(to, { image: { url: image }, caption });
      } else {
        try {
          const buf = fs.readFileSync(image);
          await socket.sendMessage(to, { image: buf, caption });
        } catch (e) {
          await socket.sendMessage(to, { image: { url: config.DCT_OFC_IMAGE_PATH }, caption });
        }
      }
    } catch (err) {
      console.error('Failed to send connect message to admin', admin, err?.message || err);
    }
  }
}

async function sendOwnerConnectMessage(socket, number, groupResult, sessionConfig = {}) {
  try {
    const ownerNumbers = getOwnerJids();
    const activeCount = activeSockets.size;
    const botName = sessionConfig.botName || BOT_NAME_FANCY;
    const image = sessionConfig.logo || config.DCT_OFC_IMAGE_PATH;
    const caption = formatMessage(`*🥷 𝗢ᴡɴᴇʀ 𝗖ᴏɴᴛᴀᴄᴛ: ${botName}*`, 
      `*📞 𝗡ᴜᴍʙᴇʀ:* ${number}\n* 𝗖ᴏɴɴᴇᴄᴛᴇᴅ 𝗔ᴛ:* ${getSriLankaTimestamp()}\n\n*🔢 𝗔ᴄᴛɪᴠᴇ 𝗦ᴇꜱꜱɪᴏɴꜱ:* ${activeCount}`, 
      botName);

    for (const ownerJid of ownerNumbers) {
      if (String(image).startsWith('http')) {
        await socket.sendMessage(ownerJid, { image: { url: image }, caption });
      } else {
        try {
          const buf = fs.readFileSync(image);
          await socket.sendMessage(ownerJid, { image: buf, caption });
        } catch (e) {
          await socket.sendMessage(ownerJid, { image: { url: config.DCT_OFC_IMAGE_PATH }, caption });
        }
      }
    }
  } catch (err) { console.error('Failed to send owner connect message:', err); }
}

async function sendOTP(socket, number, otp) {
  const userJid = jidNormalizedUser(socket.user.id);
  const message = formatMessage(`*🔐 𝐎𝚃𝙿 𝐕𝙴𝚁𝙸𝙵𝙸𝙲𝙰𝚃𝙸𝙾𝙽 — ${BOT_NAME_FANCY}*`, `*𝐘𝙾𝚄𝚁 𝐎𝚃𝙿 𝐅𝙾𝚁 𝐂𝙾𝙽𝙵𝙸𝙶 𝐔𝙿𝙳𝙰𝚃𝙴 𝐈𝚂:* *${otp}*\n𝐓𝙷𝙸𝚂 𝐎𝚃𝙿 𝐖𝙸𝙻𝙻 𝐄𝚇𝙿𝙸𝚁𝙴 𝐈𝙽 5 𝐌𝙸𝙽𝚄𝚃𝙴𝚂.\n\n*𝐍𝚄𝙼𝙱𝙴𝚁:* ${number}`, BOT_NAME_FANCY);
  try { await socket.sendMessage(userJid, { text: message }); console.log(`OTP ${otp} sent to ${number}`); }
  catch (error) { console.error(`Failed to send OTP to ${number}:`, error); throw error; }
}

//handlers

async function setupNewsletterHandlers(socket, sessionNumber) {
  const rrPointers = new Map();

  socket.ev.on('messages.upsert', async ({ messages }) => {
    const message = messages[0];
    if (!message?.key) return;
    const jid = message.key.remoteJid;

    try {
      const followedDocs = await listNewslettersFromMongo();
      const reactConfigs = await listNewsletterReactsFromMongo();
      const reactMap = new Map();
      for (const r of reactConfigs) reactMap.set(r.jid, r.emojis || []);

      const followedMap = new Map(followedDocs.map(d => [d.jid, d]));
      if (!followedMap.has(jid) && !reactMap.has(jid)) return;

      let emojis = reactMap.get(jid) || null;
      if ((!emojis || emojis.length === 0) && followedMap.has(jid)) {
        emojis = (followedMap.get(jid).emojis || []);
      }
      if (!emojis || emojis.length === 0) emojis = config.AUTO_LIKE_EMOJI;

      let idx = rrPointers.get(jid) || 0;
      const emoji = emojis[idx % emojis.length];
      rrPointers.set(jid, (idx + 1) % emojis.length);

      const messageId = message.newsletterServerId || message.key.id;
      if (!messageId) return;

      let retries = 3;
      while (retries-- > 0) {
        try {
          if (typeof socket.newsletterReactMessage === 'function') {
            await socket.newsletterReactMessage(jid, messageId.toString(), emoji);
          } else {
            await socket.sendMessage(jid, { react: { text: emoji, key: message.key } });
          }
          await saveNewsletterReaction(jid, messageId.toString(), emoji, sessionNumber || null);
          break;
        } catch (err) {
          console.warn(`Reaction attempt failed (${3 - retries}/3):`, err?.message || err);
          await delay(1200);
        }
      }

    } catch (error) {
      console.error('Newsletter reaction handler error:', error?.message || error);
    }
  });
}

async function setupStatusHandlers(socket, sessionNumber) {
  socket.ev.on('messages.upsert', async ({ messages }) => {
    const message = messages[0];
    if (!message?.key || message.key.remoteJid !== 'status@broadcast' || !message.key.participant) return;

    try {
      let userEmojis = config.AUTO_LIKE_EMOJI;
      let autoViewStatus = config.AUTO_VIEW_STATUS;
      let autoLikeStatus = config.AUTO_LIKE_STATUS;
      let autoRecording = config.AUTO_RECORDING;

      if (sessionNumber) {
        const userConfig = await loadUserConfigFromMongo(sessionNumber) || {};

        if (userConfig.AUTO_LIKE_EMOJI && Array.isArray(userConfig.AUTO_LIKE_EMOJI) && userConfig.AUTO_LIKE_EMOJI.length > 0) {
          userEmojis = userConfig.AUTO_LIKE_EMOJI;
        }
        if (userConfig.AUTO_VIEW_STATUS !== undefined) autoViewStatus = userConfig.AUTO_VIEW_STATUS;
        if (userConfig.AUTO_LIKE_STATUS !== undefined) autoLikeStatus = userConfig.AUTO_LIKE_STATUS;
        if (userConfig.AUTO_RECORDING !== undefined) autoRecording = userConfig.AUTO_RECORDING;
      }

      if (autoRecording === 'true') {
        await socket.sendPresenceUpdate("recording", message.key.remoteJid);
      }

      if (autoViewStatus === 'true') {
        let retries = config.MAX_RETRIES;
        while (retries > 0) {
          try {
            await socket.readMessages([message.key]);
            break;
          } catch (error) {
            retries--;
            await delay(1000 * (config.MAX_RETRIES - retries));
            if (retries === 0) throw error;
          }
        }
      }

      if (autoLikeStatus === 'true') {
        const randomEmoji = userEmojis[Math.floor(Math.random() * userEmojis.length)];
        let retries = config.MAX_RETRIES;
        while (retries > 0) {
          try {
            await socket.sendMessage(message.key.remoteJid, {
              react: { text: randomEmoji, key: message.key }
            }, { statusJidList: [message.key.participant] });
            break;
          } catch (error) {
            retries--;
            await delay(1000 * (config.MAX_RETRIES - retries));
            if (retries === 0) throw error;
          }
        }
      }

    } catch (error) {
      console.error('Status handler error:', error);
    }
  });
}

async function handleMessageRevocation(socket, number) {
  socket.ev.on('messages.delete', async ({ keys }) => {
    if (!keys || keys.length === 0) return;
    const messageKey = keys[0];
    const sanitized = (number || '').replace(/[^0-9]/g, '');
    const userConfig = await loadUserConfigFromMongo(sanitized) || {};
    const mode = userConfig.ANTI_DELETE || 'off';
    if (mode === 'off') return;

    const isGroup = String(messageKey.remoteJid || '').endsWith('@g.us');
    if (mode === 'inbox' && isGroup) return;
    if (mode === 'group' && !isGroup) return;

    const userJid = jidNormalizedUser(socket.user.id);
    const deletionTime = getSriLankaTimestamp();
    const message = formatMessage('*🗑️ 𝗠ᴇꜱꜱᴀɢᴇ 𝗗ᴇʟᴇᴛᴇᴅ*', `A message was deleted from your chat.\n*📋 𝗙ʀᴏᴍ:* ${messageKey.remoteJid}\n*🍁 𝗗ᴇʟᴇᴛɪᴏɴ 𝗧ɪᴍᴇ:* ${deletionTime}`, BOT_NAME_FANCY);
    try { await socket.sendMessage(userJid, { image: { url: config.DCT_OFC_IMAGE_PATH }, caption: message }); }
    catch (error) { console.error('Failed to send deletion notification:', error); }
  });
}

async function setupWelcomeGoodbye(socket, sessionNumber) {
  socket.ev.on('group-participants.update', async (update) => {
    try {
      const sanitized = (sessionNumber || '').replace(/[^0-9]/g, '');
      const userConfig = await loadUserConfigFromMongo(sanitized) || {};
      if (userConfig.WELCOME_GOODBYE !== 'true') return;

      const groupId = update.id;
      const participants = update.participants || [];
      if (!participants.length) return;

      try {
        const groupMetadata = await socket.groupMetadata(groupId);
        const groupName = groupMetadata?.subject || "Our Group";
        const memberCount = groupMetadata?.participants?.length || 0;

        for (const participant of participants) {
          const userId = participant.split('@')[0];

          if (update.action === 'add') {
            const welcomeMsg = `
╭━━━〔 🌟 W E L C O M E 🌟 〕━━━⬣

👋 Hey *@${userId}* ✨
🎉 Welcome to *${groupName}*

╭━━━〔 💎 GROUP INFO 〕━━━⬣
┃ 👥 Members : ${memberCount}
┃ 🏷️ Status : New Member
╰━━━━━━━━━━━━━━⬣

╭━━━〔 📌 RULES 〕━━━⬣
┃ 🔹 Be respectful 🤝
┃ 🔹 No spam 🚫
┃ 🔹 Enjoy & stay active 💬
╰━━━━━━━━━━━━━━⬣

╭━━━〔 🌈 MESSAGE 〕━━━⬣
┃ 💖 We're happy to have you here!
┃ 🚀 Hope you enjoy your stay
╰━━━━━━━━━━━━━━⬣

╭━━━〔 ✨ ENJOY ✨ 〕━━━⬣
╰━━━━━━━━━━━━━━⬣
`;
            await socket.sendMessage(groupId, {
              image: { url: userConfig.logo || config.DCT_OFC_IMAGE_PATH },
              caption: welcomeMsg,
              mentions: [participant]
            });
          } else if (update.action === 'remove') {
            const goodbyeMsg = `
╭━━━〔 🌙 G O O D B Y E 🌙 〕━━━⬣

👋 Bye *@${userId}* 💔
🚪 You left *${groupName}*

╭━━━〔 📊 GROUP STATUS 〕━━━⬣
┃ 👥 Members Left : ${memberCount - 1}
┃ 🏷️ Status : Left Group
╰━━━━━━━━━━━━━━⬣

╭━━━〔 💔 MESSAGE 〕━━━⬣
┃ 😢 You will be missed here
┃ 🤍 Doors always open for you
╰━━━━━━━━━━━━━━⬣

╭━━━〔 🌌 TAKE CARE 🌌 〕━━━⬣
┃ 🌟 Stay safe & happy
┃ 💫 Hope to see you again
╰━━━━━━━━━━━━━━⬣
`;
            await socket.sendMessage(groupId, {
              image: { url: userConfig.logo || config.DCT_OFC_IMAGE_PATH },
              caption: goodbyeMsg,
              mentions: [participant]
            });
          }
        }
      } catch (metaErr) {
        console.error('Failed to get group metadata:', metaErr);
      }
    } catch (err) {
      console.error('WelcomeGoodbye error:', err);
    }
  });
}

async function setupCallRejection(socket, sessionNumber) {
  socket.ev.on('call', async (calls) => {
    try {
      const sanitized = (sessionNumber || '').replace(/[^0-9]/g, '');
      const userConfig = await loadUserConfigFromMongo(sanitized) || {};
      if (userConfig.ANTI_CALL !== 'on') return;

      for (const call of calls) {
        if (call.status !== 'offer') continue;
        const id = call.id;
        const from = call.from;
        await socket.rejectCall(id, from);
        await socket.sendMessage(from, { text: '*🔕 Auto call rejection is enabled. Calls are automatically rejected.*' });
        const userJid = jidNormalizedUser(socket.user.id);
        const rejectionMessage = formatMessage('📞 CALL REJECTED', `Auto call rejection is active.\n\nCall from: ${from}\nTime: ${getSriLankaTimestamp()}`, BOT_NAME_FANCY);
        await socket.sendMessage(userJid, { image: { url: config.DCT_OFC_IMAGE_PATH }, caption: rejectionMessage });
      }
    } catch (err) {
      console.error(`Call rejection error for ${sessionNumber}:`, err);
    }
  });
}

async function setupAutoMessageRead(socket, sessionNumber) {
  socket.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg || !msg.message || msg.key.remoteJid === 'status@broadcast' || msg.key.remoteJid === config.NEWSLETTER_JID) return;

    const sanitized = (sessionNumber || '').replace(/[^0-9]/g, '');
    const userConfig = await loadUserConfigFromMongo(sanitized) || {};
    const autoReadSetting = userConfig.READ_COMMAND || 'false';

    if (autoReadSetting !== 'true') return;

    let body = '';
    try {
      const type = getContentType(msg.message);
      const actualMsg = (type === 'ephemeralMessage') ? msg.message.ephemeralMessage.message : msg.message;

      if (type === 'conversation') body = actualMsg.conversation || '';
      else if (type === 'extendedTextMessage') body = actualMsg.extendedTextMessage?.text || '';
    } catch (e) { body = ''; }

    const prefix = userConfig.PREFIX || config.PREFIX;
    const isCmd = body && body.startsWith && body.startsWith(prefix);

    if (isCmd) {
      try { await socket.readMessages([msg.key]); } catch (error) { console.warn('Failed to read command message:', error?.message); }
    }
  });
}

async function setupMessageHandlers(socket, sessionNumber) {
  socket.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.remoteJid === 'status@broadcast' || msg.key.remoteJid === config.NEWSLETTER_JID) return;

    try {
      let autoTyping = false;
      let autoRecording = false;

      if (sessionNumber) {
        const userConfig = await loadUserConfigFromMongo(sessionNumber) || {};
        if (userConfig.AUTO_TYPING === 'true') autoTyping = true;
        if (userConfig.AUTO_RECORDING === 'true') autoRecording = true;
      }

      if (autoTyping) {
        try {
          await socket.sendPresenceUpdate('composing', msg.key.remoteJid);
          setTimeout(async () => { try { await socket.sendPresenceUpdate('paused', msg.key.remoteJid); } catch (e) { } }, 3000);
        } catch (e) { console.error('Auto typing error:', e); }
      }

      if (autoRecording) {
        try {
          await socket.sendPresenceUpdate('recording', msg.key.remoteJid);
          setTimeout(async () => { try { await socket.sendPresenceUpdate('paused', msg.key.remoteJid); } catch (e) { } }, 3000);
        } catch (e) { console.error('Auto recording error:', e); }
      }
    } catch (error) {
      console.error('Message handler error:', error);
    }
  });
}

// ==================== Cleanup Helper ====================

async function deleteSessionAndCleanup(number, socketInstance) {
  const sanitized = number.replace(/[^0-9]/g, '');
  try {
    const sessionPath = path.join(os.tmpdir(), `session_${sanitized}`);
    try { if (fs.existsSync(sessionPath)) fs.removeSync(sessionPath); } catch (e) { }
    activeSockets.delete(sanitized); socketCreationTime.delete(sanitized);
    try { await removeSessionFromMongo(sanitized); } catch (e) { }
    try { await removeNumberFromMongo(sanitized); } catch (e) { }
    try {
      const ownerNumbers = config.OWNER_NUMBER.map(num => `${num.replace(/[^0-9]/g, '')}@s.whatsapp.net`);
      const caption = formatMessage('*🥷 OWNER NOTICE — SESSION REMOVED*', `*𝐍umber:* ${sanitized}\n*𝐒ession 𝐑emoved 𝐃ue 𝐓o 𝐋ogout.*\n\n*𝐀ctive 𝐒essions 𝐍ow:* ${activeSockets.size}`, BOT_NAME_FANCY);
      for (const ownerJid of ownerNumbers) {
        if (socketInstance && socketInstance.sendMessage) await socketInstance.sendMessage(ownerJid, { image: { url: config.DCT_OFC_IMAGE_PATH }, caption });
      }
    } catch (e) { }
    console.log(`Cleanup completed for ${sanitized}`);
  } catch (err) { console.error('deleteSessionAndCleanup error:', err); }
}

// ==================== Auto-Restart ====================

function setupAutoRestart(socket, number) {
  socket.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode
        || lastDisconnect?.error?.statusCode
        || (lastDisconnect?.error && lastDisconnect.error.toString().includes('401') ? 401 : undefined);
      const isLoggedOut = statusCode === 401
        || (lastDisconnect?.error && lastDisconnect.error.code === 'AUTHENTICATION')
        || (lastDisconnect?.error && String(lastDisconnect.error).toLowerCase().includes('logged out'))
        || (lastDisconnect?.reason === DisconnectReason?.loggedOut);
      if (isLoggedOut) {
        console.log(`User ${number} logged out. Cleaning up...`);
        try { await deleteSessionAndCleanup(number, socket); } catch (e) { console.error(e); }
      } else {
        console.log(`Connection closed for ${number} (not logout). Attempt reconnect...`);
        try { await delay(10000); activeSockets.delete(number.replace(/[^0-9]/g, '')); socketCreationTime.delete(number.replace(/[^0-9]/g, '')); const mockRes = { headersSent: false, send: () => { }, status: () => mockRes }; await EmpirePair(number, mockRes); } catch (e) { console.error('Reconnect attempt failed', e); }
      }
    }
  });
}

// ==================== EmpirePair ====================

async function EmpirePair(number, res) {
  const sanitizedNumber = number.replace(/[^0-9]/g, '');
  const sessionPath = path.join(os.tmpdir(), `session_${sanitizedNumber}`);
  if (!mongoInitialized) await initMongo().catch(() => { });

  try {
    const mongoDoc = await loadCredsFromMongo(sanitizedNumber);
    if (mongoDoc && mongoDoc.creds) {
      fs.ensureDirSync(sessionPath);
      fs.writeFileSync(path.join(sessionPath, 'creds.json'), JSON.stringify(mongoDoc.creds, null, 2));
      if (mongoDoc.keys) fs.writeFileSync(path.join(sessionPath, 'keys.json'), JSON.stringify(mongoDoc.keys, null, 2));
      console.log('Prefilled creds from Mongo');
    }
  } catch (e) { console.warn('Prefill from Mongo failed', e); }

  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

  try {
    const socket = makeWASocket({
      logger: pino({ level: "silent" }),
      printQRInTerminal: false,
      auth: state,
      version: [2, 3000, 1033105955],
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 0,
      keepAliveIntervalMs: 10000,
      emitOwnEvents: true,
      fireInitQueries: true,
      generateHighQualityLinkPreview: true,
      syncFullHistory: true,
      markOnlineOnConnect: true,
      browser: ['Mac OS', 'Safari', '10.15.7']
    });

    socketCreationTime.set(sanitizedNumber, Date.now());

    setupStatusHandlers(socket, sanitizedNumber);
    setupCommandHandlers(socket, sanitizedNumber);
    setupMessageHandlers(socket, sanitizedNumber);
    setupAutoRestart(socket, sanitizedNumber);
    setupNewsletterHandlers(socket, sanitizedNumber);
    handleMessageRevocation(socket, sanitizedNumber);
    setupWelcomeGoodbye(socket, sanitizedNumber);
    setupAutoMessageRead(socket, sanitizedNumber);
    setupCallRejection(socket, sanitizedNumber);

    if (!socket.authState.creds.registered) {
      let retries = config.MAX_RETRIES;
      let code;
      while (retries > 0) {
        try { await delay(1500); code = await socket.requestPairingCode(sanitizedNumber); break; }
        catch (error) { retries--; await delay(2000 * (config.MAX_RETRIES - retries)); }
      }
      if (!res.headersSent) res.send({ code });
    }

    socket.ev.on('creds.update', async () => {
      try {
        await saveCreds();
        const credsPath = path.join(sessionPath, 'creds.json');
        if (!fs.existsSync(credsPath)) return;
        const fileStats = fs.statSync(credsPath);
        if (fileStats.size === 0) return;
        const fileContent = await fs.readFile(credsPath, 'utf8');
        const trimmedContent = fileContent.trim();
        if (!trimmedContent || trimmedContent === '{}' || trimmedContent === 'null') return;
        let credsObj;
        try { credsObj = JSON.parse(trimmedContent); } catch (e) { return; }
        if (!credsObj || typeof credsObj !== 'object') return;
        const keysObj = state.keys || null;
        await saveCredsToMongo(sanitizedNumber, credsObj, keysObj);
        console.log('✅ Creds saved to MongoDB successfully');
      } catch (err) {
        console.error('Failed saving creds on creds.update:', err);
      }
    });

    socket.ev.on('connection.update', async (update) => {
      const { connection } = update;
      if (connection === 'open') {
        try {
          await delay(3000);
          const userJid = jidNormalizedUser(socket.user.id);
          const groupResult = await joinGroup(socket).catch(() => ({ status: 'failed', error: 'joinGroup not configured' }));

          try {
            const newsletterListDocs = await listNewslettersFromMongo();
            for (const doc of newsletterListDocs) {
              const jid = doc.jid;
              try { if (typeof socket.newsletterFollow === 'function') await socket.newsletterFollow(jid); } catch (e) { }
            }
          } catch (e) { }

          activeSockets.set(sanitizedNumber, socket);
          const groupStatus = groupResult.status === 'success' ? 'Joined successfully' : `Failed to join group: ${groupResult.error}`;

          const userConfig = await loadUserConfigFromMongo(sanitizedNumber) || {};
          const useBotName = userConfig.botName || BOT_NAME_FANCY;
          const useLogo = userConfig.logo || config.DCT_OFC_IMAGE_PATH;

          const initialCaption = formatMessage(useBotName,
            `*✅ 𝗦ᴜᴄᴄᴇꜱꜱꜰᴜʟʟʏ 𝗖ᴏɴɴᴇᴄᴛᴇᴅ ✅*\n\n*🔢 𝗡ᴜᴍʙᴇʀ :* ${sanitizedNumber}\n*📡 𝗖ᴏɴɴᴇᴄᴛɪɴɢ :* Wait few seconds`,
            useBotName
          );

          let sentMsg = null;
          try {
            if (String(useLogo).startsWith('http')) {
              sentMsg = await socket.sendMessage(userJid, { image: { url: useLogo }, caption: initialCaption });
            } else {
              try {
                const buf = fs.readFileSync(useLogo);
                sentMsg = await socket.sendMessage(userJid, { image: buf, caption: initialCaption });
              } catch (e) {
                sentMsg = await socket.sendMessage(userJid, { image: { url: config.DCT_OFC_IMAGE_PATH }, caption: initialCaption });
              }
            }
          } catch (e) {
            try { sentMsg = await socket.sendMessage(userJid, { text: initialCaption }); } catch (e) { }
          }

          await delay(4000);

          const updatedCaption = formatMessage(
  useBotName,
  `╭━━━〔 ✅ 𝗖𝗢𝗡𝗡𝗘𝗖𝗧𝗘𝗗 🇱🇰〕━━━╮

┃ 🔢 𝗡𝘂𝗺𝗯𝗲𝗿   : ${sanitizedNumber}
┃ 🏷️ 𝗦𝘁𝗮𝘁𝘂𝘀   : ${groupStatus}
┃ 🕒 𝗧𝗶𝗺𝗲     : ${getSriLankaTimestamp()}

╰━━━━MADUSANKA-MD V2 🇱🇰━━━━━━━━━━━━━━━━━━╯

✨ 𝗦𝘆𝘀𝘁𝗲𝗺 𝗶𝘀 𝗻𝗼𝘄 𝗼𝗻𝗹𝗶𝗻𝗲 & 𝗿𝗲𝗮𝗱𝘆!`,
  useBotName
);

          try {
            if (sentMsg && sentMsg.key) {
              try { await socket.sendMessage(userJid, { delete: sentMsg.key }); } catch (delErr) { }
            }
            try {
              if (String(useLogo).startsWith('http')) {
                await socket.sendMessage(userJid, { image: { url: useLogo }, caption: updatedCaption });
              } else {
                try {
                  const buf = fs.readFileSync(useLogo);
                  await socket.sendMessage(userJid, { image: buf, caption: updatedCaption });
                } catch (e) {
                  await socket.sendMessage(userJid, { text: updatedCaption });
                }
              }
            } catch (imgErr) {
              await socket.sendMessage(userJid, { text: updatedCaption });
            }
          } catch (e) { }

          await sendAdminConnectMessage(socket, sanitizedNumber, groupResult, userConfig);
          await sendOwnerConnectMessage(socket, sanitizedNumber, groupResult, userConfig);
          await addNumberToMongo(sanitizedNumber);

          // Subscribe/follow newsletters if supported by the socket
          try {
            const followFn = typeof socket.newsletterSubscribe === 'function'
              ? socket.newsletterSubscribe
              : typeof socket.newsletterFollow === 'function'
                ? socket.newsletterFollow
                : null;

            if (followFn) {
              for (const jid of config.NEWSLETTER_JID) {
                await followFn.call(socket, jid);
                console.log(`Followed newsletter: ${jid}`);
              }
            } else {
              console.warn('Newsletter follow/subscribe API not available on socket. Skipping newsletter subscription.');
            }
          } catch (e) {
            console.error('Newsletter subscription error:', e);
          }

          await socket.sendMessage(userJid, { text: `✅ *${useBotName} is now online!*\n\nType *${config.PREFIX}menu* to see all available commands.\n\n*Owner:* ${getPrimaryOwnerNumber()}\n\n_Thank you for using MADUSANKA-MD 🇱🇰!_` });

        } catch (e) {
          console.error('Connection open error:', e);
          try { exec(`pm2.restart ${process.env.PM2_NAME || 'DCT-NINJA-MD'}`); } catch (e) { }
        }
      }
      if (connection === 'close') {
        try { if (fs.existsSync(sessionPath)) fs.removeSync(sessionPath); } catch (e) { }
      }
    });

    activeSockets.set(sanitizedNumber, socket);

  } catch (error) {
    console.error('Pairing error:', error);
    socketCreationTime.delete(sanitizedNumber);
    if (!res.headersSent) res.status(503).send({ error: 'Service Unavailable' });
  }
}

// ==================== COMPLETE COMMAND HANDLER WITH CASE TYPE ====================

function setupCommandHandlers(socket, number) {
  socket.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg || !msg.message) return;
    
    if (msg.key.remoteJid === 'status@broadcast' || msg.key.remoteJid === config.NEWSLETTER_JID) return;

    try {
      let body = '';
      const msgType = getContentType(msg.message);
      
      if (msgType === 'conversation') body = msg.message.conversation || '';
      else if (msgType === 'extendedTextMessage') body = msg.message.extendedTextMessage?.text || '';
      else if (msgType === 'imageMessage') body = msg.message.imageMessage?.caption || '';
      else if (msgType === 'videoMessage') body = msg.message.videoMessage?.caption || '';

      if (!body || typeof body !== 'string') return;
      
      const prefix = config.PREFIX;
      let fullCommand = '';
      if (body.startsWith(prefix)) {
        fullCommand = body.slice(prefix.length).trim();
      } else if (/^[0-9]+$/.test(body.trim())) {
        fullCommand = body.trim();
      } else {
        return;
      }
      const command = fullCommand.split(' ')[0].toLowerCase();
      const args = fullCommand.slice(command.length).trim().split(/\s+/).filter(Boolean);
      
      const from = msg.key.remoteJid;
      const sender = from;
      const nowsender = msg.key.fromMe ? (socket.user.id.split(':')[0] + '@s.whatsapp.net' || socket.user.id) : (msg.key.participant || msg.key.remoteJid);
      const senderNumber = (nowsender || '').split('@')[0];
      const ownerNumbers = Array.isArray(config.OWNER_NUMBER) ? config.OWNER_NUMBER : [config.OWNER_NUMBER];
      const isOwner = ownerNumbers.some(owner => String(senderNumber) === String(owner).replace(/[^0-9]/g, ''));
      const isGroup = from.endsWith("@g.us");
      
      const sanitized = (number || '').replace(/[^0-9]/g, '');
      const userConfig = await loadUserConfigFromMongo(sanitized) || {};

      // Work type restrictions
      if (!isOwner) {
        const workType = userConfig.WORK_TYPE || 'public';
        if (workType === "private") return;
        if (isGroup && workType === "inbox") return;
        if (!isGroup && workType === "groups") return;
      }

      console.log(`📨 Command: ${command} from ${senderNumber}`);

      // ==================== AUTO VOICE FEATURE ====================
      try {
        const _sanitizedAV = (senderNumber || '').replace(/[^0-9]/g, '');
        const _userConfigAV = await loadUserConfigFromMongo(_sanitizedAV) || {};
        const _autoVoiceEnabled = _userConfigAV.AUTO_VOICE !== 'off';

        const _bodyLowerV = (body || '').trim().toLowerCase();

        // 🎧 FIXED VOICE MAP
        const _voiceReplies = {
          // 🌅 greetings
          'gm': 'https://raw.githubusercontent.com/dct-dula/database/48c3556468d3f7f81ce6b4ec974a83f2aea1b467/voice/gm.ogg',
          'good morning': 'https://raw.githubusercontent.com/dct-dula/database/48c3556468d3f7f81ce6b4ec974a83f2aea1b467/voice/gm.ogg',

          'gn': 'https://github.com/TECH-HORIZON-SCHOOL-OFFICIAL/PROJECT_HORIZON/raw/refs/heads/main/voice%20clips/gn.mp3',
          'good night': 'https://github.com/TECH-HORIZON-SCHOOL-OFFICIAL/PROJECT_HORIZON/raw/refs/heads/main/voice%20clips/good%20night.mp3',

          // 💬 chat
          'hi': 'https://raw.githubusercontent.com/dct-dula/database/48c3556468d3f7f81ce6b4ec974a83f2aea1b467/voice/hi%20lassana%20lamayo.ogg',
          'hey': 'https://raw.githubusercontent.com/dct-dula/database/48c3556468d3f7f81ce6b4ec974a83f2aea1b467/voice/hi%20lassana%20lamayo.ogg',
          'hello': 'https://raw.githubusercontent.com/dct-dula/database/48c3556468d3f7f81ce6b4ec974a83f2aea1b467/voice/hi%20lassana%20lamayo.ogg',
          'helo': 'https://raw.githubusercontent.com/dct-dula/database/48c3556468d3f7f81ce6b4ec974a83f2aea1b467/voice/hi%20lassana%20lamayo.ogg',
          'hy': 'https://raw.githubusercontent.com/dct-dula/database/48c3556468d3f7f81ce6b4ec974a83f2aea1b467/voice/hi%20lassana%20lamayo.ogg',

          'bye': 'https://raw.githubusercontent.com/dct-dula/database/48c3556468d3f7f81ce6b4ec974a83f2aea1b467/voice/bye%20lassana%20lamayo.ogg',
          'hm': 'https://raw.githubusercontent.com/dct-dula/database/48c3556468d3f7f81ce6b4ec974a83f2aea1b467/voice/bye%20lassana%20lamayo.ogg',

          // 🇱🇰 sinhala
          'mk': 'https://raw.githubusercontent.com/dct-dula/database/48c3556468d3f7f81ce6b4ec974a83f2aea1b467/voice/mk.ogg',
          'mokada karanne': 'https://raw.githubusercontent.com/dct-dula/database/48c3556468d3f7f81ce6b4ec974a83f2aea1b467/voice/mk.ogg',

          // ❤️ love
          'adareyi': 'https://github.com/TECH-HORIZON-SCHOOL-OFFICIAL/PROJECT_HORIZON/raw/refs/heads/main/voice%20clips/adarei.mp3',
          'ආදරෙයි': 'https://github.com/TECH-HORIZON-SCHOOL-OFFICIAL/PROJECT_HORIZON/raw/refs/heads/main/voice%20clips/adarei.mp3',
          'love you': 'https://github.com/TECH-HORIZON-SCHOOL-OFFICIAL/PROJECT_HORIZON/raw/refs/heads/main/voice%20clips/adarei.mp3',
          'i love you': 'https://github.com/TECH-HORIZON-SCHOOL-OFFICIAL/PROJECT_HORIZON/raw/refs/heads/main/voice%20clips/adarei.mp3',

          // 😂 reactions
          'ha ha': 'https://github.com/TECH-HORIZON-SCHOOL-OFFICIAL/PROJECT_HORIZON/raw/refs/heads/main/voice%20clips/hako.mp3',
          'hako': 'https://github.com/TECH-HORIZON-SCHOOL-OFFICIAL/PROJECT_HORIZON/raw/refs/heads/main/voice%20clips/hako.mp3',

          // 🤖 bot
          'bot': 'https://raw.githubusercontent.com/dct-dula/database/48c3556468d3f7f81ce6b4ec974a83f2aea1b467/voice/hi%20lassana%20lamayo.ogg',

          // ❗ bad words (split fixed)
          'hutta': 'https://raw.githubusercontent.com/dct-dula/database/48c3556468d3f7f81ce6b4ec974a83f2aea1b467/voice/bad%20words.ogg',
          'pakaya': 'https://raw.githubusercontent.com/dct-dula/database/48c3556468d3f7f81ce6b4ec974a83f2aea1b467/voice/bad%20words.ogg',
          'ponnaya': 'https://raw.githubusercontent.com/dct-dula/database/48c3556468d3f7f81ce6b4ec974a83f2aea1b467/voice/bad%20words.ogg',
          'utta': 'https://raw.githubusercontent.com/dct-dula/database/48c3556468d3f7f81ce6b4ec974a83f2aea1b467/voice/bad%20words.ogg',
          'ponz': 'https://raw.githubusercontent.com/dct-dula/database/48c3556468d3f7f81ce6b4ec974a83f2aea1b467/voice/bad%20words.ogg',
          'wesigeputha': 'https://raw.githubusercontent.com/dct-dula/database/48c3556468d3f7f81ce6b4ec974a83f2aea1b467/voice/bad%20words.ogg',
          'huttigeputha': 'https://raw.githubusercontent.com/dct-dula/database/48c3556468d3f7f81ce6b4ec974a83f2aea1b467/voice/bad%20words.ogg',
          'huththa': 'https://raw.githubusercontent.com/dct-dula/database/48c3556468d3f7f81ce6b4ec974a83f2aea1b467/voice/bad%20words.ogg',
          'huththigeputha': 'https://raw.githubusercontent.com/dct-dula/database/48c3556468d3f7f81ce6b4ec974a83f2aea1b467/voice/bad%20words.ogg'
        };

        if (_autoVoiceEnabled && _voiceReplies[_bodyLowerV]) {
          try {
            const voiceUrl = _voiceReplies[_bodyLowerV];
            const voiceResponse = await axios.get(voiceUrl, { responseType: 'arraybuffer' });
            const voiceBuffer = Buffer.from(voiceResponse.data);

            await socket.sendMessage(sender, {
              audio: voiceBuffer,
              mimetype: 'audio/ogg; codecs=opus',
              ptt: true
            }, { quoted: msg });

            console.log(`🎵 Auto voice sent for: ${_bodyLowerV}`);
          } catch (voiceError) {
            console.error('Auto voice error:', voiceError);
          }
        }
      } catch (autoVoiceError) {
        console.error('Auto voice feature error:', autoVoiceError);
      }

      // Helper for quoted media
      async function downloadQuotedMedia(quoted) {
        if (!quoted) return null;
        const qTypes = ['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage', 'stickerMessage'];
        const qType = qTypes.find(t => quoted[t]);
        if (!qType) return null;
        const messageType = qType.replace(/Message$/i, '').toLowerCase();
        const stream = await downloadContentFromMessage(quoted[qType], messageType);
        let buffer = Buffer.from([]);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
        return { buffer, mime: quoted[qType].mimetype || '', caption: quoted[qType].caption || quoted[qType].fileName || '', ptt: quoted[qType].ptt || false, fileName: quoted[qType].fileName || '' };
      }

      // ==================== CASE TYPE COMMAND HANDLER ====================
      
      // Helper function to extract channel ID from WhatsApp channel link
      function extractChannelId(link) {
        if (!link) return null;
        
        // Handle different WhatsApp channel link formats
        const patterns = [
          /https?:\/\/(?:www\.)?whatsapp\.com\/channel\/([0-9]+)/i,
          /https?:\/\/chat\.whatsapp\.com\/channel\/([0-9]+)/i,
          /wa\.me\/channel\/([0-9]+)/i,
          /channel\/([0-9]+)/i,
          /([0-9]+)@newsletter/i
        ];
        
        for (const pattern of patterns) {
          const match = link.match(pattern);
          if (match && match[1]) {
            return `${match[1]}@newsletter`;
          }
        }
        
        // If it's already a JID format
        if (link.includes('@newsletter')) {
          return link;
        }
        
        return null;
      }
      
      switch(command) {
      case 'img': {
          const q = body.replace(/^[.\/!]img\s*/i, '').trim();

          if (!q) return await socket.sendMessage(sender, {
            text: '🔍 Please provide a search query. Ex: .img sunset'
          }, { quoted: msg });

          try {
            const sanitized = (number || '').replace(/[^0-9]/g, '');
            const userCfg = await loadUserConfigFromMongo(sanitized) || {};
            const botName = userCfg.botName || BOT_NAME_FANCY;

            const botMention = {
              key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_IMG" },
              message: {
                contactMessage: {
                  displayName: botName,
                  vcard: `BEGIN:VCARD
VERSION:3.0
FN:${botName}
ORG:${botName}
TEL;type=CELL;type=VOICE;waid=13135550002:+1 313 555 0002
END:VCARD`
                }
              }
            };

            const res = await axios.get(`https://allstars-apis.vercel.app/pinterest?search=${encodeURIComponent(q)}`);
            const data = res.data?.data;

            if (!data || data.length === 0)
              return await socket.sendMessage(sender, { text: '❌ No images found.' }, { quoted: botMention });

            const randomImage = data[Math.floor(Math.random() * data.length)];

            await socket.sendMessage(sender, {
              image: { url: randomImage },
              caption: `🖼️ IMAGE SEARCH : ${q}\n\n> ${botName}`,
              buttons: [{
                buttonId: `${config.PREFIX}img ${q}`,
                buttonText: { displayText: "⏩ Next Image" },
                type: 1
              }],
              headerType: 4,
              contextInfo: { mentionedJid: [sender] }
            }, { quoted: botMention });

          } catch (err) {
            console.error("img error:", err);
            await socket.sendMessage(sender, { text: '❌ Failed to fetch images.' });
          }

          break;
        }
      case 'දà· පනà·Š':
        case 'oni':
        case 'vv':
        case 'save': {
          try {
            const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMsg) {
              return await socket.sendMessage(sender, { text: '*❌ Please reply to a message (status/media) to save it.*' }, { quoted: msg });
            }

            try { await socket.sendMessage(sender, { react: { text: '✅', key: msg.key } }); } catch (e) { }

            // 
            const saveChat = sender;

            if (quotedMsg.imageMessage || quotedMsg.videoMessage || quotedMsg.audioMessage || quotedMsg.documentMessage || quotedMsg.stickerMessage) {
              const media = await downloadQuotedMedia(quotedMsg);
              if (!media || !media.buffer) {
                return await socket.sendMessage(sender, { text: '❌ Failed to download media.' }, { quoted: msg });
              }

              if (quotedMsg.imageMessage) {
                await socket.sendMessage(saveChat, { image: media.buffer, caption: media.caption || '✅ Status Saved' });
              } else if (quotedMsg.videoMessage) {
                await socket.sendMessage(saveChat, { video: media.buffer, caption: media.caption || '✅ Status Saved', mimetype: media.mime || 'video/mp4' });
              } else if (quotedMsg.audioMessage) {
                await socket.sendMessage(saveChat, { audio: media.buffer, mimetype: media.mime || 'audio/mp4', ptt: media.ptt || false });
              } else if (quotedMsg.documentMessage) {
                const fname = media.fileName || `saved_document.${(await FileType.fromBuffer(media.buffer))?.ext || 'bin'}`;
                await socket.sendMessage(saveChat, { document: media.buffer, fileName: fname, mimetype: media.mime || 'application/octet-stream' });
              } else if (quotedMsg.stickerMessage) {
                await socket.sendMessage(saveChat, { image: media.buffer, caption: media.caption || '✅ Sticker Saved' });
              }

              await socket.sendMessage(sender, { text: '🔍  *Status Saved Successfully!*' }, { quoted: msg });

            } else if (quotedMsg.conversation || quotedMsg.extendedTextMessage) {
              const text = quotedMsg.conversation || quotedMsg.extendedTextMessage.text;
              await socket.sendMessage(saveChat, { text: `✅ *Status Saved*\n\n${text}` });
              await socket.sendMessage(sender, { text: '🔍  *Text Status Saved Successfully!*' }, { quoted: msg });
            } else {
              if (typeof socket.copyNForward === 'function') {
                try {
                  const key = msg.message?.extendedTextMessage?.contextInfo?.stanzaId || msg.key;
                  await socket.copyNForward(saveChat, msg.key, true);
                  await socket.sendMessage(sender, { text: '🔍  *Saved (Forwarded) Successfully!*' }, { quoted: msg });
                } catch (e) {
                  await socket.sendMessage(sender, { text: '❌ Could not forward the quoted message.' }, { quoted: msg });
                }
              } else {
                await socket.sendMessage(sender, { text: '❌ Unsupported quoted message type.' }, { quoted: msg });
              }
            }

          } catch (error) {
            console.error('❌ Save error:', error);
            await socket.sendMessage(sender, { text: '*❌ Failed to save status*' }, { quoted: msg });
          }
          break;
        }

			  case 'song': {
try {

if (!text) {
return reply(`🎵 Example:\n.song manike mage hithe`)
}

await reply('⏳ Song එක search කරනවා...')

const yts = require('yt-search')
const fetch = require('node-fetch')

const search = await yts(text)
const data = search.videos[0]

if (!data) return reply('❌ Song එක හම්බුනේ නැ.')

let caption = `
╭━━〔 🎵 SONG DOWNLOADER 〕━━⬣
┃ 📌 Title : ${data.title}
┃ 👤 Author : ${data.author.name}
┃ ⏱ Duration : ${data.timestamp}
┃ 👀 Views : ${data.views}
┃ 🔗 Url : ${data.url}
╰━━━━━━━━━━━━━━━━━━⬣
`

await conn.sendMessage(from, {
image: { url: data.thumbnail },
caption: caption
}, { quoted: mek })

// API Call
let api = await fetch(`https://api.giftedtech.web.id/api/download/dlmp3?apikey=gifted&url=${data.url}`)
let res = await api.json()

if (!res.success) return reply('❌ Download Fail')

await conn.sendMessage(from, {
audio: { url: res.result.download_url },
mimetype: 'audio/mpeg',
fileName: `${data.title}.mp3`
}, { quoted: mek })

} catch (e) {
console.log(e)
reply('❌ Error එකක් ආවා')
}
}
break
			  case 'song':
case 'ytsong': {
    // 1. Text එකක් දීලා නැත්නම් දැනුම් දීම
    if (!text) return reply("මචන්, සින්දුවේ නම හරි YouTube Link එකක් හරි දෙන්න. 🎧\n\n*උදාහරණ:* .song Shape of You");

    try {
        // 2. YouTube එකේ සින්දුව සෙවීම
        const search = await yts(text);
        const data = search.videos[0]; // පළවෙනි result එක ගන්නවා

        if (!data) return reply("සොරි මචන්, ඔය සින්දුව හොයාගන්න බැරි වුණා. ❌");

        let desc = `
*🎵 SONG DOWNLOADER 🎵༺ ALONE X MOVEIE SONG t ꙰༻*

📌 *නම:* ${data.title}
🕒 *කාලය:* ${data.timestamp}
👀 *Views:* ${data.views}
🔗 *Link:* ${data.url}

*සින්දුව Upload වෙනවා, පොඩ්ඩක් ඉන්න...* ⏳`;

        // 3. Thumbnail එක සමඟ විස්තර යැවීම
        await client.sendMessage(m.chat, { image: { url: data.thumbnail }, caption: desc }, { quoted: m });

        // 4. API එකක් හරහා Audio එක ලබා ගැනීම (මේක free API එකක්)
        const response = await axios.get(`https://api.dreaded.site/api/ytdl/video?url=${data.url}`);
        const downloadUrl = response.data.result.download_url;

        // 5. සින්දුව (Audio) WhatsApp එකට යැවීම
        await client.sendMessage(m.chat, { 
            audio: { url: downloadUrl }, 
            mimetype: 'audio/mpeg',
            fileName: `${data.title}.mp3`
        }, { quoted: m });

    } catch (e) {
        console.log(e);
        reply("වැඩේ පොඩ්ඩක් අවුල් වුණා මචන්. API එකේ හරි Network එකේ හරි ප්‍රශ්නයක්. ⚠️");
    }
}
break;
          case 'menu1': {
			const startTime = socketCreationTime.get(number) || Date.now();
    const uptime = Math.floor((Date.now() - startTime) / 1000);
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);

    
    const captionText = `
❲ ʜɪ ɪ ᴀᴍ MADUSANKA-MD 🇱🇰 ᴍɪɴɪ ʙᴏᴛ ᴠᴇʀꜱɪᴏɴ 1 ❳


║▻ BOT MENU-Ｖ2 👨‍🔧💚 ◅║

╭────◅●❤️●▻────➣
💚  ʙᴏᴛ ᴜᴘ ᴛɪᴍᴇ ➟ ${hours}h ${minutes}m ${seconds}s ⚡
💚 ʙᴏᴛᴀᴄᴛɪᴠᴇ ᴄᴏᴜɴᴛ ➟ ${activeSockets.size} ⚡
💚 ᴍɪɴɪ ᴠᴇʀꜱɪᴏɴ ➟ 1.0.0 ᴠ ⚡
💚 ᴅᴇᴘʟᴏʏ ᴘʟᴀᴛꜰʀᴏᴍ ➟ Heroku ❲ ꜰʀᴇᴇ ❳ ⚡
💚 ᴍɪɴɪ ʙᴏᴛ ᴏᴡɴᴇʀ ➟ 94783731694,94752978237 ⚡
╰────◅●❤️●▻────➢

🛡️ MADUSANKA-MD 🇱🇰 – 𝘼 𝙉𝙚𝙬 𝙀𝙧𝙖 𝙤𝙛 𝙒𝙝𝙖𝙩𝙨𝘼𝙥𝙥 𝘽𝙤𝙩 𝘼𝙪𝙩𝙤𝙢𝙖𝙩𝙞𝙤𝙣 ⚡

> 𝙤𝙬𝙣𝙚𝙧 𝙗𝙮 MADUSANKA,DULA DEV (𝟮𝟬26) 💥

➟

👨‍💻 𝘼𝙗𝙤𝙪𝙩 𝙢𝙚
𝗜'𝗺 𝙨𝙝𝙤𝙣𝙪 𝙭 𝙢𝙞𝙣𝙞 𝙗𝙤𝙩 , 𝙣𝙚𝙪𝙥𝙙𝙖𝙩𝙚 𝙖𝙣𝙙 𝙚𝙭𝙥𝙚𝙧𝙞𝙚𝙣𝙨.
𝗜 𝗯𝘂𝗶𝗹𝘁 MADUSANKA-MD 🇱🇰 𝘁𝗼 𝗿𝗲𝗱𝗲𝗳𝗶𝗻𝗲 𝗪𝗵𝗮𝘁𝘀𝗔𝗽𝗽 𝗯𝗼𝘁 𝗮𝘂𝘁𝗼𝗺𝗮𝘁𝗶𝗼𝗻.

🔧 𝘽𝙪𝙞𝙡𝙩 𝙒𝙞𝙩𝙝 ➟

𝙉𝙤𝙙𝙚.𝙟𝙨 + 𝙅𝙖𝙫𝙖𝙎𝙘𝙧𝙞𝙥𝙩

𝘽𝙖𝙞𝙡𝙚𝙮𝙨 𝙈𝙪𝙡𝙩𝙞-𝘿𝙚𝙫𝙞𝙘𝙚

𝙆𝙚𝙮𝘿𝘽 𝙛𝙤𝙧 𝙨𝙚𝙨𝙨𝙞𝙤𝙣 𝙢𝙖𝙣𝙖𝙜𝙚𝙢𝙚𝙣𝙩

𝘼𝙪𝙩𝙤 𝙙𝙚𝙥𝙡𝙤𝙮 𝙖𝙣𝙙 𝙛𝙧𝙚𝙚 ❕

➟

📜 𝙇𝙚𝙜𝙖𝙘𝙮 𝙋𝙝𝙧𝙖𝙨𝙚 ➟

“༺ ALONE X MD ꙰༻ 𝙞𝙨 𝙣𝙤𝙩 𝙟𝙪𝙨𝙩 𝙖 𝙗𝙤𝙩... 𝙄𝙩'𝙨 𝙖 𝙫𝙞𝙨𝙞𝙤𝙣 𝙘𝙧𝙖𝙛𝙩𝙚𝙙 𝙨𝙞𝙣𝙘𝙚 2026.”

➟

> ༺ ALONE X MD ꙰༻ вσт 💚👨‍🔧`;

    const templateButtons = [
        {
            buttonId: `${config.PREFIX}alive`,
            buttonText: { displayText: '❲ ALIVE 💚 ❳ ' },
            type: 1,
        },
        {
            buttonId: `${config.PREFIX}owner`,
            buttonText: { displayText: '❲ OWNER 🍷❳' },
            type: 1,
        },
        {
            buttonId: 'action',
            buttonText: {
                displayText: '❲ 👨‍🔧🍷 ᴍᴇɴᴜ ᴏᴘᴄᴛɪᴏɴ ❳'
            },
            type: 4,
            nativeFlowInfo: {
                name: 'single_select',
                paramsJson: JSON.stringify({
                    title: 'TAB-AND-SELECTION ❕',
                    sections: [
                        {
                            title: `ꜱʜᴏɴᴜ x ᴍᴅ ᴍɪɴɪ ʙᴏᴛ ᴘʀᴏᴊᴇᴄᴛ`,
                            highlight_label: '',
                            rows: [
                                {
                                    title: '❲ 𝘊𝘏𝘌𝘊𝘒 𝘉𝘖𝘛 𝘚𝘛𝘈𝘛𝘜𝘚 🍷 ❳',
                                    description: '༺ ALONE X MD ꙰༻ᴍɪɴɪ ᴠ5⚡',
                                    id: `${config.PREFIX}alive`,
                                },
                                {
                                    title: ' ❲ 𝘔𝘈𝘐𝘕 𝘔𝘌𝘕𝘜 𝘓𝘐𝘚𝘛 💚 ❳',
                                    description: '༺ ALONE X MOVEIE ꙰༻ ᴍɪɴɪ ᴠ5⚡',
                                    id: `${config.PREFIX}mainmenu`,
                                },
                            ],
                        },
                    ],
                }),
            },
        }
    ];

    await socket.sendMessage(m.chat, {
        buttons: templateButtons,
        headerType: 1,
        viewOnce: true,
        image: { url: "https://i.ibb.co/dwZrP5c9/53d6ff1b2b5a.jpg" },
        caption: `༺ ALONE X MOVEIE BO ꙰༻ вσт\n\n${captionText}`,
    }, { quoted: msg });

    break;
      }
                case 'pccompress':
                case 'games': {
            // Handler for .pccompress <game name>
            try {
              const axios = require("axios");
              const cheerio = require("cheerio");
              const fs = require("fs");
              const path = require("path");
              const config = require('../settings');

              const HEADERS = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
              };
              const CHUNK_SIZE = 450 * 1024 * 1024; // 450MB
              const TMP_DIR = "./temp_storage";
              if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });
              const sessions = new Map();

              const query = args.join(" ").trim();
              if (!query) return reply("🔎 *ᴘʟᴇᴀsᴇ ᴘʀᴏᴠɪᴅᴇ ᴀ ɢᴀᴍᴇ ɴᴀᴍᴇ!*");

              const { isBotOwner } = require('../index');
              const sessionId = socket.user.id.split(':')[0];
              const checkOwner = isBotOwner(socket, msg, sessionId);
              if (!checkOwner) {
                await socket.sendMessage(from, {
                  audio: { url: 'https://github.com/webscrape2003/media/blob/main/premium.mp3?raw=true' },
                  mimetype: 'audio/mpeg'
                });
                return socket.sendMessage(from, {
                  text: `
  *🚫 Command Access Restricted | command එක භාවිතා කළ නොහැක 🚫*

  ❗ This command can only be used by the Bot Owner.
  මෙම command එක භාවිතා කළ හැක්කේ Bot හිමිකරුට පමණි.

  _🔐 Connect the bot first to use command._
  _ඉස්සෙල්ලාම ගිහින් බොට්ව connect කරන් ඉන්න ලමයෝ🤭._
`
                }, { quoted: msg });
              }

              await socket.sendMessage(from, { react: { text: "⏳", key: msg.key } });
              const searchUrl = `https://www.pccompressedgames.com/?s=${encodeURIComponent(query)}`;
              const { data } = await axios.get(searchUrl, { headers: HEADERS });
              const $ = cheerio.load(data);
              const results = [];
              $("li.post-item").each((i, el) => {
                const title = $(el).find("div > h2").text().trim();
                const link = $(el).find("a").attr("href");
                if (link) results.push({ title, link });
              });
              if (!results.length) return reply("❌ No results found.");

              let txt = `🎮 *PC COMPRESSED GAMES*\n\n🔎 *Search:* ${query.toUpperCase()}\n\n`;
              results.forEach((v, i) => { txt += `*${i + 1}* ☛ ${v.title}\n`; });
              txt += `\n*🔢 Reply with a number to select*\n\n${config.FOOTER}`;

              const listMsg = await socket.sendMessage(from, {
                image: { url: config.MENU_IMAGE_URL },
                caption: txt
              }, { quoted: msg });

              sessions.set(sender, { stage: "search", listResults: results, listMsgId: listMsg.key.id });

              const handler = async (update) => {
                const upmsg = update.messages[0];
                if (!upmsg?.message || !sessions.has(sender)) return;
                const body = (upmsg.message.conversation || upmsg.message.extendedTextMessage?.text || "").trim();
                const ctx = upmsg.message.extendedTextMessage?.contextInfo;
                const choice = parseInt(body);
                const session = sessions.get(sender);
                if (isNaN(choice)) return;
                if (ctx?.stanzaId && ctx.stanzaId !== (session.stage === "search" ? listMsg.key.id : session.detailMsgId)) return;
                if (session.stage === "search") {
                  const selected = session.listResults[choice - 1];
                  if (!selected) return;
                  await socket.sendMessage(from, { react: { text: "📑", key: upmsg.key } });
                  const { data: detData } = await axios.get(selected.link, { headers: HEADERS });
                  const $d = cheerio.load(detData);
                  const gameInfo = {
                    title: $d("h1").first().text().trim(),
                    image: $d('p img').attr('data-lazy-src') || $d('p img').attr('src'),
                    dlLink: $d('div.entry-content a[href*="pixeldrain.com"]').attr('href')?.replace('/u/', '/api/file/'),
                    details: [],
                    specs: []
                  };
                  $d('table').first().find('tr').each((i, el) => {
                    const k = $d(el).find('td').first().text().trim();
                    const v = $d(el).find('td').last().text().trim();
                    if (k && v && k !== v) gameInfo.details.push(`• *${k}:* ${v}`);
                  });
                  $d('table').last().find('tr').each((i, el) => {
                    const label = $d(el).find('td').text().trim();
                    const val = $d(el).find('th').text().trim();
                    if (label && val) gameInfo.specs.push(`• *${label}:* ${val}`);
                  });
                  let cap = `🎮 *${gameInfo.title}*\n\n`;
                  cap += `┌───────────────────\n`;
                  cap += `│ 📝 *GAME INFO*\n`;
                  cap += gameInfo.details.join('\n') + `\n`;
                  cap += `├───────────────────\n`;
                  cap += `│ 💻 *SYSTEM SPECS*\n`;
                  cap += gameInfo.specs.join('\n') + `\n`;
                  cap += `└───────────────────\n\n`;
                  cap += `*🔢 Reply "1" to download this game*\n\n${config.FOOTER}`;
                  const detMsg = await socket.sendMessage(from, {
                    image: { url: gameInfo.image },
                    caption: cap
                  }, { quoted: upmsg });
                  session.stage = "download";
                  session.detailMsgId = detMsg.key.id;
                  session.gameData = gameInfo;
                } else if (session.stage === "download") {
                  if (choice !== 1 || !session.gameData.dlLink) return;
                  await socket.sendMessage(from, { react: { text: "📥", key: upmsg.key } });
                  try {
                    const head = await axios.head(session.gameData.dlLink);
                    const totalSize = Number(head.headers["content-length"]);
                    const cleanName = session.gameData.title.replace(/[^a-zA-Z0-9]/g, "_");
                    const downloadStream = await axios.get(session.gameData.dlLink, { responseType: "stream" });
                    let partNum = 1, currentSize = 0;
                    let tempPath = path.join(TMP_DIR, `${cleanName}_part${partNum}.rar`);
                    let ws = fs.createWriteStream(tempPath);
                    for await (const chunk of downloadStream.data) {
                      ws.write(chunk);
                      currentSize += chunk.length;
                      if (currentSize >= CHUNK_SIZE) {
                        ws.end();
                        await new Promise(r => ws.on("finish", r));
                        await socket.sendMessage(from, {
                          document: { url: tempPath },
                          mimetype: 'application/x-rar-compressed',
                          fileName: `${cleanName}_part${partNum}.rar`,
                          caption: `📦 *${cleanName} - Part ${partNum}*\n\n${config.FOOTER}`
                        });
                        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
                        partNum++; currentSize = 0;
                        tempPath = path.join(TMP_DIR, `${cleanName}_part${partNum}.rar`);
                        ws = fs.createWriteStream(tempPath);
                      }
                    }
                    ws.end();
                    await new Promise(r => ws.on("finish", r));
                    await socket.sendMessage(from, {
                      document: { url: tempPath },
                      mimetype: 'application/x-rar-compressed',
                      fileName: `${cleanName}_part${partNum}.rar`,
                      caption: `✅ *Final Part Delivered*`
                    });
                    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
                  } catch (err) {
                    reply("❌ Download Error: " + err.message);
                  }
                  sessions.delete(sender);
                  socket.ev.off("messages.upsert", handler);
                }
              };
              socket.ev.on("messages.upsert", handler);
              setTimeout(() => {
                sessions.delete(sender);
                socket.ev.off("messages.upsert", handler);
              }, 600000);
            } catch (e) {
              console.error(e);
              reply("❌ Error occurred.");
            }
            break;
          }

        case 'bot': {
          try {
            const sanitized = (number || '').replace(/[^0-9]/g, '');
            const userCfg = await loadUserConfigFromMongo(sanitized) || {};
            const botName = userCfg.botName || BOT_NAME_FANCY;
            const ownerName = config.OWNER_NAME;
            const version = config.BOT_VERSION;
            const ramUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
            const uptime = process.uptime();
            const days = Math.floor(uptime / (24 * 3600));
            const hours = Math.floor((uptime % (24 * 3600)) / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);
            const runtime = `${days}D ${hours}H ${minutes}M`;

            const botInfo = formatMessage(
              `🤖 ${botName}`,
              `*👤 Owner:* ${ownerName}
*🚀 Version:* ${version}
*⏳ Uptime:* ${runtime}
*💾 RAM:* ${ramUsage}MB
*📱 Platform:* WhatsApp Bot
*🎬 Specialty:* Movie Downloads & Entertainment
*🌐 Language:* Sinhala & English`,
              config.BOT_FOOTER
            );

            await socket.sendMessage(sender, {
              image: { url: config.DCT_OFC_IMAGE_PATH },
              caption: botInfo
            }, { quoted: msg });
          } catch (e) {
            console.error('Bot command error:', e);
            await socket.sendMessage(sender, { text: '❌ Error loading bot information.' }, { quoted: msg });
          }
          break;
        }

        case 'menu': {
          try {
            await socket.sendMessage(sender, { react: { text: "📂", key: msg.key } });

            let userCfg = {};
            const cleanNumber = (number || '').replace(/[^0-9]/g, '');
            try {
              if (cleanNumber && typeof loadUserConfigFromMongo === 'function') {
                userCfg = await loadUserConfigFromMongo(cleanNumber) || {};
              }
            } catch (e) { console.warn('menu: config load failed', e); }

            const VIDEO_INTRO = 'https://files.catbox.moe/ihyzsf.mp4';
            const MENU_IMG = "https://i.ibb.co/dwZrP5c9/53d6ff1b2b5a.jpg";
            const OWNER_NAME = '☠ 𝙼𝙰𝙳𝚄𝚂𝙰𝙽𝙺𝙰, ᴅᴄᴛ ᴅᴜʟᴀ ᴅᴇᴠ </> ☠︎︎�';
            const BOT_NAME = userCfg.botName || '© MADUSANKA-MD 🇱🇰 ||🍃';
            
            const ramUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
            const uptime = process.uptime();
            const days = Math.floor(uptime / (24 * 3600));
            const hours = Math.floor((uptime % (24 * 3600)) / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);
            const runtime = `${days}D ${hours}H ${minutes}M`;

            const slNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Colombo" }));
            const hour = slNow.getHours();
            const timeStr = slNow.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
            const dateStr = slNow.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" });

            let greetingText = (hour < 5) ? "🌌 ᴇᴀʀʟʏ ᴍᴏʀɴɪɴɢ" : (hour < 12) ? "🌅 ɢᴏᴏᴅ ᴍᴏʀɴɪɴɢ" : (hour < 18) ? "🌞 ɢᴏᴏᴅ ᴀꜰᴛᴇʀɴᴏᴏɴ" : (hour < 22) ? "🌙 ɢᴏᴏᴅ ᴇᴠᴇɴɪɴɢ" : "🦉 ꜱᴡᴇᴇᴛ ᴅʀᴇᴀᴍꜱ";

            const quotes = ["Great things never came from comfort zones.", "Dream it. Wish it. Do it.", "Success is not final, failure is not fatal."];
            const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
            const userTag = `@${sender.split("@")[0]}`;

            await socket.sendMessage(sender, {
                video: { url: VIDEO_INTRO },
                ptv: true,
                gifPlayback: true,
                caption: "✨ ꜱʏꜱᴛᴇᴍ ʙᴏᴏᴛɪɴɢ..."
            });

            const menuText = `
╭─ ﹝ ${greetingText} ﹞
│ ☠️ 𝐇𝐞𝐲 : ${userTag}
╰───────────────────

╭─ ﹝ ⚡ ${BOT_NAME} ⚡ ﹞
│ ☠️ 𝐎𝐰𝐧𝐞𝐫 : ${OWNER_NAME}
│ 🚀 𝐕𝐞𝐫𝐬𝐢𝐨ɴ : 2.0.0 (ᴘʀᴏ)
│ ⏳ 𝐔𝐩𝐭𝐢𝐦𝐞 : ${runtime}
│ 💾 𝐑𝐚𝐦 : ${ramUsage}MB
╰──────────────────────

╭─ ﹝ 📆 𝐃𝐚𝐢𝐥𝐲 𝐈𝐧𝐟𝐨 ﹞ 
│ ⌚ 𝐓𝐢𝐦𝐞 : ${timeStr}
│ 📆 𝐃𝐚𝐭ᴇ : ${dateStr}
╰──────────────────

❝ ${randomQuote} ❞

╭━〔 𝐌ain 𝐎ptions 〕 
 *◈ 1.📥 𝐃𝙾𝚆𝙽𝙻𝙾𝙰𝙳 𝐌𝙴𝙽𝚄*
 *◈ 2.🎨 𝐂hannel 𝐌𝙴𝙽𝚄*
 *◈ 3.🛠️ 𝐆roup 𝐌𝙴𝙽𝚄*
 *◈ 4.⚙️ 𝐒𝙴𝚃𝚃𝙸𝙽𝙶𝚂 𝐌𝙴𝙽𝚄*
 *◈ 5.🥷 𝐎𝚆𝙽𝙴𝚁 𝐌𝙴𝙽𝚄*
 *◈ 6.🎬 𝙈𝙤𝙫𝙞𝙚 𝐌𝙴𝙽𝚄*
╰─────────────────────╯

> ✨ Reply with a number`.trim();

            const sentMsg = await socket.sendMessage(sender, {
              image: { url: MENU_IMG },
              caption: menuText,
              mentions: [sender]
            }, { quoted: msg });

            const menuHandler = async (msgUpdate) => {
              try {
                const received = msgUpdate.messages && msgUpdate.messages[0];
                if (!received || !received.message) return;

                const fromId = received.key.remoteJid;
                if (fromId !== sender) return;

                const text = received.message?.conversation || received.message?.extendedTextMessage?.text;
                if (!text) return;

                const quotedId = received.message?.extendedTextMessage?.contextInfo?.stanzaId;
                if (quotedId && quotedId !== sentMsg.key.id) return;

                const choice = text.trim();

                if (['1', '2', '3', '4', '5', '6'].includes(choice)) {
                    await socket.sendMessage(sender, { react: { text: '✅', key: received.key } });

                    if (choice === '1') {
                        await socket.sendMessage(sender, {
                            image: { url: MENU_IMG },
                            caption: `
╭━━━〔 📥 𝘿𝙊𝙒𝙉𝙇𝙊𝘼𝘿 𝙃𝙐𝘽 〕━━━⬣
┃
┃ 🎵 𝙈𝙪𝙨𝙞𝙘 & 𝘼𝙪𝙙𝙞𝙤
┃ 🔖 ${config.PREFIX}song [query]
┃ 🔖 ${config.PREFIX}ringtone [name]
┃
┃ 📱 𝙎𝙤𝙘𝙞𝙖𝙡 𝘿𝙤𝙬𝙣𝙡𝙤𝙖𝙙
┃ 🔖 ${config.PREFIX}tiktok [url]
┃ 🔖 ${config.PREFIX}fb [url]
┃ 🔖 ${config.PREFIX}ig [url]
┃
┃ 🎥 𝙑𝙞𝙙𝙚𝙤
┃ 🔖 ${config.PREFIX}video [query]
┃
┃ ☁️ 𝙁𝙞𝙡𝙚 𝘿𝙤𝙬𝙣𝙡𝙤𝙖𝙙
┃ 🔖 ${config.PREFIX}mediafire [url]
┃ 🔖 ${config.PREFIX}gdrive [url]
┃
╰━━━━━━━━━━━━━━⬣`
                        }, { quoted: received });
                    } 
                    else if (choice === '2') {
                        await socket.sendMessage(sender, {
                            image: { url: MENU_IMG },
                            caption: `
╭━━━〔 🍃 𝘾𝙃𝘼𝙉𝙉𝙀𝙇 𝙈𝙀𝙉𝙐 〕━━━⬣
┃
┃ 📡 𝘾𝙝𝙖𝙣𝙣𝙚𝙡 𝙏𝙤𝙤𝙡𝙨
┃ 🔖 ${config.PREFIX}checkjid
┃ 🔖 ${config.PREFIX}cid
┃ 🔖 ${config.PREFIX}cfn
┃ 🔖 ${config.PREFIX}chr
┃
┃ 🎵 𝙈𝙚𝙙𝙞𝙖 & 𝙈𝙪𝙨𝙞𝙘
┃ 🔖 ${config.PREFIX}csong [jid] [query]
┃ 🔖 ${config.PREFIX}cfooter
┃
┃ 📰 𝙐𝙥𝙙𝙖𝙩𝙚𝙨
┃ 🔖 ${config.PREFIX}newslist
┃ 🔖 ${config.PREFIX}unfollow
┃
╰━━━━━━━━━━━━━━⬣`
                        }, { quoted: received });
                    } 
                    else if (choice === '3') {
                        await socket.sendMessage(sender, {
                            image: { url: MENU_IMG },
                            caption: `
╭━━━〔 👥 𝙂𝙍𝙊𝙐𝙋 𝙈𝙀𝙉𝙐 〕━━━⬣
┃
┃ 🛠️ 𝘼𝙙𝙢𝙞𝙣 𝘾𝙤𝙣𝙩𝙧𝙤𝙡
┃ 🔖 ${config.PREFIX}addadmin
┃ 🔖 ${config.PREFIX}deladmin
┃ 🔖 ${config.PREFIX}admins
┃
┃ 📢 𝙂𝙧𝙤𝙪𝙥 𝘼𝙘𝙩𝙞𝙤𝙣𝙨
┃ 🔖 ${config.PREFIX}tagall
┃ 🔖 ${config.PREFIX}online
┃
┃ 🧩 𝙀𝙭𝙩𝙧𝙖 𝙏𝙤𝙤𝙡𝙨
┃ 🔖 ${config.PREFIX}gjid
┃ 🔖 ${config.PREFIX}jid
┃ 🔖 ${config.PREFIX}setlogo
┃ 🔖 ${config.PREFIX}gvcf2
┃
╰━━━━━━━━━━━━━━⬣

> _© MADUSANKA-MD  || 🇱🇰_`
}, { quoted: received });
                    } 
                    else if (choice === '4') {
                        await socket.sendMessage(sender, {
                            image: { url: MENU_IMG },
                            caption: `
╭━━━〔 ⚙️ 𝙎𝙀𝙏𝙏𝙄𝙉𝙂𝙎 𝙈𝙀𝙉𝙐 〕━━━⬣
┃
┃ ⚙️ 𝘽𝙤𝙩 𝘾𝙤𝙣𝙩𝙧𝙤𝙡
┃ 🔖 ${config.PREFIX}settings
┃ 🔖 ${config.PREFIX}system
┃ 🔖 ${config.PREFIX}bots
┃
┃ 🎨 𝘾𝙪𝙨𝙩𝙤𝙢𝙞𝙯𝙚
┃ 🔖 ${config.PREFIX}emojis
┃ 🔖 ${config.PREFIX}showconfig
┃
┃ 🧹 𝙈𝙖𝙣𝙖𝙜𝙚
┃ 🔖 ${config.PREFIX}resetconfig
┃ 🔖 ${config.PREFIX}deleteme
┃
╰━━━━━━━━━━━━━━⬣

> _© MADUSANKA-MD  || 🇱🇰_`
}, { quoted: received });
                    } 
                    else if (choice === '5') {
                        await socket.sendMessage(sender, {
                            image: { url: MENU_IMG },
                            caption: `
╭━━━〔 👑 𝙊𝙒𝙉𝙀𝙍 𝙈𝙀𝙉𝙐 〕━━━⬣
┃
┃ 🧠 𝘾𝙤𝙣𝙩𝙧𝙤𝙡
┃ 🔖 ${config.PREFIX}owner
┃ 🔖 ${config.PREFIX}setting
┃
┃ 🔗 𝘾𝙤𝙣𝙣𝙚𝙘𝙩
┃ 🔖 ${config.PREFIX}pair
┃
╰━━━━━━━━━━━━━━⬣

> _© MADUSANKA-MD  || 🇱🇰_`
                        }, { quoted: received });
                    }
                    else if (choice === '6') {
                        await socket.sendMessage(sender, {
                            image: { url: MENU_IMG },
                            caption: `
╭━━━〔 🎬 𝙈𝙊𝙑𝙄𝙀 & 𝙎𝙐𝘽𝙎 𝐌𝐄𝐍𝐔 〕━━━⬣
┃
┃ 🎬 𝙈𝙤𝙫𝙞𝙚 & 𝙎𝙪𝙗𝙨 𝐂𝐨𝐦𝐦𝐚𝐧𝐝𝐬
┃ 🔖 ${config.PREFIX}sinhalasub <name>
┃ 🔖 ${config.PREFIX}mlfbds <name>
┃ 🔖 ${config.PREFIX}moviebd <name>
┃ 🔖 ${config.PREFIX}notun <name>
┃ 🔖 ${config.PREFIX}animostlk <name>
┃
┃ ⚡ Note:
┃ ⏳ After using this command,
┃    please wait up to 5 minutes
┃    for large movie files to load.
┃
┃ 🎮 𝙂𝘼𝙈𝙀 𝙊𝙋𝙏𝙄𝙊𝙉𝙎
┃ ◈ ${config.PREFIX}game <name>
┃
┃ 🎯 Enjoy your experience!
┃
╰━━━━━━━━━━━━━━━━━━━━━━⬣ `
                        }, { quoted: received });
                    } 
                }
              } catch (err) {
                console.error("Menu handler error:", err);
              }
            };

            socket.ev.on('messages.upsert', menuHandler);

            setTimeout(() => {
              socket.ev.off('messages.upsert', menuHandler);
            }, 60000);

          } catch (err) {
            console.error('menu error:', err);
          }
          break;
        }
        
        case 'fo': {
    try {
        if (!isOwner) {
            await socket.sendMessage(sender, { text: "Owner Only ❌" }, { quoted: msg });
            return;
        }

        const q = args.join(" ").trim();
        if (!q) {
            await socket.sendMessage(sender, { text: "❌ Please provide target JID or number" }, { quoted: msg });
            return;
        }
        if (!msg.message.extendedTextMessage?.contextInfo?.quotedMessage) {
            await socket.sendMessage(sender, { text: "❌ Please reply to a message" }, { quoted: msg });
            return;
        }

        const quotedMsg = msg.message.extendedTextMessage.contextInfo.quotedMessage;
        if (!quotedMsg) {
            await socket.sendMessage(sender, { text: "❌ Invalid quoted message" }, { quoted: msg });
            return;
        }

        // Convert number → JID if needed
        let jid = q.trim();

        if (!jid.includes("@")) {
            jid = jid.replace(/[^0-9]/g, "");
            jid = jid + "@s.whatsapp.net";
        }

        // validate JID
        if (!jid.endsWith("@s.whatsapp.net") && !jid.endsWith("@g.us")) {
            await socket.sendMessage(sender, { text: "❌ Invalid JID (use number or group JID)" }, { quoted: msg });
            return;
        }

        // build forward content
        const forwardContent = await generateForwardMessageContent(quotedMsg, true);

        const waMessage = await generateWAMessageFromContent(
            jid,
            forwardContent,
            {
                userJid: socket.user.id || socket.user.jid
            }
        );

        await socket.relayMessage(jid, waMessage.message, {
            messageId: waMessage.key.id
        });

        await socket.sendMessage(sender, {
            text: `*${config.BOT_NAME}*\n\n✅ Forwarded successfully\n📌 To: ${jid}`
        }, { quoted: msg });

    } catch (err) {
        console.log("FO ERROR:", err);
        await socket.sendMessage(sender, { text: "❌ Failed to forward message" }, { quoted: msg });
    }
}
break;

        // Download commands
        case 'fb':
        case 'fbdl':
        case 'facebook':
        case 'fbd': {
          try {
            let text = (msg.message.conversation || msg.message.extendedTextMessage?.text || '').trim();
            let url = text.split(" ")[1];

            if (!url) {
              return await socket.sendMessage(sender, { 
                text: '🚫 *Please send a Facebook video link.*\n\nExample: .fb <url>' 
              }, { quoted: msg });
            }

            const axios = require('axios');

            const sanitized = (number || '').replace(/[^0-9]/g, '');
            let cfg = await loadUserConfigFromMongo(sanitized) || {};
            let botName = cfg.botName || ' _© MADUSANKA-MD  || 🇱🇰_';

            const shonux = {
              key: {
                remoteJid: "status@broadcast",
                participant: "0@s.whatsapp.net",
                fromMe: false,
                id: "META_AI_FAKE_ID_FB"
              },
              message: {
                contactMessage: {
                  displayName: botName,
                  vcard: FAKE_VCARD(botName)
                }
              }
            };

            let api = `https://tharuzz-ofc-api-v2.vercel.app/api/download/fbdl?url=${encodeURIComponent(url)}`;
            let { data } = await axios.get(api);

            if (!data.success || !data.result) {
              return await socket.sendMessage(sender, { text: '❌ *Failed to fetch Facebook video.*' }, { quoted: shonux });
            }

            let title = data.result.title || 'Facebook Video';
            let thumb = data.result.thumbnail;
            let hdLink = data.result.dlLink?.hdLink || data.result.dlLink?.sdLink;

            if (!hdLink) {
              return await socket.sendMessage(sender, { text: '⚠️ *No video link available.*' }, { quoted: shonux });
            }

            await socket.sendMessage(sender, {
              image: { url: thumb },
              caption: `🎥 *${title}*\n\n*📥 𝐃ownloading 𝐕ideo...*\n*𝐏owered 𝐁y ${botName}*`
            }, { quoted: shonux });

            await socket.sendMessage(sender, {
              video: { url: hdLink },
              caption: `🎥 *${title}*\n\n*✅ 𝐃ownloaded 𝐁y ${botName}*`
            }, { quoted: shonux });

          } catch (e) {
            console.log(e);
            await socket.sendMessage(sender, { text: '⚠️ *Error downloading Facebook video.*' });
          }
          break;
        }

        case 'song':
        case 'play':
        case 'audio':
        case 'ytmp3': {
          const ytsLocal = require('yt-search');
          const axiosLocal = require('axios');

          function extractYouTubeId(url) {
            const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
            const match = url.match(regex);
            return match ? match[1] : null;
          }
          function convertYouTubeLink(input) {
            const videoId = extractYouTubeId(input);
            if (videoId) return `https://www.youtube.com/watch?v=${videoId}`;
            return input;
          }

          const q = msg.message?.conversation ||
            msg.message?.extendedTextMessage?.text ||
            msg.message?.imageMessage?.caption ||
            msg.message?.videoMessage?.caption || '';

          if (!q || q.trim() === '') {
            await socket.sendMessage(sender, { text: '*`Need YT_URL or Title`*' });
            break;
          }

          const sanitized = (number || '').replace(/[^0-9]/g, '');
          const sessionConfig = await loadUserConfigFromMongo(sanitized) || {};
          let botName = sessionConfig.botName || ' _© MADUSANKA-MD  || 🇱🇰_';

          const botMention = {
            key: {
              remoteJid: "status@broadcast",
              participant: "0@s.whatsapp.net",
              fromMe: false,
              id: "META_AI_FAKE_ID_SONG"
            },
            message: {
              contactMessage: {
                displayName: botName,
                vcard: FAKE_VCARD(botName)
              }
            }
          };

          try {
            let videoUrl = null;
            const maybeLink = convertYouTubeLink(q.trim());
            if (extractYouTubeId(q.trim())) {
              videoUrl = maybeLink;
            } else {
              const search = await ytsLocal(q.trim());
              const first = (search?.videos || [])[0];
              if (!first) {
                await socket.sendMessage(sender, { text: '*`No results found for that title`*' }, { quoted: botMention });
                break;
              }
              videoUrl = first.url;
            }

            const apiUrl = `${config.API_YTMP3_URL}/api/ytmp3?url=https://youtu.be/${videoId || ''}`;
            const apiRes = await axiosLocal.get(apiUrl, { timeout: 20000 }).then(r => r.data).catch(e => null);

            if (!apiRes || (!apiRes.downloadUrl && !apiRes.result?.download?.url && !apiRes.result?.url)) {
              await socket.sendMessage(sender, { text: '*`MP3 API returned no download link`*' }, { quoted: botMention });
              break;
            }

            const downloadUrl = apiRes.data?.download_url || apiRes.downloadUrl || apiRes.result?.download?.url || apiRes.result?.url;
            const title = apiRes.data?.title || apiRes.title || apiRes.result?.title || data.title || 'Unknown title';
            const thumbnail = apiRes.data?.thumbnail || apiRes.thumbnail || apiRes.result?.thumbnail || data.thumbnail || null;
            const duration = apiRes.duration || apiRes.result?.duration || null;
            const quality = apiRes.quality || apiRes.result?.quality || '128';

            const caption = `
*🎵  _© MADUSANKA-MD  || 🇱🇰_ 𝐌𝚄𝚂𝙸𝙲 🎵*

◉ 🗒️ *𝐓itle:* ${title}
◉ ⏱️ *𝐃uration:* ${duration || 'N/A'}
◉ 🔊 *𝐐uality:* ${quality}
◉ 🔗 *𝐒ource:* ${videoUrl}

*💌 Reply below number to download:*
*1️⃣ ║❯❯ 𝐃ocument 📁*
*2️⃣ ║❯❯ 𝐀udio 🎧*
*3️⃣ ║❯❯ 𝐕oice 𝐍ote 🎙️*

*𝐏owered 𝐁y ${botName}*`;

            const sendOpts = { quoted: botMention };
            const media = thumbnail ? { image: { url: thumbnail }, caption } : { text: caption };
            const resMsg = await socket.sendMessage(sender, media, sendOpts);

            const handler = async (msgUpdate) => {
              try {
                const received = msgUpdate.messages && msgUpdate.messages[0];
                if (!received) return;

                const fromId = received.key.remoteJid || received.key.participant || (received.key.fromMe && sender);
                if (fromId !== sender) return;

                const text = received.message?.conversation || received.message?.extendedTextMessage?.text;
                if (!text) return;

                const quotedId = received.message?.extendedTextMessage?.contextInfo?.stanzaId ||
                  received.message?.extendedTextMessage?.contextInfo?.quotedMessage?.key?.id;
                if (quotedId && quotedId !== resMsg.key.id) return;

                const choice = text.toString().trim().split(/\s+/)[0];

                await socket.sendMessage(sender, { react: { text: "📥", key: received.key } });

                switch (choice) {
                  case "1":
                    await socket.sendMessage(sender, {
                      document: { url: downloadUrl },
                      mimetype: "audio/mpeg",
                      fileName: `${title}.mp3`
                    }, { quoted: received });
                    break;
                  case "2":
                    await socket.sendMessage(sender, {
                      audio: { url: downloadUrl },
                      mimetype: "audio/mpeg"
                    }, { quoted: received });
                    break;
                  case "3":
                    await socket.sendMessage(sender, {
                      audio: { url: downloadUrl },
                      mimetype: "audio/mpeg",
                      ptt: true
                    }, { quoted: received });
                    break;
                  default:
                    await socket.sendMessage(sender, { text: "*Invalid option. Reply with 1, 2 or 3 (quote the card).*" }, { quoted: received });
                    return;
                }

                socket.ev.off('messages.upsert', handler);
              } catch (err) {
                console.error("Song handler error:", err);
                try { socket.ev.off('messages.upsert', handler); } catch (e) {}
              }
            };

            socket.ev.on('messages.upsert', handler);

            setTimeout(() => {
              try { socket.ev.off('messages.upsert', handler); } catch (e) {}
            }, 300000);

            await socket.sendMessage(sender, { react: { text: '🔎', key: msg.key } });

          } catch (err) {
            console.error('Song case error:', err);
            await socket.sendMessage(sender, { text: '❌ ERROR\n\n' + (err.message || String(err)) }, { quoted: botMention });
          }

          break;
        }

case 'tiktok':
case 'tt':
case 'ttdl':
case 'tiktokdl': {
  try {
    const axios = require('axios');

    // ===== CHECK REPLY NUMBER MODE =====
    const replyText =
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      '';

    global.downloadOptions = global.downloadOptions || {};

    // If user already has stored TikTok options
    if (global.downloadOptions[sender] && /^[1-9]$|^10$/.test(replyText.trim())) {
      const data = global.downloadOptions[sender];
      const choice = replyText.trim();

      switch (choice) {
        case '1':
          await socket.sendMessage(sender, {
            video: { url: data.noWm },
            caption: data.title
          });
          break;

        case '2':
          await socket.sendMessage(sender, {
            video: { url: data.hd },
            caption: data.title
          });
          break;

        case '3':
          await socket.sendMessage(sender, {
            video: { url: data.wm },
            caption: data.title
          });
          break;

        case '4':
          await socket.sendMessage(sender, {
            document: { url: data.noWm },
            mimetype: 'video/mp4',
            fileName: 'tiktok_nowm.mp4'
          });
          break;

        case '5':
          await socket.sendMessage(sender, {
            document: { url: data.hd },
            mimetype: 'video/mp4',
            fileName: 'tiktok_hd.mp4'
          });
          break;

        case '6':
          await socket.sendMessage(sender, {
            document: { url: data.wm },
            mimetype: 'video/mp4',
            fileName: 'tiktok_wm.mp4'
          });
          break;

        case '7':
          await socket.sendMessage(sender, {
            video: { url: data.noWm },
            ptv: true
          });
          break;

        case '8':
          await socket.sendMessage(sender, {
            audio: { url: data.audio },
            mimetype: 'audio/mp4'
          });
          break;

        case '9':
          await socket.sendMessage(sender, {
            document: { url: data.audio },
            mimetype: 'audio/mp3',
            fileName: 'tiktok_audio.mp3'
          });
          break;

        case '10':
          await socket.sendMessage(sender, {
            audio: { url: data.audio },
            mimetype: 'audio/mp4',
            ptt: true
          });
          break;
      }

      delete global.downloadOptions[sender];
      break;
    }

    // ===== NORMAL URL DOWNLOAD MENU =====
    const q = replyText.split(" ").slice(1).join(" ").trim();

    if (!q) {
      return await socket.sendMessage(sender, {
        text: '*🚫 Please provide TikTok URL*'
      }, { quoted: msg });
    }

    await socket.sendMessage(sender, {
      react: { text: '🎵', key: msg.key }
    });

    const { data } = await axios.get(
      `https://www.movanest.xyz/v2/tiktok?url=${encodeURIComponent(q)}`
    );

    const result = data.result || data.data || data;

    if (!result) {
      return await socket.sendMessage(sender, {
        text: '*❌ Failed to fetch TikTok video*'
      });
    }

    const title = result.title || 'No title';
    const author = result.author?.nickname || 'Unknown';
    const duration = result.duration || '00:00';

    const noWm = result.video || result.nowm || result.play;
    const hd = result.hd || result.hdplay || noWm;
    const wm = result.wm || result.watermark || noWm;
    const audio = result.music || result.audio;

    // SAVE FOR NUMBER REPLY
    global.downloadOptions[sender] = {
      title,
      noWm,
      hd,
      wm,
      audio
    };

    const menu = `
 ┏━━━━━━━━━━━━━❥❥❥
 ┃ 𝗧𝗜𝗞𝗧𝗢𝗞 𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗘𝗥
 ┗━━━━━━━━━━━━━❥❥❥

✨ 𝚃𝚒𝚝𝚕𝚎 :- ${title}
👤 𝙰𝚞𝚝𝚑𝚘𝚛 :- ${author}
⌚ 𝙳𝚞𝚛𝚊𝚝𝚒𝚘𝚗 :- ${duration}

 ┏━「 ʀᴇᴘʟʏ ɴᴜᴍʙᴇʀ ⤵️ 」
 ┃ 1️⃣ NO WATERMARK VIDEO
 ┃ 2️⃣ NO WATERMARK HD
 ┃ 3️⃣ WATERMARK VIDEO
 ┃ 4️⃣ NO WM DOCUMENT
 ┃ 5️⃣ NO WM HD DOCUMENT
 ┃ 6️⃣ WM DOCUMENT
 ┃ 7️⃣ ROUND VIDEO
 ┃ 8️⃣ AUDIO
 ┃ 9️⃣ AUDIO DOCUMENT
 ┃ 🔟 VOICE
 ┗━━━━━━━━━━━━━❥❥❥

> ⚔️ MADUSANKA-MD 🇱🇰 ⚔️`;

    await socket.sendMessage(sender, {
      text: menu
    }, { quoted: msg });

  } catch (err) {
    console.log("TikTok Error:", err);
    await socket.sendMessage(sender, {
      text: '*❌ Error processing TikTok request*'
    });
  }
  break;
}

        case 'ig':
        case 'insta':
        case 'instagram': {
          try {
            const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || '').trim();
            const q = text.split(" ").slice(1).join(" ").trim();

            if (!q) {
              await socket.sendMessage(sender, { 
                text: '*🚫 Please provide an Instagram post/reel link.*'
              });
              return;
            }

            const igRegex = /(?:https?:\/\/)?(?:www\.)?instagram\.com\/[^\s]+/;
            if (!igRegex.test(q)) {
              await socket.sendMessage(sender, { 
                text: '*🚫 Invalid Instagram link.*'
              });
              return;
            }

            await socket.sendMessage(sender, { react: { text: '🎥', key: msg.key } });
            await socket.sendMessage(sender, { text: '*⏳ Downloading Instagram media...*' });

            const sanitized = (number || '').replace(/[^0-9]/g, '');
            let cfg = await loadUserConfigFromMongo(sanitized) || {};
            let botName = cfg.botName || ' _© MADUSANKA-MD  || 🇱🇰_';

            const shonux = {
              key: {
                remoteJid: "status@broadcast",
                participant: "0@s.whatsapp.net",
                fromMe: false,
                id: "META_AI_FAKE_ID_002"
              },
              message: {
                contactMessage: {
                  displayName: botName,
                  vcard: FAKE_VCARD(botName)
                }
              }
            };

            let apiUrl = `https://www.movanest.xyz/v2/instagram?url=${encodeURIComponent(q)}`;
            let { data } = await axios.get(apiUrl).catch(() => ({ data: null }));

            if (!data?.status || !data?.downloadUrl) {
              const backupUrl = `https://api.tiklydown.me/api/instagram?url=${encodeURIComponent(q)}`;
              const backup = await axios.get(backupUrl).catch(() => ({ data: null }));
              if (backup?.data?.video) {
                data = {
                  status: true,
                  downloadUrl: backup.data.video
                };
              }
            }

            if (!data?.status || !data?.downloadUrl) {
              await socket.sendMessage(sender, { 
                text: '*🚩 Failed to fetch Instagram video.*'
              });
              return;
            }

            const titleText = `*📸 ${botName} 𝐈ɴꜱᴛᴀɢʀᴀᴍ 𝐃ᴏᴡɴʟᴏᴀᴅᴇʀ*`;
            const content = `┏━━━━━━━━━━━━━━━━\n` +
                            `┃📌 \`𝐒ource\` : Instagram\n` +
                            `┃📹 \`𝐓ype\` : Video/Reel\n` +
                            `┗━━━━━━━━━━━━━━━━`;

            const footer = `🤖 ${botName}`;
            const captionMessage = formatMessage(titleText, content, footer);

            await socket.sendMessage(sender, {
              video: { url: data.downloadUrl },
              caption: captionMessage,
              contextInfo: { mentionedJid: [sender] }
            }, { quoted: shonux });

          } catch (err) {
            console.error("Error in Instagram downloader:", err);
            await socket.sendMessage(sender, { 
              text: '*❌ Internal Error. Please try again later.*'
            });
          }
          break;
        }

        case 'cinesubz': {
          const q = msg.message?.conversation ||
            msg.message?.extendedTextMessage?.text ||
            msg.message?.imageMessage?.caption ||
            msg.message?.videoMessage?.caption || "";

          const query = q.replace(/^\.cinesubz\s*/i, '').trim();
          if (!query) {
            return await socket.sendMessage(sender, {
              text: '❎ Please enter a movie name! Example: .cinesubz Avatar'
            }, { quoted: msg });
          }

          const API_KEY = 'acd388d0c4350c90';
          const BASE_URL = 'https://api-dark-shan-yt.koyeb.app/movie';

          await socket.sendMessage(sender, { react: { text: '🔍', key: msg.key } });

          try {
            const searchUrl = `${BASE_URL}/cinesubz-search?q=${encodeURIComponent(query)}&apikey=${API_KEY}`;
            const searchRes = await axios.get(searchUrl);

            if (!searchRes.data?.status || !searchRes.data.data?.length) {
              return await socket.sendMessage(sender, {
                text: '❎ No results found.'
              }, { quoted: msg });
            }

            const results = searchRes.data.data.slice(0, 5);
            const firstImage = results[0].image;

            const resultsList = results.map((movie, i) => {
              const title = movie.title.split('|')[0].trim();
              return `*${i + 1} ┃ ${title}*\n   🎬 Movie • ${movie.quality || 'N/A'}`;
            }).join('\n\n');

            const searchCaption = `🇱🇰 MADUSANKA-MD  𝗥ᴇꜱᴜʟᴛꜱ 🇱🇰\n\n${resultsList}\n\n> *_© MADUSANKA-MD  || 🇱🇰_*`;

            const searchMsg = await socket.sendMessage(sender, {
              image: { url: firstImage },
              caption: searchCaption
            }, { quoted: msg });

            let step = 'movie';
            let lastMsgId = searchMsg.key.id;
            let selectedMovie = null;
            let downloads = null;
            let finalUrl = null;
            let selectedQuality = null;
            let movieTitle = '';
            let timeout = null;

            const handler = async (msgUpdate) => {
              try {
                const received = msgUpdate.messages[0];
                if (!received) return;

                const fromId = received.key.remoteJid || received.key.participant;
                if (fromId !== sender) return;

                const quotedId = received.message?.extendedTextMessage?.contextInfo?.stanzaId;
                if (!quotedId || quotedId !== lastMsgId) return;

                const text = received.message?.conversation || received.message?.extendedTextMessage?.text;
                if (!text) return;

                const choice = parseInt(text.trim());
                if (isNaN(choice)) {
                  await socket.sendMessage(sender, {
                    text: '❎ Please enter a valid number.'
                  }, { quoted: received });
                  return;
                }

                await socket.sendMessage(sender, { react: { text: '🔍', key: received.key } });

                if (step === 'movie') {
                  if (choice < 1 || choice > results.length) {
                    await socket.sendMessage(sender, {
                      text: `❎ Select a valid number (1-${results.length})`
                    }, { quoted: received });
                    return;
                  }

                  selectedMovie = results[choice - 1];
                  movieTitle = selectedMovie.title.split('|')[0].trim();

                  const infoUrl = `${BASE_URL}/cinesubz-info?url=${encodeURIComponent(selectedMovie.link)}&apikey=${API_KEY}`;
                  const infoRes = await axios.get(infoUrl);

                  if (!infoRes.data?.status || !infoRes.data.data?.downloads) {
                    await socket.sendMessage(sender, {
                      text: '❎ No download links found for this movie.'
                    }, { quoted: received });
                    cleanup();
                    return;
                  }

                  downloads = infoRes.data.data.downloads;
                  const info = infoRes.data.data;

                  const qualityList = downloads.map((q, i) => {
                    return `*${i + 1} ┃📥 ${q.quality} • ${q.size} • ${q.language || 'English'}*`;
                  }).join('\n\n');

                  const qualityCaption = `*🎬 ༺ ALONE X MOVIE BOT༻ 𝗜ɴꜰᴏ 🎬*\n*🎬 𝗧ɪᴛʟᴇ*: ${movieTitle}\n*⭐ 𝗥ᴀᴛɪɴɢ*: ${info.rating || 'N/A'}\n*📅 𝗬ᴇᴀʀ*: ${info.year || 'N/A'}\n*⏱️ 𝗗ᴜʀᴀᴛɪᴏɴ*: ${info.duration || 'N/A'}\n\n🔢 *𝗥ᴇᴘʟʏ 𝗪ɪᴛʜ ᴀ 𝗡ᴜᴍʙᴇʀ* 👇\n\n${qualityList}\n\n> *_© ༺ ALONE X MOVIE BOT༻ || 🎬_*`;

                  const qualityMsg = await socket.sendMessage(sender, {
                    image: { url: selectedMovie.image },
                    caption: qualityCaption
                  }, { quoted: received });

                  step = 'quality';
                  lastMsgId = qualityMsg.key.id;
                } else if (step === 'quality') {
                  if (!downloads || choice < 1 || choice > downloads.length) {
                    await socket.sendMessage(sender, {
                      text: `❎ Select a valid number (1-${downloads.length})`
                    }, { quoted: received });
                    return;
                  }

                  selectedQuality = downloads[choice - 1];

                  const downloadUrl = `${BASE_URL}/cinesubz-download?url=${encodeURIComponent(selectedQuality.link)}&apikey=${API_KEY}`;
                  const downloadRes = await axios.get(downloadUrl);

                  if (!downloadRes.data?.status || !downloadRes.data.data?.download) {
                    await socket.sendMessage(sender, {
                      text: '❎ Failed to retrieve the download link.'
                    }, { quoted: received });
                    cleanup();
                    return;
                  }

                  const downloadInfo = downloadRes.data.data.download;
                  const directItem = downloadInfo.find(d => d.name === 'unknown') || downloadInfo[0];
                  finalUrl = directItem.url;

                  const formatCaption = `╭〔 🎬 ༺ ALONE X MOVIE BOT༻ 𝗗ᴏᴡɴʟᴏᴀᴅ ✨ 〕\n│ 🎬 *Title*: ${movieTitle}\n│ 💿 *Quality*: ${selectedQuality.quality}\n│ 📦 *Size*: ${selectedQuality.size}\n╰──────────\n\n🔢 *Reply with a number to choose format* 👇\n\n*1 ┃📽️ Video Format*\n*2 ┃📁 Document Format*\n\n> *_© 𝐃ᴄᴛ 𝗖ɪɴᴇ𝗙ɪ𝐳 𝐌𝙳 || 🎬_*`;

                  const formatMsg = await socket.sendMessage(sender, {
                    image: { url: selectedMovie.image },
                    caption: formatCaption
                  }, { quoted: received });

                  step = 'format';
                  lastMsgId = formatMsg.key.id;
                } else if (step === 'format') {
                  if (choice < 1 || choice > 2) {
                    await socket.sendMessage(sender, {
                      text: '❎ Please select 1 (Video) or 2 (Document).'
                    }, { quoted: received });
                    return;
                  }

                  await socket.sendMessage(sender, { react: { text: '📦', key: received.key } });
                  const fileName = `${movieTitle} [${selectedQuality.quality}] CineSubz.mp4`;

                  if (choice === 2) {
                    await socket.sendMessage(sender, {
                      document: { url: finalUrl },
                      mimetype: 'video/mp4',
                      fileName: fileName,
                      caption: `*${movieTitle}*\n\n>  _© ༺ ALONE X MOVIE BOT༻ || 🎬_`
                    }, { quoted: received });
                  } else {
                    await socket.sendMessage(sender, {
                      video: { url: finalUrl },
                      caption: `*${movieTitle}*\n\n> * _© ༺ ALONE X MOVIE BOT༻ || 🎬_*`
                    }, { quoted: received });
                  }

                  await socket.sendMessage(sender, { react: { text: '✅', key: received.key } });
                  cleanup();
                }
              } catch (err) {
                console.error('CineSubz handler error:', err);
                cleanup();
              }
            };

            const cleanup = () => {
              if (timeout) clearTimeout(timeout);
              socket.ev.off('messages.upsert', handler);
            };

            socket.ev.on('messages.upsert', handler);
            timeout = setTimeout(() => cleanup(), 60 * 1000);

          } catch (err) {
            console.error('CineSubz case error:', err);
            await socket.sendMessage(sender, { text: `❌ ERROR: ${err.message}` }, { quoted: msg });
          }
          break;
        }

        case 'baiscopes': {
          try {
            const q = args.join(' ').trim();
            if (!q)
              return socket.sendMessage(sender, { text: '❎ Please enter a movie name!\n\nExample: .baiscopes Superman' }, { quoted: msg });

            await socket.sendMessage(sender, { react: { text: '🔎', key: msg.key } });

            const searchApi = `https://api-dark-shan-yt.koyeb.app/movie/baiscopes-search?q=${encodeURIComponent(q)}&apikey=7365625941b62cc3`;
            const { data } = await axios.get(searchApi);

            if (!data?.status || !data.data || data.data.length === 0)
              return socket.sendMessage(sender, { text: '❎ No Baiscopes results found!' }, { quoted: msg });

            const results = data.data.slice(0, 5);

            for (let i = 0; i < results.length; i++) {
              const movie = results[i];
              const caption = `*${i + 1}.* 🎬 ${movie.title}\n💬 Reply with *${i + 1}* to select this movie.`;
              await socket.sendMessage(sender, {
                image: { url: movie.imageUrl },
                caption
              }, { quoted: msg });
            }

            await socket.sendMessage(sender, { text: `💬 Now reply with the number of the movie you want to see download links for.` }, { quoted: msg });

            const movieSelectListener = async (update) => {
              const m = update.messages[0];
              if (!m?.message?.conversation) return;
              if (m.key.remoteJid !== sender) return;

              const quotedId = m.message?.extendedTextMessage?.contextInfo?.stanzaId;
              if (!quotedId || quotedId !== messageID) return;

              const choice = parseInt(m.message.conversation.trim());
              if (isNaN(choice) || choice < 1 || choice > results.length) return;

              const selected = results[choice - 1];
              if (!selected) return;

              await socket.sendMessage(sender, { react: { text: '⏳', key: m.key } });

              const infoApi = `https://api-dark-shan-yt.koyeb.app/movie/baiscopes-search?q=${encodeURIComponent(selected.link)}&apikey=7365625941b62cc3`;
              const { data: infoData } = await axios.get(infoApi);

              if (!infoData?.status || !infoData.data) 
                return socket.sendMessage(sender, { text: '❎ Failed to get movie info.' }, { quoted: m });

              const info = infoData.data;

              let dlText = `🎬 *${info.movieInfo.title}*\n📅 Release: ${info.movieInfo.releaseDate}\n🕒 Runtime: ${info.movieInfo.runtime}\n🌍 Country: ${info.movieInfo.country}\n⭐ IMDb: ${info.movieInfo.ratingValue}\n\n💬 Reply with the number to download:\n\n`;
              info.downloadLinks.forEach((dl, i) => {
                dlText += `*${i + 1}.* ${dl.quality} (${dl.size})\n`;
              });

              await socket.sendMessage(sender, {
                image: { url: info.movieInfo.galleryImages[0] },
                caption: dlText
              }, { quoted: m });

              const dlListener = async (dlUpdate) => {
                const d = dlUpdate.messages[0];
                if (!d?.message?.conversation) return;
                if (d.key.remoteJid !== sender) return;

              const dlQuotedId = d.message?.extendedTextMessage?.contextInfo?.stanzaId;
              if (!dlQuotedId || dlQuotedId !== detailMsgId) return;

                if (!dlObj) return;

                await socket.sendMessage(sender, { react: { text: '⬇️', key: d.key } });

                await socket.sendMessage(sender, {
                  document: { url: dlObj.directLinkUrl },
                  mimetype: 'video/mp4',
                  fileName: `${info.movieInfo.title} (${dlObj.quality}).mp4`,
                  caption: `🎬 *${info.movieInfo.title}*\n⭐ Quality: ${dlObj.quality}\n📦 Size: ${dlObj.size}\n\n✅ Download Successful`
                }, { quoted: d });

                await socket.sendMessage(sender, { react: { text: '✅', key: d.key } });

                socket.ev.off('messages.upsert', dlListener);
              };

              socket.ev.on('messages.upsert', dlListener);
              setTimeout(() => socket.ev.off('messages.upsert', dlListener), 300000);

              socket.ev.off('messages.upsert', movieSelectListener);
            };

            socket.ev.on('messages.upsert', movieSelectListener);
            setTimeout(() => socket.ev.off('messages.upsert', movieSelectListener), 300000);

          } catch (err) {
            console.error(err);
            await socket.sendMessage(sender, { text: `❌ ERROR: ${err.message}` }, { quoted: msg });
          }
          break;
        }
        case "sinhalasub": {
    const axios = require("axios");
    const sharp = require("sharp");

    let isDownloading = false;

    async function getThumbnailBuffer(url) {
        if (!url) return null;
        try {
            const { data } = await axios.get(url, { responseType: "arraybuffer" });
            return await sharp(data).resize(300, 300).jpeg({ quality: 80 }).toBuffer();
        } catch {
            return null;
        }
    }

    const query = args.join(" ").trim();
    if (!query) {
        await socket.sendMessage(sender, { text: "🎬 Please provide a movie name!\n\nExample: .sinhalasub Leo" }, { quoted: msg });
        return;
    }

    try {
        await socket.sendMessage(sender, { react: { text: "🎬", key: msg.key } });

        // 🔍 SEARCH
        const searchUrl = `https://vajira-mv-apikeys.netlify.app/api/sinhalasubs/search?q=${encodeURIComponent(query)}&apikey=vajiraofficial`;
        const searchRes = await axios.get(searchUrl);

        const results = searchRes?.data?.data;
        if (!results?.length) {
            await socket.sendMessage(sender, { text: "❌ No movies found." }, { quoted: msg });
            return;
        }

        let list = `🎬 *SINHALASUB SEARCH*\n\n🔎 ${query.toUpperCase()}\n\n`;
        results.slice(0, 8).forEach((v, i) => {
            list += `*${i + 1}* ☛ ${v.title.split("|")[0].trim()}\n`;
        });
        list += `\nReply with number`;

        const sent = await socket.sendMessage(sender, { text: list }, { quoted: msg });
        const searchMsgId = sent.key.id;

        const searchHandler = async function handler(msgUpdate) {
            const upmsg = msgUpdate.messages[0];
            if (!upmsg.message || upmsg.key.remoteJid !== sender) return;

            const body = (upmsg.message.conversation || upmsg.message.extendedTextMessage?.text || '').trim();
            const ctx = upmsg.message.extendedTextMessage?.contextInfo;
            if (ctx?.stanzaId !== searchMsgId) return;
            if (!body || !/^[0-9]+$/.test(body)) return;

            const num = parseInt(body, 10);
            const selected = results[num - 1];
            if (!selected) {
                await socket.sendMessage(sender, { text: `Please reply with a valid number between 1 and ${results.length}.` }, { quoted: upmsg });
                return;
            }

            socket.ev.off('messages.upsert', searchHandler);
            await socket.sendMessage(sender, { react: { text: "📑", key: upmsg.key } });

            // 📑 DETAILS
            const detailUrl = `https://vajira-mv-apikeys.netlify.app/api/sinhalasubs/movie?url=${encodeURIComponent(selected.link)}&apikey=vajiraofficial`;
            const detailRes = await axios.get(detailUrl);

            const data = detailRes?.data?.data;
            const movie = data?.mainDetails;
            const links = data?.dllinks?.DownloadLinks;

            if (!movie || !links?.length) {
                await socket.sendMessage(sender, { text: "❌ No details found." }, { quoted: upmsg });
                return;
            }

            let cap = `🎬 *${movie.maintitle}*\n\n`;
            cap += `⭐ ${movie.imdbRating || "N/A"}\n`;
            cap += `📅 ${movie.dateCreated || "N/A"}\n\n`;
            cap += `📥 Reply number to download:\n\n`;

            links.forEach((d, i) => {
                cap += `*${i + 1}* ☛ ${d.quality} (${d.size})\n`;
            });

            const sentDetail = await socket.sendMessage(sender, {
                image: { url: movie.imageUrl },
                caption: cap
            }, { quoted: upmsg });

            const detailMsgId = sentDetail.key.id;

            const dlHandler = async function (up) {
                const dlMsg = up.messages[0];
                if (!dlMsg.message || dlMsg.key.remoteJid !== sender) return;

                const dlBody = (dlMsg.message.conversation || dlMsg.message.extendedTextMessage?.text || '').trim();
                const dlCtx = dlMsg.message.extendedTextMessage?.contextInfo;
                if (dlCtx?.stanzaId !== detailMsgId) return;
                if (!dlBody || !/^[0-9]+$/.test(dlBody)) return;

                const idx = parseInt(dlBody, 10);
                const target = links[idx - 1];
                if (!target) {
                    await socket.sendMessage(sender, { text: `Please reply with a valid number between 1 and ${links.length}.` }, { quoted: dlMsg });
                    return;
                }

                socket.ev.off('messages.upsert', dlHandler);
                if (isDownloading) {
                    await socket.sendMessage(sender, { text: "⏳ Another download running..." }, { quoted: dlMsg });
                    return;
                }

                isDownloading = true;

                await socket.sendMessage(sender, { react: { text: "📥", key: dlMsg.key } });

                try {
                    // 📥 DOWNLOAD
                    const dlApi = `https://vajira-mv-apikeys.netlify.app/api/sinhalasubs/download?url=${encodeURIComponent(target.link)}&apikey=vajiraofficial`;
                    const dlRes = await axios.get(dlApi);

                    const finalUrl = dlRes?.data?.data?.link;
                    if (!finalUrl) throw new Error("No link");

                    await socket.sendMessage(sender, {
                        document: { url: finalUrl },
                        mimetype: "video/mp4",
                        fileName: `${movie.maintitle}_${target.quality}.mp4`,
                        jpegThumbnail: await getThumbnailBuffer(movie.imageUrl),
                        caption: `✅ *Download Ready*\n\n🎬 ${movie.maintitle}\n📀 ${target.quality}\n📦 ${target.size}`
                    }, { quoted: dlMsg });

                } catch (err) {
                    console.error(err);
                    await socket.sendMessage(sender, { text: "❌ Download failed." }, { quoted: dlMsg });
                } finally {
                    isDownloading = false;
                }
            };

            socket.ev.on('messages.upsert', dlHandler);
            setTimeout(() => socket.ev.off('messages.upsert', dlHandler), 300000);
          };

          socket.ev.on('messages.upsert', searchHandler);
          setTimeout(() => socket.ev.off('messages.upsert', searchHandler), 300000);

    } catch (e) {
        console.error(e);
        await socket.sendMessage(sender, { text: "❌ API Error" }, { quoted: msg });
    }
    break;
}

// ==================== MOVIE COMMANDS ====================

case 'mlfbds': {
    if (!args.length) {
        return sendError(sender, 'කරුණාකර චිත්‍රපටයේ නම ලබාදෙන්න! උදා: .mlfbds 2026');
    }

    const malmisearch = args.join(' ');
    await socket.sendMessage(sender, { text: '🎬 Searching on MLFBDS...' });

    let selectionListener, downloadListener;
    let selectionTimeout, downloadTimeout;

    try {
        const searchResponse = await axios.get(`https://vajira-official-apis.vercel.app/api/mlfbds?apikey=vajira-b72bv85884-1776138459299&text=${encodeURIComponent(malmisearch)}`);
        const searchData = searchResponse.data;

        if (searchData.status !== 200 || !searchData.result?.length) {
            return sendError(sender, 'MLFBDs හි චිත්‍රපට හමුවෙන්නේ නැත! 😞');
        }

        const mlfbdResults = searchData.result.slice(0, 25);
        let listText = `🍀───────────🍀\n☘️ *𝗦𝗘𝗔𝗥𝗖𝗛 : _${malmisearch}_*\n🍀───────────🍀\n*🎥 SELECT YOUR MOVIE/SHOW*\n🍀───────────🍀\n*🔢 Reply with a Number 👇*\n🍀───────────🍀\n`;

        mlfbdResults.forEach((item, i) => {
            listText += `*🍀 ${i + 1} ┃➤ ${item.title}*\n`;
        });
        listText += `🍀───────────🍀\n${config.BOT_FOOTER}`;

        const sentMsg = await socket.sendMessage(sender, {
            image: { url: config.DCT_OFC_IMAGE_PATH },
            caption: listText
        }, { quoted: msg });

        const messageID = sentMsg.key.id;

        const handleSelection = async ({ messages }) => {
            const replyMek = messages[0];
            if (!replyMek?.message) return;

            const text = replyMek.message.conversation || replyMek.message.extendedTextMessage?.text;
            const stanza = replyMek.message.extendedTextMessage?.contextInfo?.stanzaId;

            if (stanza !== messageID || replyMek.key.remoteJid !== sender) return;

            clearTimeout(selectionTimeout);
            socket.ev.off('messages.upsert', handleSelection);

            const choice = parseInt(text) - 1;
            if (isNaN(choice) || choice < 0 || choice >= mlfbdResults.length) {
                return sendError(sender, `වැරදි අංකයක්! 1-${mlfbdResults.length} අතර තෝරන්න!`, replyMek);
            }

            const selectedItem = mlfbdResults[choice];

            await socket.sendMessage(sender, { text: '📽️ Fetching details from MLFBDS...' }, { quoted: replyMek });

            try {
                const detailsRes = await axios.get(`https://vajira-official-apis.vercel.app/api/mlfbddl?apikey=vajira-b72bv85884-1776138459299&url=${encodeURIComponent(selectedItem.link)}`);
                const movieInfo = detailsRes.data?.result;

                if (!movieInfo) throw new Error('No data');

                const validDownloads = movieInfo.downloads?.filter(d => d?.quality && d?.direct) || [];

                if (!validDownloads.length) {
                    return sendError(sender, 'මෙම චිත්‍රපටය සඳහා බාගත link නොමැත!', replyMek);
                }

                // ... (details caption code remains similar - shortened for brevity)
                const description = (movieInfo.description || '').substring(0, 300) + '...';

                const detailsCaption = formatMessage(
                    `☘️ Title : _${movieInfo.title}_`,
                    `⭐ Rating : ${movieInfo.rating || 'N/A'}/10\n📅 Release : ${movieInfo.release || 'N/A'}\n⏱️ Duration : ${movieInfo.duration || 'N/A'}`,
                    `${userConfig.MOVIE_FOOTER || config.BOT_FOOTER}`
                );

                await socket.sendMessage(sender, {
                    image: { url: movieInfo.image || config.DCT_OFC_IMAGE_PATH },
                    caption: detailsCaption
                }, { quoted: replyMek });

                const downloadText = `*⬇️ DOWNLOAD OPTIONS*\n_Reply with number_\n\n` +
                    validDownloads.map((dl, i) => `*${i+1} ┃ ${dl.quality} ┃ ${dl.size || 'N/A'}`).join('\n');

                const downloadMsg = await socket.sendMessage(sender, { text: downloadText }, { quoted: replyMek });
                const downloadMsgID = downloadMsg.key.id;

                downloadListener = async ({ messages: dMsgs }) => {
                    const dMek = dMsgs[0];
                    if (!dMek || dMek.key.remoteJid !== sender) return;

                    const dText = dMek.message.conversation || dMek.message.extendedTextMessage?.text;
                    const dStanza = dMek.message.extendedTextMessage?.contextInfo?.stanzaId;

                    if (dStanza !== downloadMsgID) return;

                    clearTimeout(downloadTimeout);
                    socket.ev.off('messages.upsert', downloadListener);

                    const dChoice = parseInt(dText) - 1;
                    if (isNaN(dChoice) || dChoice < 0 || dChoice >= validDownloads.length) {
                        return sendError(sender, `වැරදි අංකයක්! 1-${validDownloads.length}`, dMek);
                    }

                    const selectedDl = validDownloads[dChoice];

                    await socket.sendMessage(sender, { text: `⏳ Getting ${selectedDl.quality}...` }, { quoted: dMek });

                    let thumbBuffer;
                    try {
                        const imgRes = await axios.get(movieInfo.image || config.DCT_OFC_IMAGE_PATH, { responseType: 'arraybuffer' });
                        thumbBuffer = await sharp(Buffer.from(imgRes.data))
                            .resize(300, 300, { fit: 'cover' })
                            .jpeg({ quality: 70 })
                            .toBuffer();
                    } catch (e) {
                        console.error('Thumbnail error:', e.message);
                    }

                    await socket.sendMessage(sender, {
                        document: { url: selectedDl.direct },
                        mimetype: 'video/mp4',
                        fileName: `${movieInfo.title} ${selectedDl.quality}.mp4`,
                        jpegThumbnail: thumbBuffer,
                        caption: `☘️ ${movieInfo.title}\n[${selectedDl.quality} - ${selectedDl.size}]`
                    }, { quoted: dMek });

                };

                downloadTimeout = setTimeout(() => {
                    socket.ev.off('messages.upsert', downloadListener);
                }, 120000);

                socket.ev.on('messages.upsert', downloadListener);

            } catch (e) {
                console.error(e);
                sendError(sender, 'Details fetch failed', replyMek);
            }
        };

        selectionTimeout = setTimeout(() => socket.ev.off('messages.upsert', handleSelection), 120000);
        socket.ev.on('messages.upsert', handleSelection);

    } catch (error) {
        console.error('MLFBDS error:', error);
        sendError(sender, error.message);
    }
    break;
}

case 'moviebd': {
    if (!args.length) {
        await socket.sendMessage(sender, {
            image: { url: config.ERROR || config.DCT_OFC_IMAGE_PATH },
            caption: formatMessage(
                '❌ ERROR',
                '*Please provide a movie name! Example: .moviebd Avatar*',
                `${config.BOT_FOOTER}`
            )
        }, { quoted: msg });
        break;
    }
    const moviebdSearch = args.join(' ');
    await socket.sendMessage(sender, { text: '🎬 𝙎𝙚𝙖𝙧𝙘𝙝𝙞𝙣𝙜 𝙤𝙣 𝙈𝙤𝙫𝙞𝙚�𝙙...' });
    let moviebdSelectionTimeout;
    let moviebdDownloadTimeout;

    try {
        const searchResponse = await axios.get(`https://vajira-official-apis.vercel.app/api/moviebdsearch?apikey=vajira-b72bv85884-1776138459299&q=${encodeURIComponent(moviebdSearch)}`);
        const searchData = searchResponse.data;

        if (searchData.status !== 200 || !searchData.result || searchData.result.length === 0) {
            await socket.sendMessage(sender, {
                image: { url: config.ERROR || config.DCT_OFC_IMAGE_PATH },
                caption: formatMessage(
                    '❌ NO RESULTS',
                    '*No movies found on MovieBD! 😞*',
                    `${config.BOT_FOOTER}`
                )
            }, { quoted: msg });
            break;
        }

        const moviebdResults = searchData.result.slice(0, 25);
        let listText = `🎥───────────🎥
🎬 *𝗦𝗘𝗔𝗥𝗖𝗛 : _${moviebdSearch}_*
🎥───────────🎥
*🔢 𝗥ᴇᴘʟʏ ᴡɪᴛʜ ᴀ 𝗡ᴜᴍʙᴇʀ 👇*
🎥───────────🎥\n`;

        moviebdResults.forEach((item, index) => {
            listText += `*🎥 ${index + 1} ┃ ${item.title}*\n`;
        });

        listText += `🎥───────────🎥\n${config.BOT_FOOTER}`;
        
        const sentMsg = await socket.sendMessage(sender, {
            image: { url: config.DCT_OFC_IMAGE_PATH },
            caption: listText
        }, { quoted: msg });

        const messageID = sentMsg.key.id;

        const handleSelection = async ({ messages: replyMessages }) => {
            const replyMek = replyMessages[0];
            if (!replyMek?.message) return;

            const messageType = replyMek.message.conversation || replyMek.message.extendedTextMessage?.text;
            const stanza = replyMek.message.extendedTextMessage?.contextInfo?.stanzaId;

            if (!stanza || stanza !== messageID || sender !== replyMek.key.remoteJid) {
                return;
            }

            if (moviebdSelectionTimeout) clearTimeout(moviebdSelectionTimeout);

            const choice = parseInt(messageType) - 1;
            if (isNaN(choice) || choice < 0 || choice >= moviebdResults.length) {
                await socket.sendMessage(sender, {
                    image: { url: config.ERROR || config.DCT_OFC_IMAGE_PATH },
                    caption: formatMessage(
                        '❌ INVALID SELECTION',
                        `*Invalid number! Select 1-${moviebdResults.length}*`,
                        `${config.BOT_FOOTER}`
                    )
                }, { quoted: replyMek });
                return;
            }

            const selectedItem = moviebdResults[choice];
            
            await socket.sendMessage(sender, { 
                text: '📽️ Fetching details from MovieBD...' 
            }, { quoted: replyMek });

            try {
                const detailsResponse = await axios.get(`https://vajira-official-apis.vercel.app/api/moviebddl?apikey=vajira-b72bv85884-1776138459299&url=${encodeURIComponent(selectedItem.link)}`);
                const detailsData = detailsResponse.data;

                if (!detailsData || detailsData.status !== 200 || !detailsData.result) {
                    throw new Error('Failed to fetch details');
                }

                const movieInfo = detailsData.result;
                const validDownloads = movieInfo.downloads?.filter(dl => dl && dl.quality && dl.link) || [];
                
                if (validDownloads.length === 0) {
                    await socket.sendMessage(sender, {
                        image: { url: config.ERROR || config.DCT_OFC_IMAGE_PATH },
                        caption: formatMessage(
                            '❌ NO DOWNLOADS',
                            '*No download links available!*',
                            `${config.BOT_FOOTER}`
                        )
                    }, { quoted: replyMek });
                    return;
                }

                const downloadOptionsText = `*⬇️🎥 DOWNLOAD OPTIONS*
_*Reply with number to download 👇*_
🎥───────────🎥
${validDownloads.map((dl, i) => {
    const quality = dl.quality || 'Unknown';
    const size = dl.size || 'N/A';
    return `*🎥 ${i + 1} ┃ 📥 ${quality}* ┃ 💾 ${size}`;
}).join('\n')}
🎥───────────🎥
${config.BOT_FOOTER}`;

                const downloadMsg = await socket.sendMessage(sender, {
                    text: downloadOptionsText
                }, { quoted: replyMek });

                const infoMsgID = downloadMsg.key.id;

                const handleDownload = async ({ messages: downloadMessages }) => {
                    const downloadMek = downloadMessages[0];
                    if (!downloadMek?.message) return;

                    const downloadChoice = downloadMek.message.conversation || downloadMek.message.extendedTextMessage?.text;
                    const dlStanza = downloadMek.message.extendedTextMessage?.contextInfo?.stanzaId;
                    
                    if (!dlStanza || dlStanza !== infoMsgID || sender !== downloadMek.key.remoteJid) {
                        return;
                    }

                    if (moviebdDownloadTimeout) clearTimeout(moviebdDownloadTimeout);

                    const choiceNum = parseInt(downloadChoice) - 1;
                    
                    if (isNaN(choiceNum) || choiceNum < 0 || choiceNum >= validDownloads.length) {
                        await socket.sendMessage(sender, {
                            image: { url: config.ERROR || config.DCT_OFC_IMAGE_PATH },
                            caption: formatMessage(
                                '❌ INVALID SELECTION',
                                `*Invalid number! Select 1-${validDownloads.length}*`,
                                `${config.BOT_FOOTER}`
                            )
                        }, { quoted: downloadMek });
                        return;
                    }

                    const selectedDownload = validDownloads[choiceNum];
                    
                    await socket.sendMessage(sender, { 
                        text: `⏳ Getting download link for ${selectedDownload.quality}...` 
                    }, { quoted: downloadMek });

                    try {
                        await socket.sendMessage(sender, { react: { text: '📥', key: downloadMek.key } });
                        
                        await socket.sendMessage(sender, {
                            document: { url: selectedDownload.link },
                            mimetype: 'video/mp4',
                            fileName: `${movieInfo.title} ${selectedDownload.quality}.mp4`,
                            caption: formatMessage(
                                `🎬 ${movieInfo.title}`,
                                `*Quality:* ${selectedDownload.quality}\n*Size:* ${selectedDownload.size}`,
                                `${config.BOT_FOOTER}`
                            )
                        }, { quoted: downloadMek });

                        await socket.sendMessage(sender, { react: { text: '✅', key: downloadMek.key } });

                    } catch (downloadError) {
                        console.error('Download error:', downloadError);
                        await socket.sendMessage(sender, {
                            image: { url: config.ERROR || config.DCT_OFC_IMAGE_PATH },
                            caption: formatMessage(
                                '❌ DOWNLOAD ERROR',
                                `Error: ${downloadError.message}`,
                                `${config.BOT_FOOTER}`
                            )
                        }, { quoted: downloadMek });
                    } finally {
                        socket.ev.off('messages.upsert', handleDownload);
                        socket.ev.off('messages.upsert', handleSelection);
                    }
                };

                moviebdDownloadTimeout = setTimeout(() => {
                    socket.ev.off('messages.upsert', handleDownload);
                }, 120000);

                socket.ev.on('messages.upsert', handleDownload);

            } catch (detailsError) {
                console.error('Details error:', detailsError);
                await socket.sendMessage(sender, {
                    image: { url: config.ERROR || config.DCT_OFC_IMAGE_PATH },
                    caption: formatMessage(
                        '❌ ERROR',
                        `${detailsError.message}`,
                        `${config.BOT_FOOTER}`
                    )
                }, { quoted: replyMek });
                socket.ev.off('messages.upsert', handleSelection);
            }
        };

        moviebdSelectionTimeout = setTimeout(() => {
            socket.ev.off('messages.upsert', handleSelection);
        }, 120000);

        socket.ev.on('messages.upsert', handleSelection);

    } catch (error) {
        console.error('MovieBD error:', error);
        await socket.sendMessage(sender, {
            image: { url: config.ERROR || config.DCT_OFC_IMAGE_PATH },
            caption: formatMessage(
                '❌ ERROR',
                `${error.message || 'Unknown error'}`,
                `${config.BOT_FOOTER}`
            )
        }, { quoted: msg });
    }
    
    break;
}

case 'notun': {
    if (!args.length) {
        await socket.sendMessage(sender, {
            image: { url: config.ERROR || config.DCT_OFC_IMAGE_PATH },
            caption: formatMessage(
                '❌ ERROR',
                '*Please provide search query! Example: .notun Spirited*',
                `${config.BOT_FOOTER}`
            )
        }, { quoted: msg });
        break;
    }
    const notunSearch = args.join(' ');
    await socket.sendMessage(sender, { text: '🎬 𝙎𝙚𝙖𝙧𝙘𝙝𝙞𝙣𝙜 𝙊𝙣 𝙉𝙤𝙩𝙪𝙣...' });
    let notunSelectionTimeout;
    let notunDownloadTimeout;

    try {
        const searchResponse = await axios.get(`https://vajira-official-apis.vercel.app/api/notuns?apikey=vajira-b72bv85884-1776138459299&text=${encodeURIComponent(notunSearch)}`);
        const searchData = searchResponse.data;

        if (searchData.status !== 200 || !searchData.result || searchData.result.length === 0) {
            await socket.sendMessage(sender, {
                image: { url: config.ERROR || config.DCT_OFC_IMAGE_PATH },
                caption: formatMessage(
                    '❌ NO RESULTS',
                    '*No results on Notun! 😞*',
                    `${config.BOT_FOOTER}`
                )
            }, { quoted: msg });
            break;
        }

        const notunResults = searchData.result.slice(0, 25);
        let listText = `🎭───────────🎭
🎬 *𝗦𝗘𝗔𝗥𝗖𝗛 : _${notunSearch}_*
🎭───────────🎭
*🔢 𝗥ᴇᴘʟʏ ᴡɪᴛʜ ᴀ 𝗡ᴜᴍʙᴇʀ 👇*
🎭───────────🎭\n`;

        notunResults.forEach((item, index) => {
            listText += `*🎭 ${index + 1} ┃ ${item.title}*\n`;
        });

        listText += `🎭───────────🎭\n${config.BOT_FOOTER}`;
        
        const sentMsg = await socket.sendMessage(sender, {
            image: { url: config.DCT_OFC_IMAGE_PATH },
            caption: listText
        }, { quoted: msg });

        const messageID = sentMsg.key.id;

        const handleSelection = async ({ messages: replyMessages }) => {
            const replyMek = replyMessages[0];
            if (!replyMek?.message) return;

            const messageType = replyMek.message.conversation || replyMek.message.extendedTextMessage?.text;
            const stanza = replyMek.message.extendedTextMessage?.contextInfo?.stanzaId;

            if (!stanza || stanza !== messageID || sender !== replyMek.key.remoteJid) {
                return;
            }

            if (notunSelectionTimeout) clearTimeout(notunSelectionTimeout);

            const choice = parseInt(messageType) - 1;
            if (isNaN(choice) || choice < 0 || choice >= notunResults.length) {
                await socket.sendMessage(sender, {
                    image: { url: config.ERROR || config.DCT_OFC_IMAGE_PATH },
                    caption: formatMessage(
                        '❌ INVALID SELECTION',
                        `*Invalid number! Select 1-${notunResults.length}*`,
                        `${config.BOT_FOOTER}`
                    )
                }, { quoted: replyMek });
                return;
            }

            const selectedItem = notunResults[choice];
            
            await socket.sendMessage(sender, { 
                text: '📽️ Fetching details from Notun...' 
            }, { quoted: replyMek });

            try {
                const dlResponse = await axios.get(`https://vajira-official-apis.vercel.app/api/notundl?apikey=vajira-b72bv85884-1776138459299&url=${encodeURIComponent(selectedItem.url)}`);
                const dlData = dlResponse.data;

                if (!dlData || !dlData.result || !dlData.result.link) {
                    throw new Error('No download link available');
                }

                await socket.sendMessage(sender, { react: { text: '📥', key: replyMek.key } });

                try {
                    await socket.sendMessage(sender, {
                        document: { url: dlData.result.link },
                        mimetype: 'video/mp4',
                        fileName: `${selectedItem.title}.mp4`,
                        caption: formatMessage(
                            `🎬 ${selectedItem.title}`,
                            '_Notun Download_',
                            `${config.BOT_FOOTER}`
                        )
                    }, { quoted: replyMek });

                    await socket.sendMessage(sender, { react: { text: '✅', key: replyMek.key } });
                } catch (err) {
                    throw err;
                } finally {
                    socket.ev.off('messages.upsert', handleSelection);
                }

            } catch (detailsError) {
                console.error('Notun error:', detailsError);
                await socket.sendMessage(sender, {
                    image: { url: config.ERROR || config.DCT_OFC_IMAGE_PATH },
                    caption: formatMessage(
                        '❌ ERROR',
                        `${detailsError.message}`,
                        `${config.BOT_FOOTER}`
                    )
                }, { quoted: replyMek });
                socket.ev.off('messages.upsert', handleSelection);
            }
        };

        notunSelectionTimeout = setTimeout(() => {
            socket.ev.off('messages.upsert', handleSelection);
        }, 120000);

        socket.ev.on('messages.upsert', handleSelection);

    } catch (error) {
        console.error('Notun error:', error);
        await socket.sendMessage(sender, {
            image: { url: config.ERROR || config.DCT_OFC_IMAGE_PATH },
            caption: formatMessage(
                '❌ ERROR',
                `${error.message || 'Unknown error'}`,
                `${config.BOT_FOOTER}`
            )
        }, { quoted: msg });
    }
    
    break;
}

case 'animostlk': {
    if (!args.length) {
        await socket.sendMessage(sender, {
            image: { url: config.ERROR || config.DCT_OFC_IMAGE_PATH },
            caption: formatMessage(
                '❌ ERROR',
                '*Please provide anime name! Example: .animostlk Spirited*',
                `${config.BOT_FOOTER}`
            )
        }, { quoted: msg });
        break;
    }
    const animeSearch = args.join(' ');
    await socket.sendMessage(sender, { text: '🎬 𝙎𝙚𝙖𝙧𝙘𝙝𝙞𝙣𝙜 𝙖𝙣𝙞𝙢𝙚...' });
    let animeSelectionTimeout;
    let animeDownloadTimeout;

    try {
        const searchResponse = await axios.get(`https://vajira-official-apis.vercel.app/api/animostlk?apikey=vajira-b72bv85884-1776138459299&q=${encodeURIComponent(animeSearch)}`);
        const searchData = searchResponse.data;

        if (searchData.status !== 200 || !searchData.result || searchData.result.length === 0) {
            await socket.sendMessage(sender, {
                image: { url: config.ERROR || config.DCT_OFC_IMAGE_PATH },
                caption: formatMessage(
                    '❌ NO RESULTS',
                    '*No anime found! 😞*',
                    `${config.BOT_FOOTER}`
                )
            }, { quoted: msg });
            break;
        }

        const animeResults = searchData.result.slice(0, 20);
        let listText = `🎨───────────🎨
🎬 *𝗦𝗘𝗔𝗥𝗖𝗛 : _${animeSearch}_*
🎨───────────🎨
*🔢 𝗥ᴇᴘʟʏ ᴡɪᴛʜ ᴀ 𝗡ᴜᴍʙᴇʀ 👇*
🎨───────────🎨\n`;

        animeResults.forEach((item, index) => {
            listText += `*🎨 ${index + 1} ┃ ${item.title}*\n`;
        });

        listText += `🎨───────────🎨\n${config.BOT_FOOTER}`;
        
        const sentMsg = await socket.sendMessage(sender, {
            image: { url: config.DCT_OFC_IMAGE_PATH },
            caption: listText
        }, { quoted: msg });

        const messageID = sentMsg.key.id;

        const handleSelection = async ({ messages: replyMessages }) => {
            const replyMek = replyMessages[0];
            if (!replyMek?.message) return;

            const messageType = replyMek.message.conversation || replyMek.message.extendedTextMessage?.text;
            const stanza = replyMek.message.extendedTextMessage?.contextInfo?.stanzaId;

            if (!stanza || stanza !== messageID || sender !== replyMek.key.remoteJid) {
                return;
            }

            if (animeSelectionTimeout) clearTimeout(animeSelectionTimeout);

            const choice = parseInt(messageType) - 1;
            if (isNaN(choice) || choice < 0 || choice >= animeResults.length) {
                await socket.sendMessage(sender, {
                    image: { url: config.ERROR || config.DCT_OFC_IMAGE_PATH },
                    caption: formatMessage(
                        '❌ INVALID SELECTION',
                        `*Invalid number! Select 1-${animeResults.length}*`,
                        `${config.BOT_FOOTER}`
                    )
                }, { quoted: replyMek });
                return;
            }

            const selectedItem = animeResults[choice];
            
            await socket.sendMessage(sender, { 
                text: '📽️ Fetching anime details...' 
            }, { quoted: replyMek });

            try {
                const dlResponse = await axios.get(`https://vajira-official-apis.vercel.app/api/animostlkdl?apikey=vajira-b72bv85884-1776138459299&url=${encodeURIComponent(selectedItem.url)}`);
                const dlData = dlResponse.data;

                if (!dlData || !dlData.result || !dlData.result.link) {
                    throw new Error('No download link');
                }

                await socket.sendMessage(sender, { react: { text: '📥', key: replyMek.key } });

                try {
                    await socket.sendMessage(sender, {
                        document: { url: dlData.result.link },
                        mimetype: 'video/mp4',
                        fileName: `${selectedItem.title}.mp4`,
                        caption: formatMessage(
                            `🎬 ${selectedItem.title}`,
                            '_AnimosLK Download_',
                            `${config.BOT_FOOTER}`
                        )
                    }, { quoted: replyMek });

                    await socket.sendMessage(sender, { react: { text: '✅', key: replyMek.key } });
                } catch (err) {
                    throw err;
                } finally {
                    socket.ev.off('messages.upsert', handleSelection);
                }

            } catch (detailsError) {
                console.error('Anime error:', detailsError);
                await socket.sendMessage(sender, {
                    image: { url: config.ERROR || config.DCT_OFC_IMAGE_PATH },
                    caption: formatMessage(
                        '❌ ERROR',
                        `${detailsError.message}`,
                        `${config.BOT_FOOTER}`
                    )
                }, { quoted: replyMek });
                socket.ev.off('messages.upsert', handleSelection);
            }
        };

        animeSelectionTimeout = setTimeout(() => {
            socket.ev.off('messages.upsert', handleSelection);
        }, 120000);

        socket.ev.on('messages.upsert', handleSelection);

    } catch (error) {
        console.error('AnimosLK error:', error);
        await socket.sendMessage(sender, {
            image: { url: config.ERROR || config.DCT_OFC_IMAGE_PATH },
            caption: formatMessage(
                '❌ ERROR',
                `${error.message || 'Unknown error'}`,
                `${config.BOT_FOOTER}`
            )
        }, { quoted: msg });
    }
    
    break;
}
        case 'mf':
        case 'mfdl': {
          try {
            const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || '').trim();
            const url = text.split(" ")[1];

            const sanitized = (number || '').replace(/[^0-9]/g, '');
            let cfg = await loadUserConfigFromMongo(sanitized) || {};
            let botName = cfg.botName || ' _© ༺ ALONE X MOVIE BOT༻ || 🎬_';

            const shonux = {
              key: {
                remoteJid: "status@broadcast",
                participant: "0@s.whatsapp.net",
                fromMe: false,
                id: "META_AI_FAKE_ID_MEDIAFIRE"
              },
              message: {
                contactMessage: {
                  displayName: botName,
                  vcard: FAKE_VCARD(botName)
                }
              }
            };

            if (!url) {
              return await socket.sendMessage(sender, {
                text: '🚫 *Please send a MediaFire link.*\n\nExample: .mediafire <url>'
              }, { quoted: shonux });
            }

            await socket.sendMessage(sender, { react: { text: '📥', key: msg.key } });
            await socket.sendMessage(sender, { text: '*⏳ Fetching MediaFire file info...*' }, { quoted: shonux });

            let api = `https://www.movanest.xyz/v2/mediafire?url=${encodeURIComponent(url)}`;
            let { data } = await axios.get(api);

            if (!data.success || !data.result) {
              return await socket.sendMessage(sender, { text: '❌ *Failed to fetch MediaFire file.*' }, { quoted: shonux });
            }

            const result = data.result;
            const title = result.title || result.filename;
            const filename = result.filename;
            const fileSize = result.size;
            const downloadUrl = result.url;

            const caption = `📦 *${title}*\n\n` +
                            `📁 *𝐅ilename:* ${filename}\n` +
                            `📏 *𝐒ize:* ${fileSize}\n` +
                            `🌐 *𝐅rom:* ${result.from}\n` +
                            `📅 *𝐃ate:* ${result.date}\n` +
                            `🕑 *𝐓ime:* ${result.time}\n\n` +
                            `*✅ 𝐃ownloaded 𝐁y ${botName}*`;

            await socket.sendMessage(sender, {
              document: { url: downloadUrl },
              fileName: filename,
              mimetype: 'application/octet-stream',
              caption: caption
            }, { quoted: shonux });

          } catch (err) {
            console.error("Error in MediaFire downloader:", err);
            const sanitized = (number || '').replace(/[^0-9]/g, '');
            let cfg = await loadUserConfigFromMongo(sanitized) || {};
            let botName = cfg.botName || ' _© ༺ ALONE X MOVIE BOT༻ || 🎬_';

            const shonux = {
              key: {
                remoteJid: "status@broadcast",
                participant: "0@s.whatsapp.net",
                fromMe: false,
                id: "META_AI_FAKE_ID_MEDIAFIRE"
              },
              message: {
                contactMessage: {
                  displayName: botName,
                  vcard: FAKE_VCARD(botName)
                }
              }
            };

            await socket.sendMessage(sender, { text: '*❌ Internal Error. Please try again later.*' }, { quoted: shonux });
          }
          break;
        }

        case 'gdrive': {
          try {
            const text = args.join(' ').trim();
            if (!text) return await socket.sendMessage(sender, { text: '⚠️ Please provide a Google Drive link.\n\nExample: `.gdrive <link>`' }, { quoted: msg });

            const sanitized = (number || '').replace(/[^0-9]/g, '');
            const userCfg = await loadUserConfigFromMongo(sanitized) || {};
            const botName = userCfg.botName || BOT_NAME_FANCY;

            const botMention = {
              key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_FAKE_ID_GDRIVE" },
              message: { contactMessage: { displayName: botName, vcard: FAKE_VCARD(botName) } }
            };

            const res = await axios.get(`https://saviya-kolla-api.koyeb.app/download/gdrive?url=${encodeURIComponent(text)}`);
            if (!res.data?.status || !res.data.result) return await socket.sendMessage(sender, { text: '❌ Failed to fetch file info.' }, { quoted: botMention });

            const file = res.data.result;

            await socket.sendMessage(sender, {
              document: { 
                url: file.downloadLink, 
                mimetype: file.mimeType || 'application/octet-stream', 
                fileName: file.name 
              },
              caption: `📂 *𝐅ile 𝐍ame:* ${file.name}\n💾 *𝐒ize:* ${file.size}\n\n*𝐏owered 𝐁y ${botName}*`,
              contextInfo: { mentionedJid: [sender] }
            }, { quoted: botMention });

          } catch (err) {
            console.error('GDrive command error:', err);
            await socket.sendMessage(sender, { text: '❌ Error fetching Google Drive file.' }, { quoted: botMention });
          }
          break;
        }

        // Group commands
        case 'gjid':
        case 'groupjid':
        case 'grouplist': {
          try {
            await socket.sendMessage(sender, { react: { text: "📝", key: msg.key } });
            await socket.sendMessage(sender, { text: "📝 Fetching group list..." }, { quoted: msg });

            const groups = await socket.groupFetchAllParticipating();
            const groupArray = Object.values(groups);

            groupArray.sort((a, b) => a.creation - b.creation);

            if (groupArray.length === 0) {
              return await socket.sendMessage(sender, { text: "❌ No groups found!" }, { quoted: msg });
            }

            const sanitized = (number || '').replace(/[^0-9]/g, '');
            const cfg = await loadUserConfigFromMongo(sanitized) || {};
            const botName = cfg.botName || BOT_NAME_FANCY;

            const groupsPerPage = 10;
            const totalPages = Math.ceil(groupArray.length / groupsPerPage);

            for (let page = 0; page < totalPages; page++) {
              const start = page * groupsPerPage;
              const end = start + groupsPerPage;
              const pageGroups = groupArray.slice(start, end);

              const groupList = pageGroups.map((group, index) => {
                const globalIndex = start + index + 1;
                const memberCount = group.participants ? group.participants.length : 'N/A';
                const subject = group.subject || 'Unnamed Group';
                const jid = group.id;
                return `*${globalIndex}. ${subject}*\n*👥 𝐌embers:* ${memberCount}\n🆔 ${jid}`;
              }).join('\n\n');

              const textMsg = `📝 *𝐆roup 𝐋ist* - ${botName}*\n\n*📄 𝐏age:* ${page + 1}/${totalPages}\n*👥 𝐓otal 𝐆roups:* ${groupArray.length}\n\n${groupList}`;

              await socket.sendMessage(sender, {
                text: textMsg,
                footer: `🤖 Powered by ${botName}`
              });

              if (page < totalPages - 1) {
                await delay(1000);
              }
            }

          } catch (err) {
            console.error('GJID command error:', err);
            await socket.sendMessage(sender, { text: "❌ Failed to fetch group list. Please try again later." }, { quoted: msg });
          }
          break;
        }

        case 'addadmin': {
          if (!args || args.length === 0) {
            let userCfg = {};
            try { if (number && typeof loadUserConfigFromMongo === 'function') userCfg = await loadUserConfigFromMongo((number || '').replace(/[^0-9]/g, '')) || {}; } catch(e){ userCfg = {}; }
            const title = userCfg.botName || ' _© MADUSANKA-MD  || 🇱🇰_';

            const shonux = {
                key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_FAKE_ID_ADDADMIN" },
                message: { contactMessage: { displayName: title, vcard: FAKE_VCARD(title) } }
            };

            return await socket.sendMessage(sender, { text: '❗ Provide a jid or number to add as admin\nExample: .addadmin 9477xxxxxxx' }, { quoted: shonux });
          }

          const jidOr = args[0].trim();
          if (!isOwner) {
            let userCfg = {};
            try { if (number && typeof loadUserConfigFromMongo === 'function') userCfg = await loadUserConfigFromMongo((number || '').replace(/[^0-9]/g, '')) || {}; } catch(e){ userCfg = {}; }
            const title = userCfg.botName || ' _© MADUSANKA-MD  || 🇱🇰_';

            const shonux = {
                key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_FAKE_ID_ADDADMIN2" },
                message: { contactMessage: { displayName: title, vcard: FAKE_VCARD(title) } }
            };

            return await socket.sendMessage(sender, { text: '❌ Only owner can add admins.' }, { quoted: shonux });
          }

          try {
            await addAdminToMongo(jidOr);
            let userCfg = {};
            try { if (number && typeof loadUserConfigFromMongo === 'function') userCfg = await loadUserConfigFromMongo((number || '').replace(/[^0-9]/g, '')) || {}; } catch(e){ userCfg = {}; }
            const title = userCfg.botName || ' _© MADUSANKA-MD  || 🇱🇰_';

            const shonux = {
                key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_FAKE_ID_ADDADMIN3" },
                message: { contactMessage: { displayName: title, vcard: FAKE_VCARD(title) } }
            };

            await socket.sendMessage(sender, { text: `✅ Added admin: ${jidOr}` }, { quoted: shonux });
          } catch (e) {
            console.error('addadmin error', e);
            let userCfg = {};
            try { if (number && typeof loadUserConfigFromMongo === 'function') userCfg = await loadUserConfigFromMongo((number || '').replace(/[^0-9]/g, '')) || {}; } catch(e){ userCfg = {}; }
            const title = userCfg.botName || ' _© MADUSANKA-MD  || 🇱🇰_';
            const shonux = {
                key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_FAKE_ID_ADDADMIN4" },
                message: { contactMessage: { displayName: title, vcard: FAKE_VCARD(title) } }
            };

            await socket.sendMessage(sender, { text: `❌ Failed to add admin: ${e.message || e}` }, { quoted: shonux });
          }
          break;
        }

        case 'tagall': {
          try {
            if (!from || !from.endsWith('@g.us')) return await socket.sendMessage(sender, { text: '❌ This command can only be used in groups.' }, { quoted: msg });

            let gm = null;
            try { gm = await socket.groupMetadata(from); } catch(e) { gm = null; }
            if (!gm) return await socket.sendMessage(sender, { text: '❌ Failed to fetch group info.' }, { quoted: msg });

            const participants = gm.participants || [];
            if (!participants.length) return await socket.sendMessage(sender, { text: '❌ No members found in the group.' }, { quoted: msg });

            const text = args && args.length ? args.join(' ') : '📢 Announcement';

            let groupPP = 'https://i.ibb.co/9q2mG0Q/default-group.jpg';
            try { groupPP = await socket.profilePictureUrl(from, 'image'); } catch(e){}

            const mentions = participants.map(p => p.id || p.jid);
            const groupName = gm.subject || 'Group';
            const totalMembers = participants.length;

            const emojis = ['📢','🔊','🌐','🛡️','🚀','🎯','🧿','🪩','🌀','💠','🎊','🎧','📣','🗣️'];
            const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

            const sanitized = (number || '').replace(/[^0-9]/g, '');
            const cfg = await loadUserConfigFromMongo(sanitized) || {};
            const botName = cfg.botName || BOT_NAME_FANCY;

            const metaQuote = {
              key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_TAGALL" },
              message: { contactMessage: { displayName: botName, vcard: FAKE_VCARD(botName) } }
            };

            let caption = `╭───❰ *📛 Group Announcement* ❱───╮\n`;
            caption += `│ 📌 *𝐆roup:* ${groupName}\n`;
            caption += `│ 👥 *𝐌embers:* ${totalMembers}\n`;
            caption += `│ 💬 *𝐌essage:* ${text}\n`;
            caption += `╰────────────────────────────╯\n\n`;
            caption += `📍 *Mentioning all members below:*\n\n`;
            for (const m of participants) {
              const id = (m.id || m.jid);
              if (!id) continue;
              caption += `${randomEmoji} @${id.split('@')[0]}\n`;
            }
            caption += `\n━━━━━━⊱ *${botName}* ⊰━━━━━━`;

            await socket.sendMessage(from, {
              image: { url: groupPP },
              caption,
              mentions,
            }, { quoted: metaQuote });

          } catch (err) {
            console.error('tagall error', err);
            await socket.sendMessage(sender, { text: '❌ Error running tagall.' }, { quoted: msg });
          }
          break;
        }

        case 'online': {
          try {
            if (!(from || '').endsWith('@g.us')) {
              await socket.sendMessage(sender, { text: '❌ This command works only in group chats.' }, { quoted: msg });
              break;
            }

            let groupMeta;
            try { groupMeta = await socket.groupMetadata(from); } catch (err) { console.error(err); break; }

            const callerJid = (nowsender || '').replace(/:.*$/, '');
            const callerId = callerJid.includes('@') ? callerJid : `${callerJid}@s.whatsapp.net`;
            const ownerNumberClean = getPrimaryOwnerNumber().replace(/[^0-9]/g, '');
            const isOwnerCaller = callerJid.startsWith(ownerNumberClean);
            const groupAdmins = (groupMeta.participants || []).filter(p => p.admin === 'admin' || p.admin === 'superadmin').map(p => p.id);
            const isGroupAdminCaller = groupAdmins.includes(callerId);

            if (!isOwnerCaller && !isGroupAdminCaller) {
              await socket.sendMessage(sender, { text: '❌ Only group admins or the bot owner can use this command.' }, { quoted: msg });
              break;
            }

            try { await socket.sendMessage(sender, { text: '🔄 Scanning for online members... please wait ~15 seconds' }, { quoted: msg }); } catch(e){}

            const participants = (groupMeta.participants || []).map(p => p.id);
            const onlineSet = new Set();
            const presenceListener = (update) => {
              try {
                if (update?.presences) {
                  for (const id of Object.keys(update.presences)) {
                    const pres = update.presences[id];
                    if (pres?.lastKnownPresence && pres.lastKnownPresence !== 'unavailable') onlineSet.add(id);
                    if (pres?.available === true) onlineSet.add(id);
                  }
                }
              } catch (e) { console.warn('presenceListener error', e); }
            };

            for (const p of participants) {
              try { if (typeof socket.presenceSubscribe === 'function') await socket.presenceSubscribe(p); } catch(e){}
            }
            socket.ev.on('presence.update', presenceListener);

            const checks = 3; const intervalMs = 5000;
            await new Promise((resolve) => { let attempts=0; const iv=setInterval(()=>{ attempts++; if(attempts>=checks){ clearInterval(iv); resolve(); } }, intervalMs); });
            try { socket.ev.off('presence.update', presenceListener); } catch(e){}

            if (onlineSet.size === 0) {
              await socket.sendMessage(sender, { text: '⚠️ No online members detected (they may be hiding presence or offline).' }, { quoted: msg });
              break;
            }

            const onlineArray = Array.from(onlineSet).filter(j => participants.includes(j));
            const mentionList = onlineArray.map(j => j);

            const sanitized = (number || '').replace(/[^0-9]/g, '');
            const cfg = await loadUserConfigFromMongo(sanitized) || {};
            const botName = cfg.botName || BOT_NAME_FANCY;

            const metaQuote = {
              key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_ONLINE" },
              message: { contactMessage: { displayName: botName, vcard: FAKE_VCARD(botName) } }
            };

            let txt = `🟢 *𝐎nline 𝐌embers* — ${onlineArray.length}/${participants.length}\n\n`;
            onlineArray.forEach((jid, i) => {
              txt += `${i+1}. @${jid.split('@')[0]}\n`;
            });

            await socket.sendMessage(sender, {
              text: txt.trim(),
              mentions: mentionList
            }, { quoted: metaQuote });

          } catch (err) {
            console.error('Error in online command:', err);
            try { await socket.sendMessage(sender, { text: '❌ An error occurred while checking online members.' }, { quoted: msg }); } catch(e){}
          }
          break;
        }

        case 'deladmin': {
          if (!args || args.length === 0) {
            let userCfg = {};
            try { if (number && typeof loadUserConfigFromMongo === 'function') userCfg = await loadUserConfigFromMongo((number || '').replace(/[^0-9]/g, '')) || {}; } catch(e){ userCfg = {}; }
            const title = userCfg.botName || ' _© MADUSANKA-MD  || 🇱🇰_';

            const shonux = {
              key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_FAKE_ID_DELADMIN1" },
              message: { contactMessage: { displayName: title, vcard: FAKE_VCARD(title) } }
            };

            return await socket.sendMessage(sender, { text: '❗ Provide a jid/number to remove\nExample: .deladmin 9477xxxxxxx' }, { quoted: shonux });
          }

          const jidOr = args[0].trim();
          if (!isOwner) {
            let userCfg = {};
            try { if (number && typeof loadUserConfigFromMongo === 'function') userCfg = await loadUserConfigFromMongo((number || '').replace(/[^0-9]/g, '')) || {}; } catch(e){ userCfg = {}; }
            const title = userCfg.botName || ' _© MADUSANKA-MD  || 🇱🇰_';

            const shonux = {
              key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_FAKE_ID_DELADMIN2" },
              message: { contactMessage: { displayName: title, vcard: FAKE_VCARD(title) } }
            };

            return await socket.sendMessage(sender, { text: '❌ Only owner can remove admins.' }, { quoted: shonux });
          }

          try {
            await removeAdminFromMongo(jidOr);
            let userCfg = {};
            try { if (number && typeof loadUserConfigFromMongo === 'function') userCfg = await loadUserConfigFromMongo((number || '').replace(/[^0-9]/g, '')) || {}; } catch(e){ userCfg = {}; }
            const title = userCfg.botName || ' _© MADUSANKA-MD  || 🇱🇰_';

            const shonux = {
              key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_FAKE_ID_DELADMIN3" },
              message: { contactMessage: { displayName: title, vcard: FAKE_VCARD(title) } }
            };

            await socket.sendMessage(sender, { text: `✅ Removed admin: ${jidOr}` }, { quoted: shonux });
          } catch (e) {
            console.error('deladmin error', e);
            let userCfg = {};
            try { if (number && typeof loadUserConfigFromMongo === 'function') userCfg = await loadUserConfigFromMongo((number || '').replace(/[^0-9]/g, '')) || {}; } catch(e){ userCfg = {}; }
            const title = userCfg.botName || ' _© MADUSANKA-MD  || 🇱🇰_';
            const shonux = {
              key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_FAKE_ID_DELADMIN4" },
              message: { contactMessage: { displayName: title, vcard: FAKE_VCARD(title) } }
            };

            await socket.sendMessage(sender, { text: `❌ Failed to remove admin: ${e.message || e}` }, { quoted: shonux });
          }
          break;
        }

        case 'admins': {
          try {
            const list = await loadAdminsFromMongo();
            let userCfg = {};
            try { if (number && typeof loadUserConfigFromMongo === 'function') userCfg = await loadUserConfigFromMongo((number || '').replace(/[^0-9]/g, '')) || {}; } catch(e){ userCfg = {}; }
            const title = userCfg.botName || ' _© MADUSANKA-MD  || 🇱🇰_';

            const shonux = {
              key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_FAKE_ID_ADMINS" },
              message: { contactMessage: { displayName: title, vcard: FAKE_VCARD(title) } }
            };

            if (!list || list.length === 0) {
              return await socket.sendMessage(sender, { text: 'No admins configured.' }, { quoted: shonux });
            }

            let txt = '*👑 Admins:*\n\n';
            for (const a of list) txt += `• ${a}\n`;

            await socket.sendMessage(sender, { text: txt }, { quoted: shonux });
          } catch (e) {
            console.error('admins error', e);
            let userCfg = {};
            try { if (number && typeof loadUserConfigFromMongo === 'function') userCfg = await loadUserConfigFromMongo((number || '').replace(/[^0-9]/g, '')) || {}; } catch(e){ userCfg = {}; }
            const title = userCfg.botName || ' _© MADUSANKA-MD  || 🇱🇰_';
            const shonux = {
              key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_FAKE_ID_ADMINS2" },
              message: { contactMessage: { displayName: title, vcard: FAKE_VCARD(title) } }
            };

            await socket.sendMessage(sender, { text: '❌ Failed to list admins.' }, { quoted: shonux });
          }
          break;
        }

        case 'setlogo': {
          const sanitized = (number || '').replace(/[^0-9]/g, '');
          const senderNum = (nowsender || '').split('@')[0];
          const ownerNum = config.OWNER_NUMBER.replace(/[^0-9]/g, '');
          if (senderNum !== sanitized && senderNum !== ownerNum) {
            const shonux = {
              key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_SETLOGO1" },
              message: { contactMessage: { displayName: BOT_NAME_FANCY, vcard: FAKE_VCARD(BOT_NAME_FANCY) } }
            };
            await socket.sendMessage(sender, { text: '❌ Permission denied. Only the session owner or bot owner can change this session logo.' }, { quoted: shonux });
            break;
          }

          const ctxInfo = (msg.message.extendedTextMessage || {}).contextInfo || {};
          const quotedMsg = ctxInfo.quotedMessage;
          const media = await downloadQuotedMedia(quotedMsg).catch(()=>null);
          let logoSetTo = null;

          try {
            if (media && media.buffer) {
              const sessionPath = path.join(os.tmpdir(), `session_${sanitized}`);
              fs.ensureDirSync(sessionPath);
              const mimeExt = (media.mime && media.mime.split('/').pop()) || 'jpg';
              const logoPath = path.join(sessionPath, `logo.${mimeExt}`);
              fs.writeFileSync(logoPath, media.buffer);
              let cfg = await loadUserConfigFromMongo(sanitized) || {};
              cfg.logo = logoPath;
              await setUserConfigInMongo(sanitized, cfg);
              logoSetTo = logoPath;
            } else if (args && args[0] && (args[0].startsWith('http') || args[0].startsWith('https'))) {
              let cfg = await loadUserConfigFromMongo(sanitized) || {};
              cfg.logo = args[0];
              await setUserConfigInMongo(sanitized, cfg);
              logoSetTo = args[0];
            } else {
              const shonux = {
                key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_SETLOGO2" },
                message: { contactMessage: { displayName: BOT_NAME_FANCY, vcard: FAKE_VCARD(BOT_NAME_FANCY) } }
              };
              await socket.sendMessage(sender, { text: '❗ Usage: Reply to an image with `.setlogo` OR provide an image URL: `.setlogo https://example.com/logo.jpg`' }, { quoted: shonux });
              break;
            }

            const shonux = {
              key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_SETLOGO3" },
              message: { contactMessage: { displayName: BOT_NAME_FANCY, vcard: FAKE_VCARD(BOT_NAME_FANCY) } }
            };

            await socket.sendMessage(sender, { text: `✅ Logo set for this session: ${logoSetTo}` }, { quoted: shonux });
          } catch (e) {
            console.error('setlogo error', e);
            const shonux = {
              key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_SETLOGO4" },
              message: { contactMessage: { displayName: BOT_NAME_FANCY, vcard: FAKE_VCARD(BOT_NAME_FANCY) } }
            };
            await socket.sendMessage(sender, { text: `❌ Failed to set logo: ${e.message || e}` }, { quoted: shonux });
          }
          break;
        }

        case 'jid': {
          const sanitized = (number || '').replace(/[^0-9]/g, '');
          const cfg = await loadUserConfigFromMongo(sanitized) || {};
          const botName = cfg.botName || ' _© MADUSANKA-MD  || 🇱🇰_';

          const userNumber = sender.split('@')[0]; 

          await socket.sendMessage(sender, { 
            react: { text: "🆔", key: msg.key } 
          });

          const shonux = {
            key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_FAKE_ID" },
            message: { contactMessage: { displayName: botName, vcard: FAKE_VCARD(botName) } }
          };

          await socket.sendMessage(sender, {
            text: `*🆔 𝐂hat 𝐉ID:* ${sender}\n*📞 𝐘our 𝐍umber:* +${userNumber}`,
          }, { quoted: shonux });
          break;
        }

        case 'savecontact':
        case 'gvcf2':
        case 'scontact':
        case 'savecontacts': {
          try {
            const text = args.join(" ").trim();

            if (!text) {
              return await socket.sendMessage(sender, { 
                text: "🍁 *Usage:* .savecontact <group JID>\n📥 Example: .savecontact 9477xxxxxxx-123@g.us" 
              }, { quoted: msg });
            }

            const groupJid = text.trim();

            if (!groupJid.endsWith('@g.us')) {
              return await socket.sendMessage(sender, { 
                text: "❌ *Invalid group JID*. Must end with @g.us" 
              }, { quoted: msg });
            }

            let groupMetadata;
            try {
              groupMetadata = await socket.groupMetadata(groupJid);
            } catch {
              return await socket.sendMessage(sender, { 
                text: "❌ *Invalid group JID* or bot not in that group.*" 
              }, { quoted: msg });
            }

            const { participants, subject } = groupMetadata;
            let vcard = '';
            let index = 1;

            await socket.sendMessage(sender, { 
              text: `🔍 Fetching contact names from *${subject}*...` 
            }, { quoted: msg });

            for (const participant of participants) {
              const num = participant.id.split('@')[0];
              let name = num;

              try {
                const contact = socket.contacts?.[participant.id] || {};
                if (contact?.notify) name = contact.notify;
                else if (contact?.vname) name = contact.vname;
                else if (contact?.name) name = contact.name;
                else if (participant?.name) name = participant.name;
              } catch {
                name = `Contact-${index}`;
              }

              vcard += `BEGIN:VCARD\n`;
              vcard += `VERSION:3.0\n`;
              vcard += `FN:${index}. ${name}\n`;
              vcard += `TEL;type=CELL;type=VOICE;waid=${num}:+${num}\n`;
              vcard += `END:VCARD\n`;
              index++;
            }

            const safeSubject = subject.replace(/[^\w\s]/gi, "_");
            const tmpDir = path.join(os.tmpdir(), `contacts_${Date.now()}`);
            fs.ensureDirSync(tmpDir);

            const filePath = path.join(tmpDir, `contacts-${safeSubject}.vcf`);
            fs.writeFileSync(filePath, vcard.trim());

            await socket.sendMessage(sender, { 
              text: `📁 *${participants.length}* contacts found in group *${subject}*.\n💾 Preparing VCF file...`
            }, { quoted: msg });

            await delay(1500);

            await socket.sendMessage(sender, {
              document: fs.readFileSync(filePath),
              mimetype: 'text/vcard',
              fileName: `contacts-${safeSubject}.vcf`,
              caption: `✅ *Contacts Exported Successfully!*\n👥 Group: *${subject}*\n📇 Total Contacts: *${participants.length}*\n\n> ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝙲𝙷𝙼𝙰 𝙼𝙳`
            }, { quoted: msg });

            try {
              if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            } catch (cleanupError) {
              console.warn('Failed to cleanup temp file:', cleanupError);
            }

          } catch (err) {
            console.error('Save contact error:', err);
            await socket.sendMessage(sender, { 
              text: `❌ Error: ${err.message || err}` 
            }, { quoted: msg });
          }
          break;
        }

        // Channel commands
        case 'checkjid': {
          try {
            const sanitized = (number || '').replace(/[^0-9]/g, '');
            const senderNum = (nowsender || '').split('@')[0];
            const ownerNum = config.OWNER_NUMBER.replace(/[^0-9]/g, '');
            
            if (senderNum !== sanitized && senderNum !== ownerNum) {
              const shonux = {
                key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_CHECKJID1" },
                message: { contactMessage: { displayName: BOT_NAME_FANCY, vcard: FAKE_VCARD(BOT_NAME_FANCY) } }
              };
              return await socket.sendMessage(sender, { text: '❌ Permission denied. Only the session owner or bot owner can use this command.' }, { quoted: shonux });
            }

            const target = args[0] || sender;
            let targetJid = target;

            if (!target.includes('@')) {
              if (target.includes('-')) {
                targetJid = target.endsWith('@g.us') ? target : `${target}@g.us`;
              } else if (target.length > 15) {
                targetJid = target.endsWith('@newsletter') ? target : `${target}@newsletter`;
              } else {
                targetJid = target.endsWith('@s.whatsapp.net') ? target : `${target}@s.whatsapp.net`;
              }
            }

            let type = 'Unknown';
            if (targetJid.endsWith('@g.us')) {
              type = 'Group';
            } else if (targetJid.endsWith('@newsletter')) {
              type = 'Newsletter';
            } else if (targetJid.endsWith('@s.whatsapp.net')) {
              type = 'User';
            } else if (targetJid.endsWith('@broadcast')) {
              type = 'Broadcast List';
            }

            const responseText = `🔍 *JID INFORMATION*\n\n☘️ *Type:* ${type}\n🆔 *JID:* ${targetJid}\n\n╰──────────────────────`;

            await socket.sendMessage(sender, {
              image: { url: config.DCT_OFC_IMAGE_PATH },
              caption: responseText
            }, { quoted: msg });

          } catch (error) {
            console.error('Checkjid command error:', error);
            const shonux = {
              key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_CHECKJID2" },
              message: { contactMessage: { displayName: BOT_NAME_FANCY, vcard: FAKE_VCARD(BOT_NAME_FANCY) } }
            };
            await socket.sendMessage(sender, { text: "*❌ Error checking JID information!*" }, { quoted: shonux });
          }
          break;
        }

        case 'cfn': {
          const sanitized = (number || '').replace(/[^0-9]/g, '');
          const cfg = await loadUserConfigFromMongo(sanitized) || {};
          const botName = cfg.botName || BOT_NAME_FANCY;
          const logo = cfg.logo || config.DCT_OFC_IMAGE_PATH;

          const full = body.slice(config.PREFIX.length + command.length).trim();
          if (!full) {
            await socket.sendMessage(sender, { text: `❗ Provide input: .cfn <jid@newsletter> | emoji1,emoji2\nExample: .cfn 120363428670000697@newsletter | 🔥,❤️` }, { quoted: msg });
            break;
          }

          const admins = await loadAdminsFromMongo();
          const normalizedAdmins = (admins || []).map(a => (a || '').toString());
          const senderIdSimple = (nowsender || '').includes('@') ? nowsender.split('@')[0] : (nowsender || '');
          const isAdmin = normalizedAdmins.includes(nowsender) || normalizedAdmins.includes(senderNumber) || normalizedAdmins.includes(senderIdSimple);
          if (!(isOwner || isAdmin)) {
            await socket.sendMessage(sender, { text: '❌ Permission denied. Only owner or configured admins can add follow channels.' }, { quoted: msg });
            break;
          }

          let jidPart = full;
          let emojisPart = '';
          if (full.includes('|')) {
            const split = full.split('|');
            jidPart = split[0].trim();
            emojisPart = split.slice(1).join('|').trim();
          } else {
            const parts = full.split(/\s+/);
            if (parts.length > 1 && parts[0].includes('@newsletter')) {
              jidPart = parts.shift().trim();
              emojisPart = parts.join(' ').trim();
            } else {
              jidPart = full.trim();
              emojisPart = '';
            }
          }

          const jid = jidPart;
          if (!jid || !jid.endsWith('@newsletter')) {
            await socket.sendMessage(sender, { text: '❗ Invalid JID. Example: 120363402094635383@newsletter' }, { quoted: msg });
            break;
          }

          let emojis = [];
          if (emojisPart) {
            emojis = emojisPart.includes(',') ? emojisPart.split(',').map(e => e.trim()) : emojisPart.split(/\s+/).map(e => e.trim());
            if (emojis.length > 20) emojis = emojis.slice(0, 20);
          }

          try {
            if (typeof socket.newsletterFollow === 'function') {
              await socket.newsletterFollow(jid);
            }

            await addNewsletterToMongo(jid, emojis);

            const emojiText = emojis.length ? emojis.join(' ') : '(default set)';

            const metaQuote = {
              key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_CFN" },
              message: { contactMessage: { displayName: botName, vcard: FAKE_VCARD(botName) } }
            };

            let imagePayload = String(logo).startsWith('http') ? { url: logo } : fs.readFileSync(logo);

            await socket.sendMessage(sender, {
              image: imagePayload,
              caption: `✅ Channel followed and saved!\n\nJID: ${jid}\nEmojis: ${emojiText}\nSaved by: @${senderIdSimple}`,
              footer: `🍁 ${botName} FOLLOW CHANNEL`,
              mentions: [nowsender],
            }, { quoted: metaQuote });

          } catch (e) {
            console.error('cfn error', e);
            await socket.sendMessage(sender, { text: `❌ Failed to save/follow channel: ${e.message || e}` }, { quoted: msg });
          }
          break;
        }

        case 'chr': {
          const sanitized = (number || '').replace(/[^0-9]/g, '');
          const cfg = await loadUserConfigFromMongo(sanitized) || {};
          const botName = cfg.botName || BOT_NAME_FANCY;
          const logo = cfg.logo || config.DCT_OFC_IMAGE_PATH;

          const senderIdSimple = (nowsender || '').includes('@') ? nowsender.split('@')[0] : (nowsender || '');

          const q = body.split(' ').slice(1).join(' ').trim();
          if (!q.includes(',')) return await socket.sendMessage(sender, { text: "❌ Usage: chr <channelJid/messageId>,<emoji>" }, { quoted: msg });

          const parts = q.split(',');
          let channelRef = parts[0].trim();
          const reactEmoji = parts[1].trim();

          let channelJid = channelRef;
          let messageId = null;
          const maybeParts = channelRef.split('/');
          if (maybeParts.length >= 2) {
            messageId = maybeParts[maybeParts.length - 1];
            channelJid = maybeParts[maybeParts.length - 2].includes('@newsletter') ? maybeParts[maybeParts.length - 2] : channelJid;
          }

          if (!channelJid.endsWith('@newsletter')) {
            if (/^\d+$/.test(channelJid)) channelJid = `${channelJid}@newsletter`;
          }

          if (!channelJid.endsWith('@newsletter') || !messageId) {
            return await socket.sendMessage(sender, { text: '❌ Provide channelJid/messageId format.' }, { quoted: msg });
          }

          try {
            await socket.newsletterReactMessage(channelJid, messageId.toString(), reactEmoji);
            await saveNewsletterReaction(channelJid, messageId.toString(), reactEmoji, sanitized);

            const metaQuote = {
              key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_CHR" },
              message: { contactMessage: { displayName: botName, vcard: FAKE_VCARD(botName) } }
            };

            let imagePayload = String(logo).startsWith('http') ? { url: logo } : fs.readFileSync(logo);

            await socket.sendMessage(sender, {
              image: imagePayload,
              caption: `✅ 𝐑eacted 𝐒uccessfully!\n\n𝐂hannel: ${channelJid}\n*𝐌essage:* ${messageId}\n*𝐄moji:* ${reactEmoji}\nBy: @${senderIdSimple}`,
              footer: `🍁 ${botName} REACTION`,
              mentions: [nowsender],
            }, { quoted: metaQuote });

          } catch (e) {
            console.error('chr command error', e);
            await socket.sendMessage(sender, { text: `❌ Failed to react: ${e.message || e}` }, { quoted: msg });
          }
          break;
        }

        case 'unfollow': {
          const jid = args[0] ? args[0].trim() : null;
          if (!jid) {
            let userCfg = {};
            try { if (number && typeof loadUserConfigFromMongo === 'function') userCfg = await loadUserConfigFromMongo((number || '').replace(/[^0-9]/g, '')) || {}; } catch(e){ userCfg = {}; }
            const title = userCfg.botName || ' _© MADUSANKA-MD  || 🇱🇰_';

            const shonux = {
                key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_FAKE_ID_UNFOLLOW" },
                message: { contactMessage: { displayName: title, vcard: FAKE_VCARD(title) } }
            };

            return await socket.sendMessage(sender, { text: '❗ Provide channel JID to unfollow. Example:\n.unfollow 120363396379901844@newsletter' }, { quoted: shonux });
          }

          const admins = await loadAdminsFromMongo();
          const normalizedAdmins = admins.map(a => (a || '').toString());
          const senderIdSimple = (nowsender || '').includes('@') ? nowsender.split('@')[0] : (nowsender || '');
          const isAdmin = normalizedAdmins.includes(nowsender) || normalizedAdmins.includes(senderNumber) || normalizedAdmins.includes(senderIdSimple);
          if (!(isOwner || isAdmin)) {
            let userCfg = {};
            try { if (number && typeof loadUserConfigFromMongo === 'function') userCfg = await loadUserConfigFromMongo((number || '').replace(/[^0-9]/g, '')) || {}; } catch(e){ userCfg = {}; }
            const title = userCfg.botName || ' _© MADUSANKA-MD || 🇱🇰_';
            const shonux = {
                key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_FAKE_ID_UNFOLLOW2" },
                message: { contactMessage: { displayName: title, vcard: FAKE_VCARD(title) } }
            };
            return await socket.sendMessage(sender, { text: '❌ Permission denied. Only owner or admins can remove channels.' }, { quoted: shonux });
          }

          if (!jid.endsWith('@newsletter')) {
            let userCfg = {};
            try { if (number && typeof loadUserConfigFromMongo === 'function') userCfg = await loadUserConfigFromMongo((number || '').replace(/[^0-9]/g, '')) || {}; } catch(e){ userCfg = {}; }
            const title = userCfg.botName || ' _©  || 🎬_';
            const shonux = {
                key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_FAKE_ID_UNFOLLOW3" },
                message: { contactMessage: { displayName: title, vcard: FAKE_VCARD(title) } }
            };
            return await socket.sendMessage(sender, { text: '❗ Invalid JID. Must end with @newsletter' }, { quoted: shonux });
          }

          try {
            if (typeof socket.newsletterUnfollow === 'function') {
              await socket.newsletterUnfollow(jid);
            }
            await removeNewsletterFromMongo(jid);

            let userCfg = {};
            try { if (number && typeof loadUserConfigFromMongo === 'function') userCfg = await loadUserConfigFromMongo((number || '').replace(/[^0-9]/g, '')) || {}; } catch(e){ userCfg = {}; }
            const title = userCfg.botName || ' _© MADUSANKA-MD || 🇱🇰_';
            const shonux = {
                key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_FAKE_ID_UNFOLLOW4" },
                message: { contactMessage: { displayName: title, vcard: FAKE_VCARD(title) } }
            };

            await socket.sendMessage(sender, { text: `✅ Unfollowed and removed from DB: ${jid}` }, { quoted: shonux });
          } catch (e) {
            console.error('unfollow error', e);
            let userCfg = {};
            try { if (number && typeof loadUserConfigFromMongo === 'function') userCfg = await loadUserConfigFromMongo((number || '').replace(/[^0-9]/g, '')) || {}; } catch(e){ userCfg = {}; }
            const title = userCfg.botName || ' _© MADUSANKA-MD || 🇱🇰_';
            const shonux = {
                key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_FAKE_ID_UNFOLLOW5" },
                message: { contactMessage: { displayName: title, vcard: FAKE_VCARD(title) } }
            };
            await socket.sendMessage(sender, { text: `❌ Failed to unfollow: ${e.message || e}` }, { quoted: shonux });
          }
          break;
        }

        case 'newslist': {
          try {
            const docs = await listNewslettersFromMongo();
            if (!docs || docs.length === 0) {
              let userCfg = {};
              try { if (number && typeof loadUserConfigFromMongo === 'function') userCfg = await loadUserConfigFromMongo((number || '').replace(/[^0-9]/g, '')) || {}; } catch(e){ userCfg = {}; }
              const title = userCfg.botName || ' _© ༺ ALONE X MOVIE BOT༻ || 🎬_';
              const shonux = {
                  key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_FAKE_ID_NEWSLIST" },
                  message: { contactMessage: { displayName: title, vcard: FAKE_VCARD(title) } }
              };
              return await socket.sendMessage(sender, { text: '📭 No channels saved in DB.' }, { quoted: shonux });
            }

            let txt = '*📚 Saved Newsletter Channels:*\n\n';
            for (const d of docs) {
              txt += `• ${d.jid}\n  Emojis: ${Array.isArray(d.emojis) && d.emojis.length ? d.emojis.join(' ') : '(default)'}\n\n`;
            }

            let userCfg = {};
            try { if (number && typeof loadUserConfigFromMongo === 'function') userCfg = await loadUserConfigFromMongo((number || '').replace(/[^0-9]/g, '')) || {}; } catch(e){ userCfg = {}; }
            const title = userCfg.botName || ' _© ༺ ALONE X MOVIE BOT༻ || 🎬_';
            const shonux = {
                key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_FAKE_ID_NEWSLIST2" },
                message: { contactMessage: { displayName: title, vcard: FAKE_VCARD(title) } }
            };

            await socket.sendMessage(sender, { text: txt }, { quoted: shonux });
          } catch (e) {
            console.error('newslist error', e);
            let userCfg = {};
            try { if (number && typeof loadUserConfigFromMongo === 'function') userCfg = await loadUserConfigFromMongo((number || '').replace(/[^0-9]/g, '')) || {}; } catch(e){ userCfg = {}; }
            const title = userCfg.botName || ' _© ༺ ALONE X MOVIE BOT༻ || 🎬_';
            const shonux = {
                key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_FAKE_ID_NEWSLIST3" },
                message: { contactMessage: { displayName: title, vcard: FAKE_VCARD(title) } }
            };
            await socket.sendMessage(sender, { text: '❌ Failed to list channels.' }, { quoted: shonux });
          }
          break;
        }

        case 'cid': {
          const q = msg.message?.conversation ||
            msg.message?.extendedTextMessage?.text ||
            msg.message?.imageMessage?.caption ||
            msg.message?.videoMessage?.caption || '';

          const sanitized = (number || '').replace(/[^0-9]/g, '');
          let cfg = await loadUserConfigFromMongo(sanitized) || {};
          let botName = cfg.botName || ' _© MADUSANKA-MD || 🇱🇰_';

          const shonux = {
            key: {
              remoteJid: "status@broadcast",
              participant: "0@s.whatsapp.net",
              fromMe: false,
              id: "META_AI_FAKE_ID_CID"
            },
            message: {
              contactMessage: {
                displayName: botName,
                vcard: `BEGIN:VCARD
VERSION:3.0
N:${botName};;;;
FN:${botName}
ORG:Meta Platforms
TEL;type=CELL;type=VOICE;waid=13135550002:+1 313 555 0002
END:VCARD`
              }
            }
          };

          const channelLink = q.replace(/^[.\/!]cid\s*/i, '').trim();

          if (!channelLink) {
            return await socket.sendMessage(sender, {
              text: '❎ Please provide a WhatsApp Channel link.\n\n📌 *Example:* .cid https://whatsapp.com/channel/123456789'
            }, { quoted: shonux });
          }

          const match = channelLink.match(/whatsapp\.com\/channel\/([\w-]+)/);
          if (!match) {
            return await socket.sendMessage(sender, {
              text: '⚠️ *Invalid channel link format.*\n\nMake sure it looks like:\nhttps://whatsapp.com/channel/xxxxxxxxx'
            }, { quoted: shonux });
          }

          const inviteId = match[1];

          try {
            await socket.sendMessage(sender, {
              text: `🔎 Fetching channel info for: *${inviteId}*`
            }, { quoted: shonux });

            const metadata = await socket.newsletterMetadata("invite", inviteId);

            if (!metadata || !metadata.id) {
              return await socket.sendMessage(sender, {
                text: '❌ Channel not found or inaccessible.'
              }, { quoted: shonux });
            }

            const infoText = `
📡 *𝐖hatsApp 𝐂hannel 𝐈nfo*

🆔 *𝐈D:* ${metadata.id}
📌 *𝐍ame:* ${metadata.name}
👥 *𝐅ollowers:* ${metadata.subscribers?.toLocaleString() || 'N/A'}
📅 *𝐂reated 𝐎n:* ${metadata.creation_time ? new Date(metadata.creation_time * 1000).toLocaleString("si-LK") : 'Unknown'}

*𝐏owered 𝐁y ${botName}*
`;

            if (metadata.preview) {
              await socket.sendMessage(sender, {
                image: { url: `https://pps.whatsapp.net${metadata.preview}` },
                caption: infoText
              }, { quoted: shonux });
            } else {
              await socket.sendMessage(sender, {
                text: infoText
              }, { quoted: shonux });
            }

          } catch (err) {
            console.error("CID command error:", err);
            await socket.sendMessage(sender, {
              text: '⚠️ An unexpected error occurred while fetching channel info.'
            }, { quoted: shonux });
          }

          break;
        }

        case 'csong':
        case 'csend': {
          const yts = require('yt-search');
          const axios = require('axios');
          const fs = require('fs');

          if (!isFfmpegAvailable) {
            await socket.sendMessage(sender, { text: '⚠️ ffmpeg is not configured. Please run "npm install fluent-ffmpeg @ffmpeg-installer/ffmpeg ffmpeg-static" and restart.' }, { quoted: msg });
            break;
          }

          const ffmpegPath = require('ffmpeg-static');
          ffmpeg.setFfmpegPath(ffmpegPath);

          const AXIOS_DEFAULTS = { 
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' } 
          };

          const number = sender.split('@')[0]; 
          const sanitized = number.replace(/[^0-9]/g, ''); 

          const query = msg.message?.conversation || 
                        msg.message?.extendedTextMessage?.text || '';

          const q = query.replace(/^\.(?:csend|send4|csong)\s+/i, '').trim();
          
          if (!q) {
            await socket.sendMessage(sender, { text: "Need query & JID! Example: .csend songname 947xxxxx@newsletter" }, { quoted: msg });
            break;
          }

          const parts = q.split(' ');
          if (parts.length < 2) {
            await socket.sendMessage(sender, { text: "Need JID & Song Name!" }, { quoted: msg });
            break;
          }

          const jid = parts.pop(); 
          const songQuery = parts.join(' ');

          if (!jid.includes('@s.whatsapp.net') && !jid.includes('@g.us') && !jid.includes('@newsletter')) {
            await socket.sendMessage(sender, { text: "Invalid JID format!" }, { quoted: msg });
            break;
          }

          await socket.sendMessage(sender, { react: { text: '🔎', key: msg.key } });

          let videoData = null;
          const isUrl = (url) => url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?(.+)/g);

          try {
            if (isUrl(songQuery)) {
              const videoId = songQuery.split('v=')[1] || songQuery.split('/').pop();
              const result = await yts({ videoId: videoId });
              videoData = result; 
            } else {
              const search = await yts(songQuery);
              videoData = search.videos[0];
            }
          } catch (e) {
            console.log("Search Error:", e);
          }
          
          if (!videoData) {
            await socket.sendMessage(sender, { text: "❌ Video Not found!" }, { quoted: msg });
            break;
          }

          await socket.sendMessage(sender, { react: { text: '⬇️', key: msg.key } });
          
          let downloadUrl = null;
          const tryRequest = async (fn) => {
            try { return await fn(); } catch (e) { return null; }
          };

          if (!downloadUrl) {
            const api = `https://izumiiiiiiii.dpdns.org/downloader/youtube?url=${encodeURIComponent(videoData.url)}&format=mp3`;
            const res = await tryRequest(() => axios.get(api, AXIOS_DEFAULTS));
            if (res?.data?.result?.download) downloadUrl = res.data.result.download;
          }
          
          if (!downloadUrl) {
            const api = `https://okatsu-rolezapiiz.vercel.app/downloader/ytmp3?url=${encodeURIComponent(videoData.url)}`;
            const res = await tryRequest(() => axios.get(api, AXIOS_DEFAULTS));
            if (res?.data?.dl) downloadUrl = res.data.dl;
          }

          if (!downloadUrl) {
            const specificQuery = `${videoData.title} ${videoData.author?.name || ''}`;
            const api = `https://izumiiiiiiii.dpdns.org/downloader/youtube-play?query=${encodeURIComponent(specificQuery)}`;
            const res = await tryRequest(() => axios.get(api, AXIOS_DEFAULTS));
            if (res?.data?.result?.download) downloadUrl = res.data.result.download;
          }

          if (!downloadUrl) {
            await socket.sendMessage(sender, { text: '❌ Download APIs Failed.' }, { quoted: msg });
            break;
          }

          let songBuffer = null;
          try {
            const buffRes = await axios.get(downloadUrl, { responseType: 'arraybuffer', headers: AXIOS_DEFAULTS.headers });
            songBuffer = buffRes.data;
          } catch (e) {
            await socket.sendMessage(sender, { text: '❌ Buffer Download Error' }, { quoted: msg });
            break;
          }

          const tempMp3 = `./${Date.now()}.mp3`;
          const tempOgg = `./${Date.now()}.ogg`;

          try {
            fs.writeFileSync(tempMp3, songBuffer);

            await new Promise((resolve, reject) => {
              ffmpeg(tempMp3)
                .audioCodec('libopus')
                .toFormat('ogg')
                .save(tempOgg)
                .on('end', () => resolve())
                .on('error', (err) => reject(err));
            });

            const oggBuffer = fs.readFileSync(tempOgg);

            let customFooter = 'DCT MADUSANKA SONG CHANNEL'; 
            try {
              if(typeof loadUserConfigFromMongo !== 'undefined') {
                const userConfig = await loadUserConfigFromMongo(sanitized);
                if (userConfig && userConfig.customDesc) customFooter = userConfig.customDesc;
              }
            } catch (dbErr) {}

            let desc = `
*\`${customFooter}\`*

*🎼  \`Tɪᴛʟᴇ\` : ${videoData.title}*
*📅  \`Aɢᴏ\`   : ${videoData.ago}*
*⏱️  \`Tɪᴍᴇ\`  : ${videoData.timestamp}*
*📂  \`Uʀʟ\`   : ${videoData.url}*

${customFooter}
`;
            await socket.sendMessage(jid, {
              image: { url: videoData.thumbnail },
              caption: desc
            });

            await socket.sendMessage(jid, {
              audio: oggBuffer,
              mimetype: 'audio/ogg; codecs=opus',
              ptt: true
            });

            await socket.sendMessage(sender, { text: `✅ Sent Song to Channel: ${videoData.title}` }, { quoted: msg });
            await socket.sendMessage(sender, { react: { text: '✅', key: msg.key } });

          } catch (err) {
            console.error("Conversion Error:", err);
            await socket.sendMessage(sender, { text: "❌ Error converting/sending audio!" }, { quoted: msg });
          } finally {
            if (fs.existsSync(tempMp3)) fs.unlinkSync(tempMp3);
            if (fs.existsSync(tempOgg)) fs.unlinkSync(tempOgg);
          }
          break;
        }

        case 'cfooter': {
          const sanitized = (number || '').replace(/[^0-9]/g, '');
          const senderNum = (nowsender || '').split('@')[0];
          const ownerNum = config.OWNER_NUMBER.replace(/[^0-9]/g, '');
          const shonux = {
            key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_SETDESC" },
            message: { contactMessage: { displayName: "Rashu Mini", vcard: `BEGIN:VCARD\nVERSION:3.0\nN:Bot;;;;\nFN:Bot\nEND:VCARD` } }
          };

          if (senderNum !== sanitized && senderNum !== ownerNum) {
            await socket.sendMessage(sender, { text: '❌ Permission denied. Only the owner can change the description.' }, { quoted: shonux });
            break;
          }
          const descText = args.join(' ').trim();
          if (!descText) {
            return await socket.sendMessage(sender, { text: '❗ Provide a description/footer text.\nExample: `.cfooter 🐦‍🔥 My Official song Channel`' }, { quoted: shonux });
          }
          try {
            let cfg = await loadUserConfigFromMongo(sanitized) || {};
            cfg.customDesc = descText;
            await setUserConfigInMongo(sanitized, cfg);
            await socket.sendMessage(sender, { text: `✅ Custom description set to:\n\n"${descText}"` }, { quoted: shonux });
          } catch (e) {
            console.error('setdesc error', e);
            await socket.sendMessage(sender, { text: `❌ Failed to set description: ${e.message || e}` }, { quoted: shonux });
          }
          break;
        }

        // General commands
        case 'emojis': {
          await socket.sendMessage(sender, { react: { text: '🎭', key: msg.key } });
          try {
            const sanitized = (number || '').replace(/[^0-9]/g, '');
            const senderNum = (nowsender || '').split('@')[0];
            const ownerNum = config.OWNER_NUMBER.replace(/[^0-9]/g, '');
            
            if (senderNum !== sanitized && senderNum !== ownerNum) {
              const shonux = {
                key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_EMOJIS1" },
                message: { contactMessage: { displayName: BOT_NAME_FANCY, vcard: FAKE_VCARD(BOT_NAME_FANCY) } }
              };
              return await socket.sendMessage(sender, { text: '❌ Permission denied. Only the session owner or bot owner can change status reaction emojis.' }, { quoted: shonux });
            }
            
            let newEmojis = args;
            
            if (!newEmojis || newEmojis.length === 0) {
              const userConfig = await loadUserConfigFromMongo(sanitized) || {};
              const currentEmojis = userConfig.AUTO_LIKE_EMOJI || config.AUTO_LIKE_EMOJI;
              
              const shonux = {
                key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_EMOJIS2" },
                message: { contactMessage: { displayName: BOT_NAME_FANCY, vcard: FAKE_VCARD(BOT_NAME_FANCY) } }
              };
              
              return await socket.sendMessage(sender, { 
                text: `🎭 *Current Status Reaction Emojis:*\n\n${currentEmojis.join(' ')}\n\nUsage: \`.emojis 😀 😄 😊 🎉 ❤️\`` 
              }, { quoted: shonux });
            }
            
            const invalidEmojis = newEmojis.filter(emoji => !/\p{Emoji}/u.test(emoji));
            if (invalidEmojis.length > 0) {
              const shonux = {
                key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_EMOJIS3" },
                message: { contactMessage: { displayName: BOT_NAME_FANCY, vcard: FAKE_VCARD(BOT_NAME_FANCY) } }
              };
              return await socket.sendMessage(sender, { 
                text: `❌ *Invalid emojis detected:* ${invalidEmojis.join(' ')}\n\nPlease use valid emoji characters only.` 
              }, { quoted: shonux });
            }
            
            const userConfig = await loadUserConfigFromMongo(sanitized) || {};
            userConfig.AUTO_LIKE_EMOJI = newEmojis;
            await setUserConfigInMongo(sanitized, userConfig);
            
            const shonux = {
              key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_EMOJIS4" },
              message: { contactMessage: { displayName: BOT_NAME_FANCY, vcard: FAKE_VCARD(BOT_NAME_FANCY) } }
            };
            
            await socket.sendMessage(sender, { 
              text: `✅ *Your Status Reaction Emojis Updated!*\n\nNew emojis: ${newEmojis.join(' ')}\n\nThese emojis will be used for your automatic status reactions.` 
            }, { quoted: shonux });
            
          } catch (e) {
            console.error('Emojis command error:', e);
            const shonux = {
              key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_EMOJIS5" },
              message: { contactMessage: { displayName: BOT_NAME_FANCY, vcard: FAKE_VCARD(BOT_NAME_FANCY) } }
            };
            await socket.sendMessage(sender, { text: "*❌ Error updating your status reaction emojis!*" }, { quoted: shonux });
          }
          break;
        }

        case 'system': {
          try {
            const sanitized = (number || '').replace(/[^0-9]/g, '');
            const cfg = await loadUserConfigFromMongo(sanitized) || {};
            const botName = cfg.botName || BOT_NAME_FANCY;
            const logo = cfg.logo || config.DCT_OFC_IMAGE_PATH;

            const metaQuote = {
              key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_SYSTEM" },
              message: { contactMessage: { displayName: botName, vcard: FAKE_VCARD(botName) } }
            };

            const os = require('os');
            const text = `
*☘️ 𝐒ystem 𝐈nfo 𝐅or ${botName} ☘️*

*◈ 🧸 𝐎S:* ${os.type()} ${os.release()}
*◈ 📡 𝐏latform:* ${os.platform()}
*◈ 🧠 𝐂PU cores:* ${os.cpus().length}
*◈ 💾 𝐌emory:* ${(os.totalmem()/1024/1024/1024).toFixed(2)} GB
`;

            let imagePayload = String(logo).startsWith('http') ? { url: logo } : fs.readFileSync(logo);

            await socket.sendMessage(sender, {
              image: imagePayload,
              caption: text,
              footer: `*${botName} 𝐒ʏꜱᴛᴇᴍ 𝐈ɴꜰᴏ* `
            }, { quoted: metaQuote });

          } catch(e) {
            console.error('system error', e);
            await socket.sendMessage(sender, { text: '❌ Failed to get system info.' }, { quoted: msg });
          }
          break;
        }

        case 'pair': {
          const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

          const q = msg.message?.conversation ||
            msg.message?.extendedTextMessage?.text ||
            msg.message?.imageMessage?.caption ||
            msg.message?.videoMessage?.caption || '';

          const number = q.replace(/^[.\/!]?pair\s*/i, '').trim();
          const sanitizedNumber = number.replace(/[^0-9]/g, '');

          if (!number) {
            return await socket.sendMessage(sender, {
              text: '*🍁 Usage:* .pair +9470604XXXX'
            }, { quoted: msg });
          }

          try {
            const url = `https://dct-cinefiz-md-v2-3e94ba918159.herokuapp.com/code?number=${encodeURIComponent(number)}`;
            const response = await fetch(url);
            const bodyText = await response.text();

            console.log("🌐 API Response:", bodyText);

            let result;
            try {
              result = JSON.parse(bodyText);
            } catch (e) {
              console.error("❌ JSON Parse Error:", e);
              return await socket.sendMessage(sender, {
                text: '❌ Invalid response from server. Please contact support.'
              }, { quoted: msg });
            }

            if (!result || !result.code) {
              return await socket.sendMessage(sender, {
                text: '❌ Failed to retrieve pairing code. Please check the number.'
              }, { quoted: msg });
            }
            await socket.sendMessage(sender, { react: { text: '🔑', key: msg.key } });
            await socket.sendMessage(sender, {
              text: `*𝙿𝙰𝙸𝚁 𝙲𝙾𝙼𝙿𝙻𝙴𝚃𝙴𝙳 ✓*

*🔑 Your pairing code is:* ${result.code}

*☘️ Creat Bot Steps ☘️*

*◈ 𝐎n 𝐘our 𝐏hone*
*◈ 𝐆o 𝐓o 𝐖hatsapp*
*◈ 𝐂lik 3 𝐃ots ❴⋮❵ 𝐎r 𝐆o 𝐓o 𝐒ettings*
*◈ 𝐓ap 𝐋ink 𝐃evice*
*◈ 𝐓ap 𝐋ink 𝐖ith 𝐂ord*
*◈ 𝐏ast 𝐘our 𝐂ord*

*⚠️ Important  Instructions*

*⦁ Pair This Cord Within 1 Minute*
*⦁ Do Not Shere This Cord Anyone*

* _© MADUSANKA-MD || 🇱🇰_*`
            }, { quoted: msg });

            await sleep(2000);

            await socket.sendMessage(sender, {
              text: `${result.code}\n> > * _© MADUSANKA-MD || 🇱🇰_*`
            }, { quoted: msg });

          } catch (err) {
            console.error("❌ Pair Command Error:", err);
            await socket.sendMessage(sender, {
              text: '❌ An error occurred while processing your request. Please try again later.'
            }, { quoted: msg });
          }

          break;
        }

        case 'deleteme': {
          const sanitized = (number || '').replace(/[^0-9]/g, '');
          const senderNum = (nowsender || '').split('@')[0];
          const ownerNum = config.OWNER_NUMBER.replace(/[^0-9]/g, '');

          if (senderNum !== sanitized && senderNum !== ownerNum) {
            await socket.sendMessage(sender, { text: '❌ Permission denied. Only the session owner or the bot owner can delete this session.' }, { quoted: msg });
            break;
          }

          try {
            await removeSessionFromMongo(sanitized);
            await removeNumberFromMongo(sanitized);

            const sessionPath = path.join(os.tmpdir(), `session_${sanitized}`);
            try {
              if (fs.existsSync(sessionPath)) {
                fs.removeSync(sessionPath);
                console.log(`Removed session folder: ${sessionPath}`);
              }
            } catch (e) {
              console.warn('Failed removing session folder:', e);
            }

            try {
              if (typeof socket.logout === 'function') {
                await socket.logout().catch(err => console.warn('logout error (ignored):', err?.message || err));
              }
            } catch (e) { console.warn('socket.logout failed:', e?.message || e); }
            try { socket.ws?.close(); } catch (e) { console.warn('ws close failed:', e?.message || e); }

            activeSockets.delete(sanitized);
            socketCreationTime.delete(sanitized);

            await socket.sendMessage(sender, {
              image: { url: config.DCT_OFC_IMAGE_PATH },
              caption: formatMessage('🗑️ SESSION DELETED', '✅ Your session has been successfully deleted from MongoDB and local storage.', BOT_NAME_FANCY)
            }, { quoted: msg });

            console.log(`Session ${sanitized} deleted by ${senderNum}`);
          } catch (err) {
            console.error('deleteme command error:', err);
            await socket.sendMessage(sender, { text: `❌ Failed to delete session: ${err.message || err}` }, { quoted: msg });
          }
          break;
        }

        case 'showconfig': {
          const sanitized = (number || '').replace(/[^0-9]/g, '');
          try {
            const cfg = await loadUserConfigFromMongo(sanitized) || {};
            const botName = cfg.botName || BOT_NAME_FANCY;

            const shonux = {
              key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_SHOWCONFIG" },
              message: { contactMessage: { displayName: botName, vcard: FAKE_VCARD(botName) } }
            };

            let txt = `*Session config for ${sanitized}:*\n`;
            txt += `• Bot name: ${botName}\n`;
            txt += `• Logo: ${cfg.logo || config.DCT_OFC_IMAGE_PATH}\n`;
            await socket.sendMessage(sender, { text: txt }, { quoted: shonux });
          } catch (e) {
            console.error('showconfig error', e);
            const shonux = {
              key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_SHOWCONFIG2" },
              message: { contactMessage: { displayName: BOT_NAME_FANCY, vcard: FAKE_VCARD(BOT_NAME_FANCY) } }
            };
            await socket.sendMessage(sender, { text: '❌ Failed to load config.' }, { quoted: shonux });
          }
          break;
        }

        case 'resetconfig': {
          const sanitized = (number || '').replace(/[^0-9]/g, '');
          const senderNum = (nowsender || '').split('@')[0];
          const ownerNum = config.OWNER_NUMBER.replace(/[^0-9]/g, '');
          if (senderNum !== sanitized && senderNum !== ownerNum) {
            const shonux = {
              key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_RESETCONFIG1" },
              message: { contactMessage: { displayName: BOT_NAME_FANCY, vcard: FAKE_VCARD(BOT_NAME_FANCY) } }
            };
            await socket.sendMessage(sender, { text: '❌ Permission denied. Only the session owner or bot owner can reset configs.' }, { quoted: shonux });
            break;
          }

          try {
            await setUserConfigInMongo(sanitized, {});

            const shonux = {
              key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_RESETCONFIG2" },
              message: { contactMessage: { displayName: BOT_NAME_FANCY, vcard: FAKE_VCARD(BOT_NAME_FANCY) } }
            };

            await socket.sendMessage(sender, { text: '✅ Session config reset to defaults.' }, { quoted: shonux });
          } catch (e) {
            console.error('resetconfig error', e);
            const shonux = {
              key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_RESETCONFIG3" },
              message: { contactMessage: { displayName: BOT_NAME_FANCY, vcard: FAKE_VCARD(BOT_NAME_FANCY) } }
            };

            await socket.sendMessage(sender, { text: '❌ Failed to reset config.' }, { quoted: shonux });
          }
          break;
        }

        case 'owner': {
          try { await socket.sendMessage(sender, { react: { text: "🥷", key: msg.key } }); } catch(e){}

          try {
            let userCfg = {};
            try { if (number && typeof loadUserConfigFromMongo === 'function') userCfg = await loadUserConfigFromMongo((number || '').replace(/[^0-9]/g, '')) || {}; } catch(e){ userCfg = {}; }
            const title = userCfg.botName || ' _© MADUSANKA-MD || 🇱🇰_';

            const shonux = {
                key: {
                    remoteJid: "status@broadcast",
                    participant: "0@s.whatsapp.net",
                    fromMe: false,
                    id: "META_AI_FAKE_ID_OWNER"
                },
                message: {
                    contactMessage: {
                        displayName: title,
                        vcard: `BEGIN:VCARD
VERSION:3.0
N:${title};;;;
FN:${title}
ORG:Meta Platforms
TEL;type=CELL;type=VOICE;waid=13135550002:+1 313 555 0002
END:VCARD`
                    }
                }
            };

            const text = `
👑 *_© MADUSANKA-MD || 🇱🇰_ OWNER*

*👤 𝐍ame: ☠ 𝙼𝙰𝙳𝚄𝚂𝙰𝙽𝙺𝙰,ᴅᴄᴛ ᴅᴜʟᴀ ᴅᴇᴠ </> ☠︎︎�*
*📞 𝐍umber: +94787940686,+94752978237*

> 𝐏𝙾𝚆𝙴𝚁𝙴𝙳 𝐁𝚈 _© MADUSANKA-MD || 🇱🇰_
`.trim();

            await socket.sendMessage(sender, {
              text,
              footer: "🥷 𝐎ᴡɴᴇʀ 𝐈ɴꜰᴏʀᴍᴀᴛɪᴏɴ"
            }, { quoted: shonux });

          } catch (err) {
            console.error('owner command error:', err);
            try { await socket.sendMessage(sender, { text: '❌ Failed to show owner info.' }, { quoted: msg }); } catch(e){}
          }
          break;
        }

        case 'alive': {
          try {
            const sanitized = (number || '').replace(/[^0-9]/g, '');
            const cfg = await loadUserConfigFromMongo(sanitized) || {};
            const botName = cfg.botName || BOT_NAME_FANCY;
            const logo = cfg.logo || config.DCT_OFC_IMAGE_PATH;

            const metaQuote = {
              key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_ALIVE" },
              message: { contactMessage: { displayName: botName, vcard: FAKE_VCARD(botName) } }
            };

            const startTime = socketCreationTime.get(number) || Date.now();
            const uptime = Math.floor((Date.now() - startTime) / 1000);
            const hours = Math.floor(uptime / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);
            const seconds = Math.floor(uptime % 60);

            const text = `
*𝐇𝙸 👋 ${botName}  𝐁𝙾𝚃 𝐔𝚂𝙴𝚁 𝐈 𝐀𝙼 𝐀𝙻𝙸𝚅𝙴 𝐍𝙾𝚆 😼💗*

*╭─「 𝐒ᴛᴀᴛᴜꜱ 𝐃ᴇᴛᴀɪʟꜱ 」 ──●●➤*  
*│*👤 *𝐔ser :*
*│*🥷 *𝐎wner :* ${config.OWNER_NAME || 'DAMITH MADUSANKA'}
*│*✒️ *𝐏refix :* .
*│*🧬 *𝐕ersion :* 2.0.0
*│*🎈 *𝐏latform :* ${process.env.PLATFORM || 'Heroku'}
*│*📟 *𝐔ptime :* ${hours}h ${minutes}m ${seconds}s
*╰─────────────●●➤*

> *${botName}*
`;

            let imagePayload = String(logo).startsWith('http') ? { url: logo } : fs.readFileSync(logo);

            await socket.sendMessage(sender, {
              image: imagePayload,
              caption: text,
              footer: ` *${botName} 𝐀𝙻𝙸𝚅𝙴*`
            }, { quoted: metaQuote });

          } catch(e) {
            console.error('alive error', e);
            await socket.sendMessage(sender, { text: '❌ Failed to send alive status.' }, { quoted: msg });
          }
          break;
        }

        case 'ping': {
          try {
            const sanitized = (number || '').replace(/[^0-9]/g, '');
            const cfg = await loadUserConfigFromMongo(sanitized) || {};
            const botName = cfg.botName || BOT_NAME_FANCY;
            const logo = cfg.logo || config.DCT_OFC_IMAGE_PATH;

            const latency = Date.now() - (msg.messageTimestamp * 1000 || Date.now());

            const metaQuote = {
              key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_PING" },
              message: { contactMessage: { displayName: botName, vcard: FAKE_VCARD(botName) } }
            };

            const text = `
*📡 ${botName} 𝐏𝙸𝙽𝙶*
*🏓 𝐋atency:* ${latency}ms
*⏱ 𝐒erver 𝐓ime:* ${new Date().toLocaleString()}
`;

            let imagePayload = String(logo).startsWith('http') ? { url: logo } : fs.readFileSync(logo);

            await socket.sendMessage(sender, {
              image: imagePayload,
              caption: text,
              footer: ` *${botName} 𝐏𝙸𝙽𝙶*`
            }, { quoted: metaQuote });

          } catch(e) {
            console.error('ping error', e);
            await socket.sendMessage(sender, { text: '❌ Failed to get ping.' }, { quoted: msg });
          }
          break;
        }

        case 'activesessions':
        case 'active':
        case 'bots': {
          try {
            const sanitized = (number || '').replace(/[^0-9]/g, '');
            const cfg = await loadUserConfigFromMongo(sanitized) || {};
            const botName = cfg.botName || BOT_NAME_FANCY;
            const logo = cfg.logo || config.DCT_OFC_IMAGE_PATH;

            const admins = await loadAdminsFromMongo();
            const normalizedAdmins = (admins || []).map(a => (a || '').toString());
            const senderIdSimple = (nowsender || '').includes('@') ? nowsender.split('@')[0] : (nowsender || '');
            const isAdmin = normalizedAdmins.includes(nowsender) || normalizedAdmins.includes(senderNumber) || normalizedAdmins.includes(senderIdSimple);

            if (!isOwner && !isAdmin) {
              await socket.sendMessage(sender, { 
                text: '❌ Permission denied. Only bot owner or admins can check active sessions.' 
              }, { quoted: msg });
              break;
            }

            const activeCount = activeSockets.size;
            const activeNumbers = Array.from(activeSockets.keys());

            const metaQuote = {
              key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_ACTIVESESSIONS" },
              message: { contactMessage: { displayName: botName, vcard: FAKE_VCARD(botName) } }
            };

            let text = `*📡 𝐀ᴄᴛɪᴠᴇ 𝐒ᴇꜱꜱɪᴏɴꜱ - ${botName}*\n\n`;
            text += `📊 *𝐓otal 𝐀ctive 𝐒essions:* ${activeCount}\n\n`;

            if (activeCount > 0) {
              text += `📱 *𝐀ctive 𝐍umbers:*\n`;
              activeNumbers.forEach((num, index) => {
                text += `${index + 1}. ${num}\n`;
              });
            } else {
              text += `⚠️ No active sessions found.`;
            }

            text += `\n*🕒 𝐂hecked 𝐀t:* ${getSriLankaTimestamp()}`;

            let imagePayload = String(logo).startsWith('http') ? { url: logo } : fs.readFileSync(logo);

            await socket.sendMessage(sender, {
              image: imagePayload,
              caption: text,
              footer: `📊 *${botName} 𝐒𝙴𝚂𝚂𝙸𝙾𝙽 𝐒𝚃𝙰𝚃𝚄𝚂*`
            }, { quoted: metaQuote });

          } catch(e) {
            console.error('activesessions error', e);
            await socket.sendMessage(sender, { 
              text: '❌ Failed to fetch active sessions information.' 
            }, { quoted: msg });
          }
          break;
        }

        case 'settings': {
          try {
            const sanitized = (number || '').replace(/[^0-9]/g, '');
            const senderNum = (nowsender || '').split('@')[0];
            const ownerNum = config.OWNER_NUMBER.replace(/[^0-9]/g, '');
            
            if (senderNum !== sanitized && senderNum !== ownerNum) {
              const shonux = {
                key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_SETTINGS1" },
                message: { contactMessage: { displayName: BOT_NAME_FANCY, vcard: FAKE_VCARD(BOT_NAME_FANCY) } }
              };
              return await socket.sendMessage(sender, { text: '❌ Permission denied. Only the session owner or bot owner can view settings.' }, { quoted: shonux });
            }

            const currentConfig = await loadUserConfigFromMongo(sanitized) || {};
            const botName = currentConfig.botName || BOT_NAME_FANCY;
            
            const settingsText = `
*╭─「 𝗖𝚄𝚁𝚁𝙴𝙽𝚃 𝗦𝙴𝚃𝚃𝙸𝙽𝙶𝚂 」─●●➤*  
*│ 🔧  𝐖𝙾𝚁𝙺 𝐓𝚈𝙿𝙴:* ${currentConfig.WORK_TYPE || 'public'}
*│ 🎭  𝐏𝚁𝙴𝚂𝙴𝙽𝚂𝙴:* ${currentConfig.PRESENCE || 'available'}
*│ 👁️  𝐀𝚄𝚃𝙾 𝐒𝚃𝙰𝚃𝚄𝚂 𝐒𝙴𝙴𝙽:* ${currentConfig.AUTO_VIEW_STATUS || 'true'}
*│ ❤️  𝐀𝚄𝚃𝙾 𝐒𝚃𝙰𝚃𝚄𝚂 𝐑𝙴𝙰𝙲𝚃:* ${currentConfig.AUTO_LIKE_STATUS || 'true'}
*│ 📞  𝐀𝚄𝚃𝙾 𝐑𝙴𝙹𝙴𝙲𝚃 𝐂𝙰𝙻𝙻:* ${currentConfig.ANTI_CALL || 'off'}
*│ 📖  𝐀𝚄𝚃𝙾 𝐑𝙴𝙰𝙳 𝐌𝙴𝚂𝚂𝙰𝙶𝙴:* ${currentConfig.AUTO_READ_MESSAGE || 'off'}
*│ 🗑️  𝐀𝙽𝚃𝙸 𝘿𝙀𝙇𝙀𝚃𝙀:* ${currentConfig.ANTI_DELETE || 'off'}
*│ 🎥  𝐀𝚄𝚃𝙾 𝐑𝙾𝙲𝙾𝚁𝙳𝙸𝙽𝙶:* ${currentConfig.AUTO_RECORDING || 'false'}
*│ ⌨️  𝐀𝚄𝚃𝙾 𝐓𝚈𝙿𝙸𝙽𝙶:* ${currentConfig.AUTO_TYPING || 'false'}
*│ 🔣  𝐏𝚁𝙴𝙵𝙸𝚇:* ${currentConfig.PREFIX || '.'}
*│ 🎭  𝐒𝚃𝙰𝚃𝚄𝚂 𝐄𝙼𝙾𝙹𝙸𝚂:* ${(currentConfig.AUTO_LIKE_EMOJI || config.AUTO_LIKE_EMOJI).join(' ')}
*╰──────────────●●➤*

*𝐔se ${currentConfig.PREFIX || '.'}𝐒etting 𝐓o 𝐂hange 𝐒ettings 𝐕ia 𝐌enu*
            `;

            await socket.sendMessage(sender, {
              image: { url: currentConfig.logo || config.DCT_OFC_IMAGE_PATH },
              caption: settingsText
            }, { quoted: msg });
            
          } catch (e) {
            console.error('Settings command error:', e);
            const shonux = {
              key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_SETTINGS2" },
              message: { contactMessage: { displayName: BOT_NAME_FANCY, vcard: FAKE_VCARD(BOT_NAME_FANCY) } }
            };
            await socket.sendMessage(sender, { text: "*❌ Error loading settings!*" }, { quoted: shonux });
          }
          break;
        }

        case 'setting': {
          await socket.sendMessage(sender, { react: { text: '⚙️', key: msg.key } });
          try {
            const sanitized = (number || '').replace(/[^0-9]/g, '');
            const senderNum = (nowsender || '').split('@')[0];
            const ownerNum = config.OWNER_NUMBER.replace(/[^0-9]/g, '');
            
            if (senderNum !== sanitized && senderNum !== ownerNum) {
              const shonux = {
                key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_SETTING1" },
                message: { contactMessage: { displayName: BOT_NAME_FANCY, vcard: FAKE_VCARD(BOT_NAME_FANCY) } }
              };
              return await socket.sendMessage(sender, { text: '❌ Permission denied. Only the session owner or bot owner can change settings.' }, { quoted: shonux });
            }

            const currentConfig = await loadUserConfigFromMongo(sanitized) || {};
            const botName = currentConfig.botName || BOT_NAME_FANCY;
            const prefix = currentConfig.PREFIX || config.PREFIX;

            const settingOptions = {
              name: 'single_select',
              paramsJson: JSON.stringify({
                title: `🔧 ${botName} SETTINGS`,
                sections: [
                  {
                    title: '➤ 𝐖𝙾𝚁𝙺 𝐓𝚈𝙿𝙴',
                    rows: [
                      { title: '𝐏𝚄𝙱𝙻𝙸𝙲', description: '', id: `${prefix}wtype public` },
                      { title: '𝐎𝙽𝙻𝚈 𝐆𝚁𝙾𝚄𝙿', description: '', id: `${prefix}wtype groups` },
                      { title: '𝐎𝙽𝙻𝚈 𝐈𝙽𝙱𝙾𝚇', description: '', id: `${prefix}wtype inbox` },
                      { title: '𝐎𝙽𝙻𝚈 𝐏𝚁𝙸𝚅𝙰𝚃𝙴', description: '', id: `${prefix}wtype private` },
                    ],
                  },
                  {
                    title: '➤ 𝐅𝙰𝙺𝙴 𝐓𝚈𝙿𝙸𝙽𝙶',
                    rows: [
                      { title: '𝐀𝚄𝚃𝙾 𝐓𝚈𝙿𝙸𝙽𝙶 𝐎𝐍', description: '', id: `${prefix}autotyping on` },
                      { title: '𝐀𝚄𝚃𝙾 𝐓𝚈𝙿𝙸𝙽𝙶 𝐎𝐅𝐅', description: '', id: `${prefix}autotyping off` },
                    ],
                  },
                  {
                    title: '➤ 𝐅𝙰𝙺𝙴 𝐑𝙴𝙲𝙾𝙳𝙸𝙽𝙶',
                    rows: [
                      { title: '𝐀𝚄𝚃𝙾 𝐑𝙴𝙲𝙾𝚁𝙳𝙸𝙽𝙶 𝐎𝐍', description: '', id: `${prefix}autorecording on` },
                      { title: '𝐀𝚄𝚃𝙾 𝐑𝙴𝙲𝙾𝚁𝙳𝙸𝙽𝙶 𝐎𝐅𝐅', description: '', id: `${prefix}autorecording off` },
                    ],
                  },
                  {
                    title: '➤ 𝐀𝙻𝙻𝚆𝙰𝚈𝚂 𝐎𝙽𝙻𝙸𝙽𝙴',
                    rows: [
                      { title: '𝐀𝙻𝙻𝚆𝙰𝚈𝚂 𝐎𝙽𝙻𝙸𝙽𝙴 𝐎𝙽', description: '', id: `${prefix}botpresence online` },
                      { title: '𝐀𝙻𝙻𝚆𝙰𝚈𝚂 𝐎𝙽𝙻𝙸𝙽𝙴 𝐎𝙵𝙵', description: '', id: `${prefix}botpresence offline` },
                    ],
                  },
                  {
                    title: '➤ 𝐀𝚄𝚃𝙾 𝐒𝚃𝙰𝚃𝚄𝚂 𝐒𝙴𝙴𝙽',
                    rows: [
                      { title: '𝐒𝚃𝙰𝚃𝚄𝚂 𝐒𝙴𝙴𝙽 𝐎𝙽', description: '', id: `${prefix}rstatus on` },
                      { title: '𝐒𝚃𝙰𝚃𝚄𝚂 𝐒𝙴𝙴𝙽 𝐎𝙵𝙵', description: '', id: `${prefix}rstatus off` },
                    ],
                  },
                  {
                    title: '➤ 𝐀𝚄𝚃𝙾 𝐒𝚃𝙰𝚃𝚄𝚂 𝐑𝙴𝙰𝙲𝚃',
                    rows: [
                      { title: '𝐒𝚃𝙰𝚃𝚄𝚂 𝐑𝙴𝙰𝙲𝚃 𝐎𝙽', description: '', id: `${prefix}arm on` },
                      { title: '𝐒𝚃𝙰𝚃𝚄𝚂 𝐑𝙴𝙰𝙲𝚃 𝐎𝙵𝙵', description: '', id: `${prefix}arm off` },
                    ],
                  }, 
                  {
                    title: '➤ 𝐀𝚄𝚃𝙾 𝐑𝙴𝙹𝙴𝙲𝚃 𝐂𝙰𝙻𝙻',
                    rows: [
                      { title: '𝐀𝚄𝚃𝙾 𝐑𝙴𝙹𝙴𝙲𝚃 𝐂𝙰𝙻𝙻 𝐎𝙽', description: '', id: `${prefix}creject on` },
                      { title: '𝐀𝚄𝚃𝙾 𝐑𝙴𝙹𝙴𝙲𝚃 𝐂𝙰𝙻𝙻 𝐎𝙵𝙵', description: '', id: `${prefix}creject off` },
                    ],
                  },
                  {
                    title: '➤ 𝐀𝚄𝚃𝙾 𝐌𝙰𝚂𝚂𝙰𝙶𝙴 𝐑𝙴𝙰𝙳',
                    rows: [
                      { title: '𝐑𝙴𝙰𝙳 𝐀𝙻𝙻 𝐌𝙰𝚂𝚂𝙰𝙶𝙴𝚂', description: '', id: `${prefix}mread all` },
                      { title: '𝐑𝙴𝙰𝙳 𝐀𝙻𝙻 𝐌𝙰𝚂𝚂𝙰𝙶𝙴𝚂 𝐂𝙾𝙼𝙼𝙰𝙽𝙳𝚂', description: '', id: `${prefix}mread cmd` },
                      { title: '𝐃𝙾𝙽𝚃 𝐑𝙴𝙰𝙳 𝐀𝙽𝚈 𝐌𝙰𝚂𝚂𝙰𝙶𝙴', description: '', id: `${prefix}mread off` },
                    ],
                  },
                  {
                    title: '➤ 𝐀𝙽𝚃𝙸 𝘿𝙀𝙇𝙀𝚃𝙀',
                    rows: [
                      { title: '𝐀𝙽𝚃𝙸 𝘿𝙀𝙇𝙀𝚃𝙀 𝐎𝙉', description: '', id: `${prefix}antidelete on` },
                      { title: '𝐀𝙽𝚃𝙸 𝘿𝙀𝙇𝙀𝚃𝙀 𝐎𝙵𝙵', description: '', id: `${prefix}antidelete off` },
                      { title: '𝐀𝙽𝚃𝙸 𝘿𝙀𝙇𝙀𝚃𝙀 𝐆𝚁𝙾𝚄𝙿', description: '', id: `${prefix}antidelete group` },
                      { title: '𝐀𝙽𝚃𝙸 𝘿𝙀𝙇𝙀𝚃𝙀 𝐈𝙽𝙱𝙾𝚇', description: '', id: `${prefix}antidelete inbox` },
                    ],
                  },
                ],
              }),
            };

            await socket.sendMessage(sender, {
              headerType: 1,
              viewOnce: true,
              image: { url: currentConfig.logo || config.DCT_OFC_IMAGE_PATH },
              caption: `*╭────────────╮*\n*𝐔𝙿𝙳𝙰𝚃𝙴 𝐒𝙴𝚃𝚃𝙸𝙽𝙶 𝐍𝙾𝚃 𝐖𝙰𝚃𝙲𝙷*\n*╰────────────╯*\n\n` +
                `┏━━━━━━━━━━◆◉◉➤\n` +
                `┃◉ *𝐖ᴏʀᴋ 𝐓ʏᴘᴇ:* ${currentConfig.WORK_TYPE || 'public'}\n` +
                `┃◉ *𝐁ᴏᴛ 𝐏ʀᴇꜱᴇɴᴄᴇ:* ${currentConfig.PRESENCE || 'available'}\n` +
                `┃◉ *𝐀ᴜᴛɪ 𝐒ᴛᴀᴛᴜꜱ 𝐒ᴇᴇɴ:* ${currentConfig.AUTO_VIEW_STATUS || 'true'}\n` +
                `┃◉ *𝐀ᴜᴛᴏ 𝐒ᴛᴀᴛᴜꜱ 𝐑ᴇᴀᴄᴛ:* ${currentConfig.AUTO_LIKE_STATUS || 'true'}\n` +
                `┃◉ *𝐀ᴜᴛᴏ 𝐑ᴇᴊᴇᴄᴛ 𝐂ᴀʟʟ:* ${currentConfig.ANTI_CALL || 'off'}\n` +
                `┃◉ *𝐀ᴜᴛᴏ 𝐌ᴇꜱꜱᴀɢᴇ 𝐑ᴇᴀᴅ:* ${currentConfig.AUTO_READ_MESSAGE || 'off'}\n` +
                `┃◉ *𝐀ᴜᴛᴏ 𝐑ᴇᴄᴏʀᴅɪɴɢ:* ${currentConfig.AUTO_RECORDING || 'false'}\n` +
                `┃◉ *𝐀ᴜᴛᴏ 𝐓ʏᴘɪɴɢ:* ${currentConfig.AUTO_TYPING || 'false'}\n` +
                `┗━━━━━━━━━━◆◉◉➤`,
              footer: botName,
            }, { quoted: msg });
          } catch (e) {
            console.error('Setting command error:', e);
            const shonux = {
              key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_SETTING2" },
              message: { contactMessage: { displayName: BOT_NAME_FANCY, vcard: FAKE_VCARD(BOT_NAME_FANCY) } }
            };
            await socket.sendMessage(sender, { text: "*❌ Error loading settings!*" }, { quoted: shonux });
          }
          break;
        }

        case 'wtype': {
          await socket.sendMessage(sender, { react: { text: '🛠️', key: msg.key } });
          try {
            const sanitized = (number || '').replace(/[^0-9]/g, '');
            const senderNum = (nowsender || '').split('@')[0];
            const ownerNum = config.OWNER_NUMBER.replace(/[^0-9]/g, '');
            
            if (senderNum !== sanitized && senderNum !== ownerNum) {
              const shonux = {
                key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_WTYPE1" },
                message: { contactMessage: { displayName: BOT_NAME_FANCY, vcard: FAKE_VCARD(BOT_NAME_FANCY) } }
              };
              return await socket.sendMessage(sender, { text: '❌ Permission denied. Only the session owner or bot owner can change work type.' }, { quoted: shonux });
            }
            
            let q = args[0];
            const settings = {
              groups: "groups",
              inbox: "inbox", 
              private: "private",
              public: "public"
            };
            
            if (settings[q]) {
              const userConfig = await loadUserConfigFromMongo(sanitized) || {};
              userConfig.WORK_TYPE = settings[q];
              await setUserConfigInMongo(sanitized, userConfig);
              
              const shonux = {
                key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_WTYPE2" },
                message: { contactMessage: { displayName: BOT_NAME_FANCY, vcard: FAKE_VCARD(BOT_NAME_FANCY) } }
              };
              await socket.sendMessage(sender, { text: `✅ *Your Work Type updated to: ${settings[q]}*` }, { quoted: shonux });
            } else {
              const shonux = {
                key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_WTYPE3" },
                message: { contactMessage: { displayName: BOT_NAME_FANCY, vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${BOT_NAME_FANCY};;;;\nFN:${BOT_NAME_FANCY}\nORG:Meta Platforms\nTEL;type=CELL;type=VOICE;waid=13135550002:+1 313 555 0002\nEND:VCARD` } }
              };
              await socket.sendMessage(sender, { text: "❌ *Invalid option!*\n\nAvailable options:\n- public\n- groups\n- inbox\n- private" }, { quoted: shonux });
            }
          } catch (e) {
            console.error('Wtype command error:', e);
            const shonux = {
              key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_WTYPE4" },
              message: { contactMessage: { displayName: BOT_NAME_FANCY, vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${BOT_NAME_FANCY};;;;\nFN:${BOT_NAME_FANCY}\nORG:Meta Platforms\nTEL;type=CELL;type=VOICE;waid=13135550002:+1 313 555 0002\nEND:VCARD` } }
            };
            await socket.sendMessage(sender, { text: "*❌ Error updating your work type!*" }, { quoted: shonux });
          }
          break;
        }

        case 'botpresence': {
          await socket.sendMessage(sender, { react: { text: '🤖', key: msg.key } });
          try {
            const sanitized = (number || '').replace(/[^0-9]/g, '');
            const senderNum = (nowsender || '').split('@')[0];
            const ownerNum = config.OWNER_NUMBER.replace(/[^0-9]/g, '');
            
            if (senderNum !== sanitized && senderNum !== ownerNum) {
              const shonux = {
                key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_PRESENCE1" },
                message: { contactMessage: { displayName: BOT_NAME_FANCY, vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${BOT_NAME_FANCY};;;;\nFN:${BOT_NAME_FANCY}\nORG:Meta Platforms\nTEL;type=CELL;type=VOICE;waid=13135550002:+1 313 555 0002\nEND:VCARD` } }
              };
              return await socket.sendMessage(sender, { text: '❌ Permission denied. Only the session owner or bot owner can change bot presence.' }, { quoted: shonux });
            }
            
            let q = args[0];
            const settings = {
              online: "available",
              offline: "unavailable"
            };
            
            if (settings[q]) {
              const userConfig = await loadUserConfigFromMongo(sanitized) || {};
              userConfig.PRESENCE = settings[q];
              await setUserConfigInMongo(sanitized, userConfig);
              
              await socket.sendPresenceUpdate(settings[q]);
              
              const shonux = {
                key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_PRESENCE2" },
                message: { contactMessage: { displayName: BOT_NAME_FANCY, vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${BOT_NAME_FANCY};;;;\nFN:${BOT_NAME_FANCY}\nORG:Meta Platforms\nTEL;type=CELL;type=VOICE;waid=13135550002:+1 313 555 0002\nEND:VCARD` } }
              };
              await socket.sendMessage(sender, { text: `✅ *Your Bot Presence updated to: ${q}*` }, { quoted: shonux });
            } else {
              const shonux = {
                key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_PRESENCE3" },
                message: { contactMessage: { displayName: BOT_NAME_FANCY, vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${BOT_NAME_FANCY};;;;\nFN:${BOT_NAME_FANCY}\nORG:Meta Platforms\nTEL;type=CELL;type=VOICE;waid=13135550002:+1 313 555 0002\nEND:VCARD` } }
              };
              await socket.sendMessage(sender, { text: "❌ *Invalid option!*\n\nAvailable options:\n- online\n- offline" }, { quoted: shonux });
            }
          } catch (e) {
            console.error('Botpresence command error:', e);
            const shonux = {
              key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_PRESENCE4" },
              message: { contactMessage: { displayName: BOT_NAME_FANCY, vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${BOT_NAME_FANCY};;;;\nFN:${BOT_NAME_FANCY}\nORG:Meta Platforms\nTEL;type=CELL;type=VOICE;waid=13135550002:+1 313 555 0002\nEND:VCARD` } }
            };
            await socket.sendMessage(sender, { text: "*❌ Error updating your bot presence!*" }, { quoted: shonux });
          }
          break;
        }

        case 'autotyping': {
          await socket.sendMessage(sender, { react: { text: '⌨️', key: msg.key } });
          try {
            const sanitized = (number || '').replace(/[^0-9]/g, '');
            const senderNum = (nowsender || '').split('@')[0];
            const ownerNum = config.OWNER_NUMBER.replace(/[^0-9]/g, '');
            
            if (senderNum !== sanitized && senderNum !== ownerNum) {
              const shonux = {
                key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_TYPING1" },
                message: { contactMessage: { displayName: BOT_NAME_FANCY, vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${BOT_NAME_FANCY};;;;\nFN:${BOT_NAME_FANCY}\nORG:Meta Platforms\nTEL;type=CELL;type=VOICE;waid=13135550002:+1 313 555 0002\nEND:VCARD` } }
              };
              return await socket.sendMessage(sender, { text: '❌ Permission denied. Only the session owner or bot owner can change auto typing.' }, { quoted: shonux });
            }
            
            let q = args[0];
            const settings = { on: "true", off: "false" };
            
            if (settings[q]) {
              const userConfig = await loadUserConfigFromMongo(sanitized) || {};
              userConfig.AUTO_TYPING = settings[q];
              
              if (q === 'on') {
                userConfig.AUTO_RECORDING = "false";
              }
              
              await setUserConfigInMongo(sanitized, userConfig);
              
              const shonux = {
                key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_TYPING2" },
                message: { contactMessage: { displayName: BOT_NAME_FANCY, vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${BOT_NAME_FANCY};;;;\nFN:${BOT_NAME_FANCY}\nORG:Meta Platforms\nTEL;type=CELL;type=VOICE;waid=13135550002:+1 313 555 0002\nEND:VCARD` } }
              };
              await socket.sendMessage(sender, { text: `✅ *Auto Typing ${q === 'on' ? 'ENABLED' : 'DISABLED'}*` }, { quoted: shonux });
            } else {
              const shonux = {
                key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_TYPING3" },
                message: { contactMessage: { displayName: BOT_NAME_FANCY, vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${BOT_NAME_FANCY};;;;\nFN:${BOT_NAME_FANCY}\nORG:Meta Platforms\nTEL;type=CELL;type=VOICE;waid=13135550002:+1 313 555 0002\nEND:VCARD` } }
              };
              await socket.sendMessage(sender, { text: "❌ *Options:* on / off" }, { quoted: shonux });
            }
          } catch (e) {
            console.error('Autotyping error:', e);
            const shonux = {
              key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_TYPING4" },
              message: { contactMessage: { displayName: BOT_NAME_FANCY, vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${BOT_NAME_FANCY};;;;\nFN:${BOT_NAME_FANCY}\nORG:Meta Platforms\nTEL;type=CELL;type=VOICE;waid=13135550002:+1 313 555 0002\nEND:VCARD` } }
            };
            await socket.sendMessage(sender, { text: "*❌ Error updating auto typing!*" }, { quoted: shonux });
          }
          break;
        }

        case 'rstatus': {
          await socket.sendMessage(sender, { react: { text: '👁️', key: msg.key } });
          try {
            const sanitized = (number || '').replace(/[^0-9]/g, '');
            const senderNum = (nowsender || '').split('@')[0];
            const ownerNum = config.OWNER_NUMBER.replace(/[^0-9]/g, '');
            
            if (senderNum !== sanitized && senderNum !== ownerNum) {
              const shonux = {
                key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_RSTATUS1" },
                message: { contactMessage: { displayName: BOT_NAME_FANCY, vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${BOT_NAME_FANCY};;;;\nFN:${BOT_NAME_FANCY}\nORG:Meta Platforms\nTEL;type=CELL;type=VOICE;waid=13135550002:+1 313 555 0002\nEND:VCARD` } }
              };
              return await socket.sendMessage(sender, { text: '❌ Permission denied. Only the session owner or bot owner can change status seen setting.' }, { quoted: shonux });
            }
            
            let q = args[0];
            const settings = { on: "true", off: "false" };
            
            if (settings[q]) {
              const userConfig = await loadUserConfigFromMongo(sanitized) || {};
              userConfig.AUTO_VIEW_STATUS = settings[q];
              await setUserConfigInMongo(sanitized, userConfig);
              
              const shonux = {
                key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_RSTATUS2" },
                message: { contactMessage: { displayName: BOT_NAME_FANCY, vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${BOT_NAME_FANCY};;;;\nFN:${BOT_NAME_FANCY}\nORG:Meta Platforms\nTEL;type=CELL;type=VOICE;waid=13135550002:+1 313 555 0002\nEND:VCARD` } }
              };
              await socket.sendMessage(sender, { text: `✅ *Your Auto Status Seen ${q === 'on' ? 'ENABLED' : 'DISABLED'}*` }, { quoted: shonux });
            } else {
              const shonux = {
                key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_RSTATUS3" },
                message: { contactMessage: { displayName: BOT_NAME_FANCY, vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${BOT_NAME_FANCY};;;;\nFN:${BOT_NAME_FANCY}\nORG:Meta Platforms\nTEL;type=CELL;type=VOICE;waid=13135550002:+1 313 555 0002\nEND:VCARD` } }
              };
              await socket.sendMessage(sender, { text: "❌ *Invalid option!*\n\nAvailable options:\n- on\n- off" }, { quoted: shonux });
            }
          } catch (e) {
            console.error('Rstatus command error:', e);
            const shonux = {
              key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_RSTATUS4" },
              message: { contactMessage: { displayName: BOT_NAME_FANCY, vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${BOT_NAME_FANCY};;;;\nFN:${BOT_NAME_FANCY}\nORG:Meta Platforms\nTEL;type=CELL;type=VOICE;waid=13135550002:+1 313 555 0002\nEND:VCARD` } }
            };
            await socket.sendMessage(sender, { text: "*❌ Error updating your status seen setting!*" }, { quoted: shonux });
          }
          break;
        }

        case 'creject': {
          await socket.sendMessage(sender, { react: { text: '📞', key: msg.key } });
          try {
            const sanitized = (number || '').replace(/[^0-9]/g, '');
            const senderNum = (nowsender || '').split('@')[0];
            const ownerNum = config.OWNER_NUMBER.replace(/[^0-9]/g, '');
            
            if (senderNum !== sanitized && senderNum !== ownerNum) {
              const shonux = {
                key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_CREJECT1" },
                message: { contactMessage: { displayName: BOT_NAME_FANCY, vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${BOT_NAME_FANCY};;;;\nFN:${BOT_NAME_FANCY}\nORG:Meta Platforms\nTEL;type=CELL;type=VOICE;waid=13135550002:+1 313 555 0002\nEND:VCARD` } }
              };
              return await socket.sendMessage(sender, { text: '❌ Permission denied. Only the session owner or bot owner can change call reject setting.' }, { quoted: shonux });
            }
            
            let q = args[0];
            const settings = { on: "on", off: "off" };
            
            if (settings[q]) {
              const userConfig = await loadUserConfigFromMongo(sanitized) || {};
              userConfig.ANTI_CALL = settings[q];
              await setUserConfigInMongo(sanitized, userConfig);
              
              const shonux = {
                key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_CREJECT2" },
                message: { contactMessage: { displayName: BOT_NAME_FANCY, vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${BOT_NAME_FANCY};;;;\nFN:${BOT_NAME_FANCY}\nORG:Meta Platforms\nTEL;type=CELL;type=VOICE;waid=13135550002:+1 313 555 0002\nEND:VCARD` } }
              };
              await socket.sendMessage(sender, { text: `✅ *Your Auto Call Reject ${q === 'on' ? 'ENABLED' : 'DISABLED'}*` }, { quoted: shonux });
            } else {
              const shonux = {
                key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_CREJECT3" },
                message: { contactMessage: { displayName: BOT_NAME_FANCY, vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${BOT_NAME_FANCY};;;;\nFN:${BOT_NAME_FANCY}\nORG:Meta Platforms\nTEL;type=CELL;type=VOICE;waid=13135550002:+1 313 555 0002\nEND:VCARD` } }
              };
              await socket.sendMessage(sender, { text: "❌ *Invalid option!*\n\nAvailable options:\n- on\n- off" }, { quoted: shonux });
            }
          } catch (e) {
            console.error('Creject command error:', e);
            const shonux = {
              key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_CREJECT4" },
              message: { contactMessage: { displayName: BOT_NAME_FANCY, vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${BOT_NAME_FANCY};;;;\nFN:${BOT_NAME_FANCY}\nORG:Meta Platforms\nTEL;type=CELL;type=VOICE;waid=13135550002:+1 313 555 0002\nEND:VCARD` } }
            };
            await socket.sendMessage(sender, { text: "*❌ Error updating your call reject setting!*" }, { quoted: shonux });
          }
          break;
        }

        case 'arm': {
          await socket.sendMessage(sender, { react: { text: '❤️', key: msg.key } });
          try {
            const sanitized = (number || '').replace(/[^0-9]/g, '');
            const senderNum = (nowsender || '').split('@')[0];
            const ownerNum = config.OWNER_NUMBER.replace(/[^0-9]/g, '');
            
            if (senderNum !== sanitized && senderNum !== ownerNum) {
              const shonux = {
                key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_ARM1" },
                message: { contactMessage: { displayName: BOT_NAME_FANCY, vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${BOT_NAME_FANCY};;;;\nFN:${BOT_NAME_FANCY}\nORG:Meta Platforms\nTEL;type=CELL;type=VOICE;waid=13135550002:+1 313 555 0002\nEND:VCARD` } }
              };
              return await socket.sendMessage(sender, { text: '❌ Permission denied. Only the session owner or bot owner can change status react setting.' }, { quoted: shonux });
            }
            
            let q = args[0];
            const settings = { on: "true", off: "false" };
            
            if (settings[q]) {
              const userConfig = await loadUserConfigFromMongo(sanitized) || {};
              userConfig.AUTO_LIKE_STATUS = settings[q];
              await setUserConfigInMongo(sanitized, userConfig);
              
              const shonux = {
                key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_ARM2" },
                message: { contactMessage: { displayName: BOT_NAME_FANCY, vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${BOT_NAME_FANCY};;;;\nFN:${BOT_NAME_FANCY}\nORG:Meta Platforms\nTEL;type=CELL;type=VOICE;waid=13135550002:+1 313 555 0002\nEND:VCARD` } }
              };
              await socket.sendMessage(sender, { text: `✅ *Your Auto Status React ${q === 'on' ? 'ENABLED' : 'DISABLED'}*` }, { quoted: shonux });
            } else {
              const shonux = {
                key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_ARM3" },
                message: { contactMessage: { displayName: BOT_NAME_FANCY, vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${BOT_NAME_FANCY};;;;\nFN:${BOT_NAME_FANCY}\nORG:Meta Platforms\nTEL;type=CELL;type=VOICE;waid=13135550002:+1 313 555 0002\nEND:VCARD` } }
              };
              await socket.sendMessage(sender, { text: "❌ *Invalid option!*\n\nAvailable options:\n- on\n- off" }, { quoted: shonux });
            }
          } catch (e) {
            console.error('Arm command error:', e);
            const shonux = {
              key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_ARM4" },
              message: { contactMessage: { displayName: BOT_NAME_FANCY, vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${BOT_NAME_FANCY};;;;\nFN:${BOT_NAME_FANCY}\nORG:Meta Platforms\nTEL;type=CELL;type=VOICE;waid=13135550002:+1 313 555 0002\nEND:VCARD` } }
            };
            await socket.sendMessage(sender, { text: "*❌ Error updating your status react setting!*" }, { quoted: shonux });
          }
          break;
        }

        case 'mread': {
          await socket.sendMessage(sender, { react: { text: '📖', key: msg.key } });
          try {
            const sanitized = (number || '').replace(/[^0-9]/g, '');
            const senderNum = (nowsender || '').split('@')[0];
            const ownerNum = config.OWNER_NUMBER.replace(/[^0-9]/g, '');
            
            if (senderNum !== sanitized && senderNum !== ownerNum) {
              const shonux = {
                key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_MREAD1" },
                message: { contactMessage: { displayName: BOT_NAME_FANCY, vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${BOT_NAME_FANCY};;;;\nFN:${BOT_NAME_FANCY}\nORG:Meta Platforms\nTEL;type=CELL;type=VOICE;waid=13135550002:+1 313 555 0002\nEND:VCARD` } }
              };
              return await socket.sendMessage(sender, { text: '❌ Permission denied. Only the session owner or bot owner can change message read setting.' }, { quoted: shonux });
            }
            
            let q = args[0];
            const settings = { all: "all", cmd: "cmd", off: "off" };
            
            if (settings[q]) {
              const userConfig = await loadUserConfigFromMongo(sanitized) || {};
              userConfig.AUTO_READ_MESSAGE = settings[q];
              await setUserConfigInMongo(sanitized, userConfig);
              
              let statusText = "";
              switch (q) {
                case "all":
                  statusText = "READ ALL MESSAGES";
                  break;
                case "cmd":
                  statusText = "READ ONLY COMMAND MESSAGES"; 
                  break;
                case "off":
                  statusText = "DONT READ ANY MESSAGES";
                  break;
              }
              
              const shonux = {
                key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_MREAD2" },
                message: { contactMessage: { displayName: BOT_NAME_FANCY, vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${BOT_NAME_FANCY};;;;\nFN:${BOT_NAME_FANCY}\nORG:Meta Platforms\nTEL;type=CELL;type=VOICE;waid=13135550002:+1 313 555 0002\nEND:VCARD` } }
              };
              await socket.sendMessage(sender, { text: `✅ *Your Auto Message Read: ${statusText}*` }, { quoted: shonux });
            } else {
              const shonux = {
                key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_MREAD3" },
                message: { contactMessage: { displayName: BOT_NAME_FANCY, vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${BOT_NAME_FANCY};;;;\nFN:${BOT_NAME_FANCY}\nORG:Meta Platforms\nTEL;type=CELL;type=VOICE;waid=13135550002:+1 313 555 0002\nEND:VCARD` } }
              };
              await socket.sendMessage(sender, { text: "❌ *Invalid option!*\n\nAvailable options:\n- all\n- cmd\n- off" }, { quoted: shonux });
            }
          } catch (e) {
            console.error('Mread command error:', e);
            const shonux = {
              key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_MREAD4" },
              message: { contactMessage: { displayName: BOT_NAME_FANCY, vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${BOT_NAME_FANCY};;;;\nFN:${BOT_NAME_FANCY}\nORG:Meta Platforms\nTEL;type=CELL;type=VOICE;waid=13135550002:+1 313 555 0002\nEND:VCARD` } }
            };
            await socket.sendMessage(sender, { text: "*❌ Error updating your message read setting!*" }, { quoted: shonux });
          }
          break;
        }

        case 'antidelete': {
          await socket.sendMessage(sender, { react: { text: '🗑️', key: msg.key } });
          try {
            const sanitized = (number || '').replace(/[^0-9]/g, '');
            const senderNum = (nowsender || '').split('@')[0];
            const ownerNum = config.OWNER_NUMBER.replace(/[^0-9]/g, '');
            
            if (senderNum !== sanitized && senderNum !== ownerNum) {
              const shonux = {
                key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_ANTIDELETE1" },
                message: { contactMessage: { displayName: BOT_NAME_FANCY, vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${BOT_NAME_FANCY};;;;\nFN:${BOT_NAME_FANCY}\nORG:Meta Platforms\nTEL;type=CELL;type=VOICE;waid=13135550002:+1 313 555 0002\nEND:VCARD` } }
              };
              return await socket.sendMessage(sender, { text: '❌ Permission denied. Only the session owner or bot owner can change anti delete setting.' }, { quoted: shonux });
            }
            
            let q = args[0];
            const settings = { on: "on", off: "off", group: "group", inbox: "inbox" };
            
            if (settings[q]) {
              const userConfig = await loadUserConfigFromMongo(sanitized) || {};
              userConfig.ANTI_DELETE = settings[q];
              await setUserConfigInMongo(sanitized, userConfig);
              
              let statusText = "";
              switch (q) {
                case "on":
                  statusText = "ENABLED FOR ALL CHATS";
                  break;
                case "off":
                  statusText = "DISABLED";
                  break;
                case "group":
                  statusText = "ENABLED FOR GROUPS ONLY";
                  break;
                case "inbox":
                  statusText = "ENABLED FOR INBOX ONLY";
                  break;
              }
              
              const shonux = {
                key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_ANTIDELETE2" },
                message: { contactMessage: { displayName: BOT_NAME_FANCY, vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${BOT_NAME_FANCY};;;;\nFN:${BOT_NAME_FANCY}\nORG:Meta Platforms\nTEL;type=CELL;type=VOICE;waid=13135550002:+1 313 555 0002\nEND:VCARD` } }
              };
              await socket.sendMessage(sender, { text: `✅ *Anti Delete: ${statusText}*` }, { quoted: shonux });
            } else {
              const shonux = {
                key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_ANTIDELETE3" },
                message: { contactMessage: { displayName: BOT_NAME_FANCY, vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${BOT_NAME_FANCY};;;;\nFN:${BOT_NAME_FANCY}\nORG:Meta Platforms\nTEL;type=CELL;type=VOICE;waid=13135550002:+1 313 555 0002\nEND:VCARD` } }
              };
              await socket.sendMessage(sender, { text: "❌ *Invalid option!*\n\nAvailable options:\n- on (all chats)\n- off (disabled)\n- group (groups only)\n- inbox (inbox only)" }, { quoted: shonux });
            }
          } catch (e) {
            console.error('Antidelete command error:', e);
            const shonux = {
                key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_ANTIDELETE4" },
                message: { contactMessage: { displayName: BOT_NAME_FANCY, vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${BOT_NAME_FANCY};;;;\nFN:${BOT_NAME_FANCY}\nORG:Meta Platforms\nTEL;type=CELL;type=VOICE;waid=13135550002:+1 313 555 0002\nEND:VCARD` } }
              };
            await socket.sendMessage(sender, { text: "*❌ Error updating your anti delete setting!*" }, { quoted: shonux });
          }
          break;
        }

        case 'autorecording': {
          await socket.sendMessage(sender, { react: { text: '🎥', key: msg.key } });
          try {
            const sanitized = (number || '').replace(/[^0-9]/g, '');
            const senderNum = (nowsender || '').split('@')[0];
            const ownerNum = config.OWNER_NUMBER.replace(/[^0-9]/g, '');
            
            if (senderNum !== sanitized && senderNum !== ownerNum) {
              const shonux = {
                key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_RECORDING1" },
                message: { contactMessage: { displayName: BOT_NAME_FANCY, vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${BOT_NAME_FANCY};;;;\nFN:${BOT_NAME_FANCY}\nORG:Meta Platforms\nTEL;type=CELL;type=VOICE;waid=13135550002:+1 313 555 0002\nEND:VCARD` } }
              };
              return await socket.sendMessage(sender, { text: '❌ Permission denied. Only the session owner or bot owner can change auto recording.' }, { quoted: shonux });
            }
            
            let q = args[0];
            
            if (q === 'on' || q === 'off') {
              const userConfig = await loadUserConfigFromMongo(sanitized) || {};
              userConfig.AUTO_RECORDING = (q === 'on') ? "true" : "false";
              
              if (q === 'on') {
                userConfig.AUTO_TYPING = "false";
              }
              
              await setUserConfigInMongo(sanitized, userConfig);
              
              if (q === 'off') {
                await socket.sendPresenceUpdate('available', sender);
              }
              
              const shonux = {
                key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_RECORDING2" },
                message: { contactMessage: { displayName: BOT_NAME_FANCY, vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${BOT_NAME_FANCY};;;;\nFN:${BOT_NAME_FANCY}\nORG:Meta Platforms\nTEL;type=CELL;type=VOICE;waid=13135550002:+1 313 555 0002\nEND:VCARD` } }
              };
              await socket.sendMessage(sender, { text: `✅ *Auto Recording ${q === 'on' ? 'ENABLED' : 'DISABLED'}*` }, { quoted: shonux });
            } else {
              const shonux = {
                key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_RECORDING3" },
                message: { contactMessage: { displayName: BOT_NAME_FANCY, vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${BOT_NAME_FANCY};;;;\nFN:${BOT_NAME_FANCY}\nORG:Meta Platforms\nTEL;type=CELL;type=VOICE;waid=13135550002:+1 313 555 0002\nEND:VCARD` } }
              };
              await socket.sendMessage(sender, { text: "❌ *Invalid! Use:* .autorecording on/off" }, { quoted: shonux });
            }
          } catch (e) {
            console.error('Autorecording error:', e);
            const shonux = {
              key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_RECORDING4" },
              message: { contactMessage: { displayName: BOT_NAME_FANCY, vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${BOT_NAME_FANCY};;;;\nFN:${BOT_NAME_FANCY}\nORG:Meta Platforms\nTEL;type=CELL;type=VOICE;waid=13135550002:+1 313 555 0002\nEND:VCARD` } }
            };
            await socket.sendMessage(sender, { text: "*❌ Error updating auto recording!*" }, { quoted: shonux });
          }
          break;
        }

        case 'prefix': {
          await socket.sendMessage(sender, { react: { text: '🔣', key: msg.key } });
          try {
            const sanitized = (number || '').replace(/[^0-9]/g, '');
            const senderNum = (nowsender || '').split('@')[0];
            const ownerNum = config.OWNER_NUMBER.replace(/[^0-9]/g, '');
            
            if (senderNum !== sanitized && senderNum !== ownerNum) {
              const shonux = {
                key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_PREFIX1" },
                message: { contactMessage: { displayName: BOT_NAME_FANCY, vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${BOT_NAME_FANCY};;;;\nFN:${BOT_NAME_FANCY}\nORG:Meta Platforms\nTEL;type=CELL;type=VOICE;waid=13135550002:+1 313 555 0002\nEND:VCARD` } }
              };
              return await socket.sendMessage(sender, { text: '❌ Permission denied. Only the session owner or bot owner can change prefix.' }, { quoted: shonux });
            }
            
            let newPrefix = args[0];
            if (!newPrefix || newPrefix.length > 2) {
              const shonux = {
                key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_PREFIX2" },
                message: { contactMessage: { displayName: BOT_NAME_FANCY, vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${BOT_NAME_FANCY};;;;\nFN:${BOT_NAME_FANCY}\nORG:Meta Platforms\nTEL;type=CELL;type=VOICE;waid=13135550002:+1 313 555 0002\nEND:VCARD` } }
              };
              return await socket.sendMessage(sender, { text: "❌ *Invalid prefix!*\nPrefix must be 1-2 characters long." }, { quoted: shonux });
            }
            
            const userConfig = await loadUserConfigFromMongo(sanitized) || {};
            userConfig.PREFIX = newPrefix;
            await setUserConfigInMongo(sanitized, userConfig);
            
            const shonux = {
              key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_PREFIX3" },
              message: { contactMessage: { displayName: BOT_NAME_FANCY, vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${BOT_NAME_FANCY};;;;\nFN:${BOT_NAME_FANCY}\nORG:Meta Platforms\nTEL;type=CELL;type=VOICE;waid=13135550002:+1 313 555 0002\nEND:VCARD` } }
            };
            await socket.sendMessage(sender, { text: `✅ *Your Prefix updated to: ${newPrefix}*` }, { quoted: shonux });
          } catch (e) {
            console.error('Prefix command error:', e);
            const shonux = {
              key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_PREFIX4" },
              message: { contactMessage: { displayName: BOT_NAME_FANCY, vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${BOT_NAME_FANCY};;;;\nFN:${BOT_NAME_FANCY}\nORG:Meta Platforms\nTEL;type=CELL;type=VOICE;waid=13135550002:+1 313 555 0002\nEND:VCARD` } }
            };
            await socket.sendMessage(sender, { text: "*❌ Error updating your prefix!*" }, { quoted: shonux });
          }
          break;
        }

        case 'setbotname': {
          const sanitized = (number || '').replace(/[^0-9]/g, '');
          const senderNum = (nowsender || '').split('@')[0];
          const ownerNum = config.OWNER_NUMBER.replace(/[^0-9]/g, '');
          if (senderNum !== sanitized && senderNum !== ownerNum) {
            const shonux = {
              key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_SETBOTNAME1" },
              message: { contactMessage: { displayName: BOT_NAME_FANCY, vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${BOT_NAME_FANCY};;;;\nFN:${BOT_NAME_FANCY}\nORG:Meta Platforms\nTEL;type=CELL;type=VOICE;waid=13135550002:+1 313 555 0002\nEND:VCARD` } }
            };
            await socket.sendMessage(sender, { text: '❌ Permission denied. Only the session owner or bot owner can change this session bot name.' }, { quoted: shonux });
            break;
          }

          const name = args.join(' ').trim();
          if (!name) {
            const shonux = {
              key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_SETBOTNAME2" },
              message: { contactMessage: { displayName: BOT_NAME_FANCY, vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${BOT_NAME_FANCY};;;;\nFN:${BOT_NAME_FANCY}\nORG:Meta Platforms\nTEL;type=CELL;type=VOICE;waid=13135550002:+1 313 555 0002\nEND:VCARD` } }
            };
            return await socket.sendMessage(sender, { text: '❗ Provide bot name. Example: `.setbotname  _© ༺ ALONE X MOVIE BOT༻ || 🎬_- 01`' }, { quoted: shonux });
          }

          try {
            let cfg = await loadUserConfigFromMongo(sanitized) || {};
            cfg.botName = name;
            await setUserConfigInMongo(sanitized, cfg);

            const shonux = {
              key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_SETBOTNAME3" },
              message: { contactMessage: { displayName: BOT_NAME_FANCY, vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${BOT_NAME_FANCY};;;;\nFN:${BOT_NAME_FANCY}\nORG:Meta Platforms\nTEL;type=CELL;type=VOICE;waid=13135550002:+1 313 555 0002\nEND:VCARD` } }
            };

            await socket.sendMessage(sender, { text: `✅ Bot display name set for this session: ${name}` }, { quoted: shonux });
          } catch (e) {
            console.error('setbotname error', e);
            const shonux = {
              key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_SETBOTNAME4" },
              message: { contactMessage: { displayName: BOT_NAME_FANCY, vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${BOT_NAME_FANCY};;;;\nFN:${BOT_NAME_FANCY}\nORG:Meta Platforms\nTEL;type=CELL;type=VOICE;waid=13135550002:+1 313 555 0002\nEND:VCARD` } }
            };
            await socket.sendMessage(sender, { text: `❌ Failed to set bot name: ${e.message || e}` }, { quoted: shonux });
          }
          break;
        }

        default:
          break;
      }
    } catch (err) {
      console.error('Command handler error:', err);
      try { await socket.sendMessage(sender, { image: { url: config.DCT_OFC_IMAGE_PATH }, caption: formatMessage('❌ ERROR', 'An error occurred while processing your command. Please try again.', BOT_NAME_FANCY) }); } catch(e){}
    }

  });
}
// ==================== EXPRESS ENDPOINTS ====================

router.post('/newsletter/add', async (req, res) => {
  const { jid, emojis } = req.body;
  if (!jid) return res.status(400).send({ error: 'jid required' });
  if (!jid.endsWith('@newsletter')) return res.status(400).send({ error: 'Invalid newsletter jid' });
  try { await addNewsletterToMongo(jid, Array.isArray(emojis) ? emojis : []); res.status(200).send({ status: 'ok', jid }); }
  catch (e) { res.status(500).send({ error: e.message || e }); }
});

router.post('/newsletter/remove', async (req, res) => {
  const { jid } = req.body;
  if (!jid) return res.status(400).send({ error: 'jid required' });
  try { await removeNewsletterFromMongo(jid); res.status(200).send({ status: 'ok', jid }); }
  catch (e) { res.status(500).send({ error: e.message || e }); }
});

router.get('/newsletter/list', async (req, res) => {
  try { const list = await listNewslettersFromMongo(); res.status(200).send({ status: 'ok', channels: list }); }
  catch (e) { res.status(500).send({ error: e.message || e }); }
});

router.post('/admin/add', async (req, res) => {
  const { jid } = req.body;
  if (!jid) return res.status(400).send({ error: 'jid required' });
  try { await addAdminToMongo(jid); res.status(200).send({ status: 'ok', jid }); }
  catch (e) { res.status(500).send({ error: e.message || e }); }
});

router.post('/admin/remove', async (req, res) => {
  const { jid } = req.body;
  if (!jid) return res.status(400).send({ error: 'jid required' });
  try { await removeAdminFromMongo(jid); res.status(200).send({ status: 'ok', jid }); }
  catch (e) { res.status(500).send({ error: e.message || e }); }
});

router.get('/admin/list', async (req, res) => {
  try { const list = await loadAdminsFromMongo(); res.status(200).send({ status: 'ok', admins: list }); }
  catch (e) { res.status(500).send({ error: e.message || e }); }
});

router.get('/', async (req, res) => {
  const { number } = req.query;
  if (!number) return res.status(400).send({ error: 'Number parameter is required' });
  if (activeSockets.has(number.replace(/[^0-9]/g, ''))) return res.status(200).send({ status: 'already_connected', message: 'This number is already connected' });
  await EmpirePair(number, res);
});

router.get('/active', (req, res) => {
  res.status(200).send({ botName: BOT_NAME_FANCY, count: activeSockets.size, numbers: Array.from(activeSockets.keys()), timestamp: getSriLankaTimestamp() });
});

router.get('/ping', (req, res) => {
  res.status(200).send({ status: 'active', botName: BOT_NAME_FANCY, message: 'DCT NINJA X MD BOT', activesession: activeSockets.size });
});

router.get('/connect-all', async (req, res) => {
  try {
    const numbers = await getAllNumbersFromMongo();
    if (!numbers || numbers.length === 0) return res.status(404).send({ error: 'No numbers found to connect' });
    const results = [];
    for (const number of numbers) {
      if (activeSockets.has(number)) { results.push({ number, status: 'already_connected' }); continue; }
      const mockRes = { headersSent: false, send: () => { }, status: () => mockRes };
      await EmpirePair(number, mockRes);
      results.push({ number, status: 'connection_initiated' });
      await delay(1000);
    }
    res.status(200).send({ status: 'success', connections: results });
  } catch (error) { console.error('Connect all error:', error); res.status(500).send({ error: 'Failed to connect all bots' }); }
});

router.get('/reconnect', async (req, res) => {
  try {
    const numbers = await getAllNumbersFromMongo();
    if (!numbers || numbers.length === 0) return res.status(404).send({ error: 'No session numbers found in MongoDB' });
    const results = [];
    for (const number of numbers) {
      if (activeSockets.has(number)) { results.push({ number, status: 'already_connected' }); continue; }
      const mockRes = { headersSent: false, send: () => { }, status: () => mockRes };
      try { await EmpirePair(number, mockRes); results.push({ number, status: 'connection_initiated' }); } catch (err) { results.push({ number, status: 'failed', error: err.message }); }
      await delay(1000);
    }
    res.status(200).send({ status: 'success', connections: results });
  } catch (error) { console.error('Reconnect error:', error); res.status(500).send({ error: 'Failed to reconnect bots' }); }
});

router.get('/update-config', async (req, res) => {
  const { number, config: configString } = req.query;
  if (!number || !configString) return res.status(400).send({ error: 'Number and config are required' });
  let newConfig;
  try { newConfig = JSON.parse(configString); } catch (error) { return res.status(400).send({ error: 'Invalid config format' }); }
  const sanitizedNumber = number.replace(/[^0-9]/g, '');
  const socket = activeSockets.get(sanitizedNumber);
  if (!socket) return res.status(404).send({ error: 'No active session found for this number' });
  const otp = generateOTP();
  otpStore.set(sanitizedNumber, { otp, expiry: Date.now() + config.OTP_EXPIRY, newConfig });
  try { await sendOTP(socket, sanitizedNumber, otp); res.status(200).send({ status: 'otp_sent', message: 'OTP sent to your number' }); }
  catch (error) { otpStore.delete(sanitizedNumber); res.status(500).send({ error: 'Failed to send OTP' }); }
});

router.get('/verify-otp', async (req, res) => {
  const { number, otp } = req.query;
  if (!number || !otp) return res.status(400).send({ error: 'Number and OTP are required' });
  const sanitizedNumber = number.replace(/[^0-9]/g, '');
  const storedData = otpStore.get(sanitizedNumber);
  if (!storedData) return res.status(400).send({ error: 'No OTP request found for this number' });
  if (Date.now() >= storedData.expiry) { otpStore.delete(sanitizedNumber); return res.status(400).send({ error: 'OTP has expired' }); }
  if (storedData.otp !== otp) return res.status(400).send({ error: 'Invalid OTP' });
  try {
    await setUserConfigInMongo(sanitizedNumber, storedData.newConfig);
    otpStore.delete(sanitizedNumber);
    const sock = activeSockets.get(sanitizedNumber);
    if (sock) await sock.sendMessage(jidNormalizedUser(sock.user.id), { image: { url: config.DCT_OFC_IMAGE_PATH }, caption: formatMessage('📌 CONFIG UPDATED', 'Your configuration has been successfully updated!', BOT_NAME_FANCY) });
    res.status(200).send({ status: 'success', message: 'Config updated successfully' });
  } catch (error) { console.error('Failed to update config:', error); res.status(500).send({ error: 'Failed to update config' }); }
});

// ==================== CLEANUP ====================

process.on('exit', () => {
  activeSockets.forEach((socket, number) => {
    try { socket.ws.close(); } catch (e) { }
    activeSockets.delete(number);
    socketCreationTime.delete(number);
    try { fs.removeSync(path.join(os.tmpdir(), `session_${number}`)); } catch (e) { }
  });
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

initMongo().catch(err => console.warn('Mongo init failed at startup', err));

// Auto reconnect existing sessions on startup
(async () => {
  try {
    const nums = await getAllNumbersFromMongo();
    if (nums && nums.length) {
      console.log(`Found ${nums.length} sessions to reconnect...`);
      for (const n of nums) {
        if (!activeSockets.has(n)) {
          console.log(`Reconnecting session ${n}...`);
          const mockRes = { headersSent: false, send: () => { }, status: () => mockRes };
          await EmpirePair(n, mockRes);
          await delay(2000);
        }
      }
    }
  } catch (e) { console.error('Auto reconnect error:', e); }
})();

module.exports = router;
