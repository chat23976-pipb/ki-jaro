const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

// Konfigurasi SMTP untuk Notifikasi Email Otomatis
const mailTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 465),
    secure: Number(process.env.SMTP_PORT || 465) === 465,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

const db = mysql.createPool({
    host: process.env.DB_HOST || 'db_mysql',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password_root_aman',
    database: process.env.DB_NAME || 'db_kijaro',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

db.getConnection((err, connection) => {
    if (err) {
        console.error('Gagal koneksi ke MySQL:', err.message);
    } else {
        console.log('Berhasil terhubung ke database MySQL.');
        connection.query(`
            CREATE TABLE IF NOT EXISTS app_state (
                id INT AUTO_INCREMENT PRIMARY KEY,
                data_key VARCHAR(255) UNIQUE,
                data_value LONGTEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `, (createErr) => {
            if (createErr) console.error('Gagal buat tabel:', createErr.message);
        });
        connection.release();
    }
});

app.post('/api/save-state', (req, res) => {
    const { key, value } = req.body;
    if (!key) return res.status(400).json({ success: false, message: 'Key diperlukan' });

    const query = `REPLACE INTO app_state (data_key, data_value) VALUES (?, ?)`;
    db.query(query, [key, JSON.stringify(value)], (err, result) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true, message: 'Data tersimpan.' });
    });
});

app.get('/api/load-state/:key', (req, res) => {
    const key = req.params.key;
    const query = `SELECT data_value FROM app_state WHERE data_key = ?`;
    db.query(query, [key], (err, results) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        if (results.length === 0) return res.json({ success: true, data: null });
        try {
            res.json({ success: true, data: JSON.parse(results[0].data_value) });
        } catch (e) {
            res.json({ success: true, data: results[0].data_value });
        }
    });
});

app.post('/api/send-email', async (req, res) => {
    try {
        const { to, subject, html } = req.body;
        if (!to || (Array.isArray(to) && to.length === 0)) {
            return res.status(400).json({ success: false, message: 'Alamat email tujuan kosong.' });
        }
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            return res.status(500).json({ success: false, message: 'SMTP_USER / SMTP_PASS belum diatur di Environment Dokploy.' });
        }

        const recipients = Array.isArray(to)
            ? Array.from(new Set(to.map(e => String(e).trim()).filter(e => e.includes('@'))))
            : String(to).trim();

        const info = await mailTransporter.sendMail({
            from: `"Ki-Jaro Poltek Petrokimia Banten" <${process.env.SMTP_USER}>`,
            to: Array.isArray(recipients) ? recipients.join(', ') : recipients,
            subject: subject || 'Notifikasi Sistem Ki-Jaro',
            html: html || ''
        });

        console.log('Email terkirim ke:', recipients, 'ID:', info.messageId);
        res.json({ success: true, messageId: info.messageId });
    } catch (err) {
        console.error('Gagal kirim email:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server Ki-Jaro aktif di port ${PORT}`);
});
