# SDK QRIS Bank Nagari

Service HTTP kecil (Express) untuk pembayaran parkir via **QRIS Bank Nagari**:

- Generate QR dinamis ke API Agregator Bank Nagari (`QR03`).
- Cek status pembayaran (`QR04`) dan simpan riwayat di `transaction.json`.
- Opsional: cetak tiket berisi QR langsung ke **printer thermal LAN** (ESC/POS, port 9100).

Service berjalan di port **5000**.

---

## 1. Kebutuhan Sistem

| Komponen | Minimal | Disarankan | Sudah diuji |
|---|---|---|---|
| Node.js | **18.x** (syarat Express 5) | 22 LTS / 24 LTS | 22.23.1, 26.12.1 |
| npm | **9.x** (bawaan Node 18) | 10.x ke atas | 11.20.0 |
| PM2 | 5.x | terbaru | 7.0.3 |

> `package.json` mencantumkan `"engines": { "node": ">=18" }`.

Cek versi:

```bash
node -v
npm -v
pm2 -v
```

Jaringan:

- Server harus bisa mengakses `api.banknagari.co.id:6969`.
- Jika memakai printer, server harus bisa mengakses `IP_PRINTER:9100`.

---

## 2. Struktur Folder

```
SDK-QRIS-BANK-NAGARI/
├── index.js                 # server Express + API QR & status
├── printer-lan-thermal.js   # render struk (PNG) + kirim ke printer thermal LAN
├── fonts/                   # NotoSans Regular & Bold (dipakai untuk struk)
├── build.js                 # obfuscate kode → folder dist/
├── transaction.json         # data transaksi (dibuat otomatis)
└── dist/                    # hasil build, ini yang di-deploy
    ├── index.js
    ├── printer-lan-thermal.js
    ├── fonts/
    ├── package.json         # hanya dependency produksi
    ├── ecosystem.config.js  # konfigurasi PM2
    └── README.md
```

---

## 3. Instalasi & Menjalankan (Development)

```bash
npm install
npm start
# RUNNING http://localhost:5000
```

---

## 4. Build (Enkripsi / Obfuscate)

```bash
npm run build
```

Hasilnya di folder `dist/`: kode `.js` di-obfuscate, `fonts/`, `package.json` produksi,
`ecosystem.config.js` dan `README.md` ikut disalin.
`dist/.git`, `dist/node_modules` dan `dist/transaction.json` **tidak** dihapus saat build ulang.

---

## 5. Deploy dengan PM2

### 5.1 Install PM2 (sekali saja)

```bash
npm install -g pm2
```

### 5.2 Jalankan aplikasi

Cara cepat (satu perintah, aman diulang setiap update):

```bash
cd dist
npm run deploy
```

`npm run deploy` = `npm install --omit=dev` → `pm2 startOrRestart ecosystem.config.js` → `pm2 save`.
Jika belum terdaftar di PM2 akan di-start, jika sudah ada akan di-restart.

Cara manual:

```bash
cd dist
npm install --omit=dev
pm2 start ecosystem.config.js
```

Atau lewat npm script (dari dalam `dist/`):

```bash
npm run pm2:start
```

Tanpa file ecosystem (alternatif):

```bash
pm2 start index.js --name bank-nagari-qris --max-memory-restart 300M --time
```

### 5.3 Auto start saat server reboot

```bash
pm2 startup        # jalankan perintah sudo yang ditampilkan
pm2 save           # simpan daftar proses yang sedang jalan
```

Windows: `startup` tidak didukung, pakai paket `pm2-windows-startup`:

```bash
npm install -g pm2-windows-startup
pm2-startup install
pm2 save
```

### 5.4 Perintah PM2 sehari-hari

| Keperluan | Perintah | npm script |
|---|---|---|
| Lihat daftar proses | `pm2 list` | |
| Lihat log realtime | `pm2 logs bank-nagari-qris` | `npm run pm2:logs` |
| Restart | `pm2 restart bank-nagari-qris` | `npm run pm2:restart` |
| Stop | `pm2 stop bank-nagari-qris` | `npm run pm2:stop` |
| Hapus dari PM2 | `pm2 delete bank-nagari-qris` | |
| Monitor CPU/RAM | `pm2 monit` | |
| Detail proses | `pm2 show bank-nagari-qris` | |
| Kosongkan log | `pm2 flush bank-nagari-qris` | |

### 5.5 Update versi

```bash
# di folder sumber
npm run build

# di server (folder dist)
npm run deploy
```

### 5.6 Konfigurasi PM2 (`ecosystem.config.js`)

```js
module.exports = {
  apps: [
    {
      name: "bank-nagari-qris",
      script: "index.js",
      instances: 1,          // WAJIB 1: transaction.json ditulis oleh satu proses
      exec_mode: "fork",
      autorestart: true,
      watch: false,          // jangan watch: transaction.json berubah tiap transaksi
      max_memory_restart: "300M",
      time: true,            // prefix waktu di log
      env: { NODE_ENV: "production" },
    },
  ],
};
```

> Jangan jalankan mode `cluster` / `instances > 1`, karena data transaksi disimpan di file
> dan bisa saling menimpa.

---

## 6. API

Base URL: `http://<IP_SERVER>:5000`

### 6.1 Generate QR — `GET /api/qr`

| Parameter | Wajib | Keterangan |
|---|---|---|
| `amount` | ya | Nominal (rupiah, bilangan bulat > 0) |
| `ip-printer` | tidak | IP printer thermal LAN. Jika diisi, tiket QR langsung dicetak |

Contoh:

```bash
curl "http://localhost:5000/api/qr?amount=4000"
curl "http://localhost:5000/api/qr?amount=4000&ip-printer=192.168.1.50"
```

Respon sukses:

```json
{
  "status": true,
  "billing_number": "1792551852023",
  "amount": 4000,
  "printed": false,
  "qr_base64": "iVBORw0KGgoAAA..."
}
```

`qr_base64` adalah gambar PNG, bisa ditampilkan dengan
`<img src="data:image/png;base64,{qr_base64}">`.

Respon gagal:

| HTTP | Isi |
|---|---|
| 400 | `{ "status": false, "message": "amount tidak valid" }` |
| 502 | `{ "status": false, "message": "Gagal generate QR", "bank_response": {...} }` |
| 500 | `{ "status": false, "message": "<pesan error>" }` |

### 6.2 Cek Status — `GET /api/status`

| Parameter | Wajib | Keterangan |
|---|---|---|
| `billing_number` | tidak | Nomor billing dari `/api/qr`. Jika kosong, dicek transaksi **PENDING terakhir** |

```bash
curl "http://localhost:5000/api/status?billing_number=1792551852023"
curl "http://localhost:5000/api/status"
```

Respon:

```json
{ "status": true, "paid": true, "bank_response": { "rc": "00", "...": "..." } }
```

| Kondisi | HTTP | `status` | `paid` |
|---|---|---|---|
| Sudah dibayar (`rc = "00"`) | 200 | true | true |
| Belum dibayar | 200 | true | false |
| Billing tidak ditemukan | 404 | false | false |
| Error koneksi ke bank | 500 | false | false |

Transaksi yang sudah `PAID` tidak dicek ulang ke bank (langsung dijawab dari `transaction.json`).
Lakukan polling endpoint ini (mis. tiap 2–3 detik) sampai `paid: true`.

---

## 7. Data Transaksi (`transaction.json`)

Dibuat otomatis di folder yang sama dengan `index.js` saat QR pertama dibuat.

```json
{
  "1792551852023": {
    "outlet_id": "308150022",
    "billing_number": "1792551852023",
    "amount": 4000,
    "status": "PENDING",
    "created_at": "21/10/2026, 10.04.12",
    "paid_at": null
  }
}
```

Status: `PENDING` → `PAID` (field `bank` berisi respon bank saat lunas).
Backup file ini secara berkala; file ini tidak ikut di-commit (`.gitignore`).

---

## 8. Printer Thermal LAN

- Koneksi: `tcp://<ip-printer>:9100`, tipe EPSON (ESC/POS), timeout 3 detik.
- Lebar kertas default **80 mm** (`LEBAR_KERTAS = 512`). Untuk kertas **58 mm** ubah ke `384`
  di `printer-lan-thermal.js`, lalu build ulang.
- Jika printer gagal, QR tetap dikembalikan dengan `"printed": false`.

---

## 9. Konfigurasi

Konfigurasi bank (URL API, institution ID, server key, outlet ID, nama perusahaan) ada di bagian
`CONFIG` pada `index.js` (sumber, sebelum build). Setelah diubah, jalankan `npm run build` lalu
restart PM2. Port server (`5000`) ada di baris `app.listen` pada `index.js`.

---

## 10. Troubleshooting

| Masalah | Solusi |
|---|---|
| `EADDRINUSE :::5000` | Port dipakai proses lain: `pm2 list`, `lsof -i :5000` (Linux) / `netstat -ano \| findstr 5000` (Windows) |
| `npm WARN EBADENGINE` | Versi Node di bawah 18, upgrade ke Node 22 LTS |
| `Gagal generate QR` (502) | Cek `bank_response`: signature/outlet/timestamp salah, atau IP server belum di-whitelist bank |
| Timeout ke bank | Cek koneksi ke `api.banknagari.co.id:6969` dan jam server (timestamp dipakai di signature) |
| `printed: false` | Cek IP printer, `ping`, dan port 9100 terbuka |
| Aplikasi tidak jalan setelah reboot | Jalankan `pm2 startup` lalu `pm2 save` |
| Struk terpotong / terlalu lebar | Sesuaikan `LEBAR_KERTAS` (80 mm = 512, 58 mm = 384) |
