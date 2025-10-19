<div align="center">
  <img src="https://img.shields.io/badge/Status-Active-success?style=for-the-badge&logo=github" alt="Status">
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Google_Maps-4285F4?style=for-the-badge&logo=google-maps&logoColor=white" alt="Google Maps">
  <img src="https://img.shields.io/badge/Gemini_AI-8E75B2?style=for-the-badge&logo=google&logoColor=white" alt="Gemini AI">
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" alt="License">
</div>

<div align="center">
  <h1>🗺️ Penjelajah Peta Interaktif</h1>
  <p><strong>Aplikasi pemetaan cerdas dengan AI yang membantu Anda menjelajahi tempat-tempat menarik dan membuat rencana perjalanan harian</strong></p>
</div>

<div align="center">
  <img src="https://via.placeholder.com/800x400/4A90E2/FFFFFF?text=Interactive+Map+Explorer+Demo" alt="Demo Screenshot" width="100%">
</div>

---

## ✨ Fitur Utama

### 🧠 **Kecerdasan Buatan (AI)**
- **Gemini AI Integration**: Menggunakan Google Gemini untuk menghasilkan konten lokasi yang informatif
- **Pemrosesan Bahasa Natural**: Jelaskan tempat dengan bahasa sehari-hari
- **Konteks Lokasi**: Memahami konteks budaya, sejarah, dan geografis

### 🗺️ **Mode Penjelajahan**
- **Mode Umum**: Jelajahi tempat-tempat menarik berdasarkan minat Anda
- **Mode Perencana Harian**: Buat itinerary perjalanan lengkap dengan jadwal waktu
- **Visualisasi Interaktif**: Marker dan rute yang menarik di peta

### 📅 **Fitur Perencana Harian**
- **Jadwal Terstruktur**: Waktu kunjungan dan durasi yang realistis
- **Rute Perjalanan**: Saran transportasi antar lokasi
- **Timeline Visual**: Lihat rencana harian dalam format timeline
- **Export Plan**: Simpan rencana dalam format teks

### 🎨 **Interface Modern**
- **Responsive Design**: Sempurna di desktop dan mobile
- **Tutorial Interaktif**: Panduan langkah demi langkah untuk pengguna baru
- **Loading States**: Indikator loading yang smooth
- **Error Handling**: Penanganan error yang user-friendly

---

## 🚀 Teknologi Stack

<div align="center">

| **Frontend** | **AI & Maps** | **Build Tools** | **Language** |
|:------------:|:-------------:|:---------------:|:------------:|
| <img src="https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white" alt="HTML5"> | <img src="https://img.shields.io/badge/Google_Maps-4285F4?style=flat&logo=google-maps&logoColor=white" alt="Google Maps"> | <img src="https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white" alt="Vite"> | <img src="https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white" alt="TypeScript"> |
| <img src="https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white" alt="CSS3"> | <img src="https://img.shields.io/badge/Gemini_AI-8E75B2?style=flat&logo=google&logoColor=white" alt="Gemini AI"> | <img src="https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white" alt="Node.js"> | <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black" alt="JavaScript"> |

</div>

---

## 📋 Prerequisites

Sebelum menjalankan aplikasi ini, pastikan Anda memiliki:

- **Node.js** (versi 16 atau lebih tinggi)
- **npm** atau **yarn** package manager
- **Google Cloud Console account** untuk API keys

---

## 🛠️ Instalasi & Setup

### 1. **Clone Repository**
```bash
git clone https://github.com/bimadevs/perencana-peta.git
cd perencana-peta
```

### 2. **Install Dependencies**
```bash
npm install
```

### 3. **Setup Environment Variables**

Buat file `.env.local` di root directory:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. **Setup Google Maps API**

#### **Langkah 1: Buat Google Cloud Project**
1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Buat project baru atau pilih project existing
3. Aktifkan **Maps JavaScript API**

#### **Langkah 2: Buat API Key**
1. Pergi ke **APIs & Services** > **Credentials**
2. Klik **Create Credentials** > **API Key**
3. Copy API key yang dihasilkan

#### **Langkah 3: Konfigurasi API Key**
1. Klik API key yang baru dibuat
2. Pergi ke **Application restrictions**
3. Pilih **HTTP referrers (web sites)**
4. Tambahkan referrers berikut:
   ```
   http://localhost:3000/
   https://your-domain.com/ (jika deploy)
   ```

#### **Langkah 4: Update HTML**
Edit file `index.html` dan ganti API key pada baris:
```html
key: "YOUR_GOOGLE_MAPS_API_KEY_HERE"
```

### 5. **Jalankan Aplikasi**
```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:3000`

---

## 📖 Cara Penggunaan

### **Mode Penjelajahan Umum**
1. Ketik tempat yang ingin dijelajahi di search bar
2. Contoh: *"tempat wisata di Bali"* atau *"kuliner khas Jogja"*
3. Klik tombol generate atau tekan Enter
4. Lihat hasil di peta dengan marker dan informasi

### **Mode Perencana Harian**
1. Aktifkan toggle **"Mode Perencana Harian"**
2. Ketik destinasi dan aktivitas yang diinginkan
3. Contoh: *"rencana sehari di Jakarta"* atau *"jadwal wisata Bandung"*
4. Klik tombol timeline untuk melihat rencana detail
5. Export rencana jika diperlukan

### **Tips Penggunaan**
- Gunakan bahasa Indonesia atau English
- Semakin spesifik pertanyaan, semakin akurat hasilnya
- Mode perencana akan memberikan jadwal dari pagi hingga malam
- Klik marker di peta untuk informasi detail

---

## 🔧 Troubleshooting

### **Error: RefererNotAllowedMapError**
**Penyebab**: Domain tidak diizinkan menggunakan Google Maps API key

**Solusi**:
1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Pergi ke **APIs & Services** > **Credentials**
3. Edit API key yang digunakan
4. Tambahkan `http://localhost:3000/` ke **Application restrictions**

### **Error: ERR_BLOCKED_BY_CLIENT**
**Penyebab**: Browser extension memblokir Google Maps requests

**Solusi**:
1. Nonaktifkan sementara ad blocker atau privacy extension
2. Gunakan incognito/private browsing mode
3. Tambahkan CSP meta tag jika diperlukan

### **Error: GEMINI_API_KEY tidak ditemukan**
**Solusi**:
1. Pastikan file `.env.local` ada di root directory
2. Pastikan `GEMINI_API_KEY` sudah di-set dengan benar
3. Restart development server setelah update environment variables

### **Map tidak muncul**
**Solusi**:
1. Check console untuk error message
2. Pastikan Google Maps API key valid dan tidak expired
3. Pastikan domain sudah ditambahkan ke allowed referrers

---

## 📁 Struktur Project

```
penjelajah-peta/
├── public/
│   ├── index.html          # Main HTML file dengan Google Maps integration
│   └── index.css           # Styling untuk UI components
├── src/
│   └── index.tsx           # Main TypeScript/React component
├── .env.local              # Environment variables (tidak di-commit)
├── package.json            # Dependencies dan scripts
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite bundler configuration
└── README.md               # Dokumentasi project
```

---

## 🤝 Contributing

Kontribusi sangat diterima! Berikut cara berkontribusi:

1. **Fork** repository ini
2. Buat **feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit** perubahan: `git commit -m 'Add amazing feature'`
4. **Push** branch: `git push origin feature/amazing-feature`
5. Buat **Pull Request**

### **Guidelines**
- Ikuti coding style yang sudah ada
- Tulis test untuk fitur baru
- Update dokumentasi jika diperlukan
- Pastikan semua test lulus

---

## 📄 License

Project ini menggunakan license **MIT**. Lihat file [LICENSE](LICENSE) untuk detail lebih lanjut.

---

## 🙏 Acknowledgments

- **Google Maps Platform** untuk API pemetaan yang powerful
- **Google Gemini AI** untuk kemampuan AI yang canggih
- **Vite** untuk build tool yang cepat dan modern
- **TypeScript** untuk type safety dan developer experience yang excellent

---

## 📞 Support & Contact

Jika Anda menemukan bug atau memiliki pertanyaan:

- **Buat Issue**: [GitHub Issues](https://github.com/bimadevs/perencana-peta/issues)
- **Email**: bimaj0206@gmail.com
---

<div align="center">
  <p><strong>Dibuat dengan ❤️ untuk para penjelajah dunia</strong></p>
  <p>
    <img src="https://img.shields.io/github/stars/username/penjelajah-peta?style=social" alt="GitHub Stars">
    <img src="https://img.shields.io/github/forks/username/penjelajah-peta?style=social" alt="GitHub Forks">
  </p>
</div>
