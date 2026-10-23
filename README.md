# SDK QRIS Bank Nagari

Membuat QR pembayaran parkir (QRIS Bank Nagari) untuk Hybrid Parking, mengecek status pembayarannya, dan mencetak tiket QR ke printer thermal LAN.

## Kebutuhan

- **Wajib Node.js 22.** Versi lain ditolak (`npm install` gagal dan SDK tidak mau jalan). Cek dengan `node -v`.
- Server bisa mengakses `api.banknagari.co.id:6969`.

Pasang Node 22 lewat nvm (sekali saja):

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
source ~/.bashrc
nvm install 22
nvm alias default 22
```

PM2 mencari Node 22 sendiri (nvm, fnm, n, atau node sistem), jadi tetap jalan walaupun node bawaan bukan v22. Bila Node 22 ada di lokasi lain, isi `QRIS_NODE` dengan path-nya.

## Pasang

Letakkan folder SDK ini sejajar dengan folder DASHBOARD:

```
HYBRID-PARKING/
├── DASHBOARD/
└── SDK-QRIS-BANK-NAGARI/    ← folder ini
```

```bash
git clone git@github.com:hamdan-hybrid/SDK-QRIS-BANK-NAGARI.git
cd SDK-QRIS-BANK-NAGARI
nvm use 22
npm install --omit=dev
node index.js              # RUNNING http://localhost:5000 (Ctrl+C = berhenti)
```

Lalu di DASHBOARD → menu **Perusahaan**, isi **Link SDK QRIS** dengan `http://localhost:5000` dan klik **Test**.

## Jalan di latar belakang dengan PM2

Agar otomatis hidup lagi bila berhenti atau server restart.

```bash
# 1. Pasang PM2 (sekali saja)
npm install -g pm2

# 2. Pasang dependency + daftarkan ke PM2 + simpan
cd SDK-QRIS-BANK-NAGARI
nvm use 22
npm run deploy

# 3. Cek berjalan & lihat log
pm2 status
pm2 logs bank-nagari-qris

# 4. Agar ikut hidup saat server restart (sekali saja)
pm2 startup          # jalankan perintah sudo yang ditampilkan, lalu pm2 save
```

## Update

```bash
cd SDK-QRIS-BANK-NAGARI
git pull
nvm use 22
npm run deploy
```
