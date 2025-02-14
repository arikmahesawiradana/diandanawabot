const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = require('@whiskeysockets/baileys');
const fs = require('fs');
const express = require('express');
const { error } = require('console');

const app = express();
const PORT = 3000;

const conversationsFile = 'conversations.json';
const saveConversation = (msg) => {
    let conversations = [];
    if (fs.existsSync(conversationsFile)) {
        conversations = JSON.parse(fs.readFileSync(conversationsFile));
    }
    conversations.push(msg);
    fs.writeFileSync(conversationsFile, JSON.stringify(conversations, null, 2));
};

const startBot = async () => {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const { version } = await fetchLatestBaileysVersion();
    let lastMessage = {}; 

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: true,
        browser: ['Chrome (Linux)', '', ''],
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'open') {
            console.log('✅ WhatsApp Bot Connected!');
        } else if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('❌ Disconnected, trying to reconnect...', shouldReconnect);

            if (shouldReconnect) {
                startBot();  // Restart koneksi
            } else {
                console.log('🛑 Logout detected, please scan QR code again.');
                fs.rmSync('auth_info', { recursive: true, force: true });
            }
        }
    });

    // Fungsi untuk mengirim pesan dengan delay
    const sendReplyDelayed = (sock, sender, reply) => {
        const delay = Math.floor(Math.random() * 1000) + 1000; // 1-2 detik
        setTimeout(async () => {
            await sock.sendMessage(sender, { text: reply });
        }, delay);
    };

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return; // Abaikan pesan yang dikirim oleh bot sendiri

        const sender = msg.key.remoteJid;
        const textMessage = msg.message.conversation || msg.message.extendedTextMessage?.text;
        
        if (!textMessage) return; // Abaikan pesan yang bukan teks

        // Cek apakah pesan yang sama sudah dibalas sebelumnya
        if (lastMessage[sender] === textMessage.trim()) return;
        lastMessage[sender] = textMessage.trim(); // Simpan pesan terakhir
        saveConversation({ sender, message: textMessage.trim(), timestamp: Date.now() });
        console.log(`Message from ${sender}: ${textMessage}`);

        let reply;
        switch (textMessage.trim().toLowerCase()) {
            case '1':
                reply = `Baik! Silakan pilih jadwal dan kursus yang ingin kamu coba. Kami siap bantu biar kamu bisa belajar dengan nyaman! 😊\n\n` +
                        `Balas pesan ini dengan format berikut:\n\n` +
                        `🗓 *Hari*: (Pilih hari selain besok)\n` +
                        `⏰ *Jam*: (Tentukan waktu yang sesuai)\n\n` +
                        `Kalau butuh bantuan, jangan ragu buat tanya ya! Kami siap membantu. 🚀✨`;
                break;
            case '2':
                reply = `Kami menyediakan berbagai kelas seru buat kamu yang ingin belajar bahasa inggris! 🚀✨\n\n` +
                        `📌 *Pilihan Kelas:*\n` +
                        `- *Engish Basic - Primary 1*\n` +
                        `- *English Basic - Primary 2*\n` +
                        `- *English Grammar 1*\n` +
                        `- *English Grammar 2*\n` +
                        `- *English Speaking*\n` +
                        `- *Design Basic*\n\n` +
                        `📅 *Jadwal Fleksibel* – Bisa menyesuaikan dengan peserta!\n\n` +
                        `Mau mulai belajar? Balas pesan ini dengan format berikut:\n\n` +
                        `🗓 *Hari*: (Pilih hari selain besok)\n` +
                        `⏰ *Jam*: (Tentukan waktu yang sesuai)\n` +
                        `📚 *Kelas*: (Pilih kelas yang ingin diikuti)\n\n` +
                        `Kami tunggu ya! 🚀😊`;
                break;
            case '3':
                reply = `💰 *Harga & Paket Kursus* 💰\n\n` +
                        `🔹 *Private (1 sesi = 1 jam)*\n` +
                        `• 8 pertemuan → Rp 800.000\n` +
                        `• 16 pertemuan → Rp 1.600.000\n` +
                        `• 24 pertemuan → Rp 2.400.000\n\n` +
                        `🔹 *Group (5-10 orang, 1 sesi = 1,5 jam)*\n` +
                        `• 8 pertemuan → Rp 2.000.000 (dibagi jumlah peserta)\n` +
                        `• 16 pertemuan → Rp 4.000.000\n` +
                        `• 24 pertemuan → Rp 6.000.000\n\n` +
                        `Tertarik? Balas pesan ini dengan format:\n` + 
                        `*PRIVATE/GROUP PAKET KURSUS*\n` +
                        `Contoh:\n`+
                        `🔹 *PRIVATE 8 PRIMARY 1*\n` +
                        `🔹 *GROUP 16 GRAMMAR 1*\n\n` +
                        `Ayo upgrade skill-mu sekarang! 🚀🔥`;
                break;
            case '4':
                reply = `📩 *Cara Daftar:*\n\n` +
                        `Cukup balas pesan ini dengan format:\n` +
                        `*PRIVATE/GROUP PAKET KURSUS*\n` +
                        `Contoh:\n`+
                        `🔹 *PRIVATE 8 PRIMARY 1*\n` +
                        `🔹 *GROUP 16 GRAMMAR 1*\n\n` +
                        `Ayo upgrade skill-mu sekarang! 🚀🔥`;
                break;
            case '5':
                reply = `Tentu! Jangan ragu untuk bertanya ya. Admin kami siap membantu dan akan segera membalas pesan kamu! 😊`;
                break;
            case 'menu':
                reply = `🎉 Selamat Datang di Diandana English! 🎉\n\n` +
                        `Hai! Saya Diandan Robot 👋 Senang banget bisa ketemu kamu di sini. Yuk, pilih menu di bawah ini:\n\n` +
                        `📚 1. Kelas Gratis – Cobain kelas gratis sekarang!\n` +
                        `📖 2. Info Kelas – Lihat detail kelas & jadwalnya.\n` +
                        `💰 3. Harga – Cek daftar harga & paket kelas.\n` +
                        `📝 4. Pesan – Mau daftar atau konsultasi? Hubungi kami!\n` +
                        `❓ 5. Tanya – Ada yang mau ditanyain? Kami siap bantu!\n\n` +
                        `Balas pesan ini dengan 1, 2, 3, 4, atau 5 ya! 📩🚀`;
                break;
            default:
                reply = "random message";
        }
        if (reply === "random message"){
            console.log(reply);
        }
        else{
            sendReplyDelayed(sock, sender, reply);
        }
    });
    app.get('/asjsjljso2ueumdpjoh1u2iashsanlasla/send', async (req, res) => {
        let { num, text } = req.query;
        if (!num || !text) return res.json({ error: 'Missing parameters' });
        await sock.sendMessage(num, { text });
        text = "Me:\n" + text;
        saveConversation({ sender: num, message: text, timestamp: Date.now() });
        res.json({ success: true, sentTo: num, message: text });
    });

    app.get('/asjsjljso2ueumdpjoh1u2iashsanlasla/contact', (req, res) => {
        let conversations = [];
        if (fs.existsSync(conversationsFile)) {
            conversations = JSON.parse(fs.readFileSync(conversationsFile));
        }
        const contacts = [...new Set(conversations.map(c => c.sender))];
        res.json({ contacts });
    });

    app.get('/asjsjljso2ueumdpjoh1u2iashsanlasla/chat', (req, res) => {
        const { num } = req.query;
        if (!num) return res.json({ error: 'Missing number' });
    
        let conversations = [];
        if (fs.existsSync(conversationsFile)) {
            conversations = JSON.parse(fs.readFileSync(conversationsFile));
        }
    
        const history = conversations
            .filter(c => c.sender === num)
            .map(c => ({
                ...c,
                timestamp: new Date(c.timestamp).toLocaleString() // Convert timestamp
            }));
    
        res.json({ history });
    });
    app.get('/asjsjljso2ueumdpjoh1u2iashsanlasla/delete', (req, res) => {
        const { num } = req.query;
        if (!num) {
            res.status(404).json({ error: 'No Number', status: 404 });
        }
        let conversations = [];
        if (fs.existsSync(conversationsFile)) {
            conversations = JSON.parse(fs.readFileSync(conversationsFile));
        }
        conversations = conversations.filter(c => c.sender !== num);
        fs.writeFileSync(conversationsFile, JSON.stringify(conversations, null, 2));
        res.json({ success: true, message: `Chat history for ${num} deleted` });
    });
};
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
startBot();
