// ============================
// REQUIRED PACKAGES
// ============================
const { Client, LocalAuth } = require('whatsapp-web.js');
const { Telegraf } = require('telegraf');
const qrcode = require('qrcode-terminal');
const express = require('express');

// ============================
// TELEGRAM BOT SETUP
// ============================
const bot = new Telegraf('YOUR_TELEGRAM_BOT_TOKEN'); 
// <-- এখানে আপনার Telegram bot token দিন

// ============================
// WHATSAPP CLIENT SETUP
// ============================
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { 
        headless: true, 
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    }
});

let currentQr = null;

// ============================
// WHATSAPP EVENTS
// ============================

client.on('qr', (qr) => {
    currentQr = qr;
    console.log('New QR generated. Use /connect in Telegram.');
});

client.on('ready', () => {
    currentQr = null;
    console.log('WhatsApp is ready!');
});

// ============================
// TELEGRAM COMMANDS
// ============================

// /connect command - show QR
bot.command('connect', async (ctx) => {
    if (currentQr) {
        const qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" + encodeURIComponent(currentQr);
        await ctx.replyWithPhoto(qrUrl, { caption: 'Scan this QR with WhatsApp' });
    } else {
        ctx.reply('Already connected or QR not ready.');
    }
});

// Text message handler - check numbers
bot.on('text', async (ctx) => {
    const text = ctx.message.text;
    const rawNumbers = text.match(/\d{3}[-\s]?\d{3}[-\s]?\d{4}/g);

    if (!rawNumbers) return;

    ctx.reply("🚀 Checking " + rawNumbers.length + " numbers...");

    let activeList = "";
    let inactiveList = "";

    await Promise.all(rawNumbers.map(async (num) => {
        let cleanNum = num.replace(/\D/g, '');
        if (cleanNum.length === 10) cleanNum = '1' + cleanNum;

        try {
            const isRegistered = await client.isRegisteredUser(cleanNum + "@c.us");
            if (isRegistered) {
                activeList += "`" + num + "`\n";
            } else {
                inactiveList += "✅ `" + num + "` 🇨🇦\n";
            }
        } catch (e) {
            console.log("Error:", num, e.message);
        }
    }));

    let response = "✨🎀 **Fresh List (Not on WhatsApp):**\n";
    response += inactiveList ? inactiveList : "None\n";
    
    response += "\n📱 **WhatsApp Active:**\n";
    response += activeList ? activeList : "None";
    
    response += "\n\n©️ **ᴄᴏᴘʏʀɪɢʜᴛ by @itzbadhon69**";

    ctx.replyWithMarkdown(response);
});

// ============================
// EXPRESS SERVER (24/7)
// ============================
const app = express();
app.get("/", (req, res) => {
    res.send("Bot is running");
});
app.listen(process.env.PORT || 3000, () => {
    console.log("Express server running");
});

// ============================
// INITIALIZE CLIENT & BOT
// ============================
client.initialize();
bot.launch();

console.log("Bot started successfully ✅");
