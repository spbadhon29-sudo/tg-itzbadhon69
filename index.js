const { Client, LocalAuth } = require('whatsapp-web.js');
const { Telegraf } = require('telegraf');
const qrcode = require('qrcode-terminal');

const bot = new Telegraf('8063710867:AAGR7MEsgpoJvFs9zmcLB-VUZ-NhFqtzRCI');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { 
        headless: true, 
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--no-zygote'
        ] 
    }
});

let currentQr = null;

client.on('qr', (qr) => {
    currentQr = qr;
    console.log('QR Code generated. Scan it soon!');
});

client.on('ready', () => {
    currentQr = null;
    console.log('WhatsApp is ready and connected!');
});

bot.command('connect', async (ctx) => {
    if (currentQr) {
        const qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" + encodeURIComponent(currentQr);
        await ctx.replyWithPhoto(qrUrl, { caption: 'Scan this QR with WhatsApp' });
    } else {
        ctx.reply('Already connected or QR not ready yet.');
    }
});

bot.on('text', async (ctx) => {
    const text = ctx.message.text;
    const rawNumbers = text.match(/\d{3}[-\s]?\d{3}[-\s]?\d{4}/g);

    if (!rawNumbers) return;

    ctx.reply("🚀 Checking " + rawNumbers.length + " numbers...");

    let activeList = "";
    let inactiveList = "";

    for (const num of rawNumbers) {
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
            console.log("Error checking:", num);
        }
    }

    let response = "✨🎀 **𝗙𝗿𝗲𝘀𝗵 𝗟𝗶𝘀𝘁 (𝗡𝗼𝘁 𝗼𝗻 𝗪𝗵𝗮𝘁𝘀𝗔𝗽𝗽):**\n" + (inactiveList || "None\n") +
                   "\n📱 **𝗪𝗵𝗮𝘁𝘀𝗔𝗽𝗽 𝗔𝗰𝘁𝗶𝘃𝗲:**\n" + (activeList || "None") +
                   "\n\n©️ **ᴄᴏᴘʏʀɪɢʜᴛ ʙʏ @itzbadhon69**";

    ctx.replyWithMarkdown(response);
});

client.initialize().catch(err => console.error('WA Error:', err.message));
bot.launch().then(() => console.log('Telegram Bot Active!'));