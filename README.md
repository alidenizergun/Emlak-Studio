# EmlakPro AI - AI Emlak Asistanı

Emlak profesyonelleri için geliştirilmiş, yapay zeka destekli fotoğraf düzenleme ve sanal dekorasyon platformu.

## 🚀 Projeyi Çalıştırma

Bu projeyi bilgisayarınızda çalıştırmak için aşağıdaki adımları izleyin:

### 1. Gereksinimler
- [Node.js](https://nodejs.org/) (Sürüm 22 veya üzeri gereklidir)

### 2. Kurulum
Terminali açın ve proje klasörüne gidin:

```bash
cd Emlak-Studio
```

Gerekli paketleri yükleyin:

```bash
npm install
```

### 3. Uygulamayı Başlatma
Geliştirme sunucusunu başlatın:

```bash
npm run dev
```

Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresine giderek uygulamayı görüntüleyebilirsiniz.

### 4. Admin Paneli
Manuel kredi ve paket yönetimi için admin paneli `/dashboard/admin` altında çalışır.

Production ortamı için admin erişimini mutlaka `ADMIN_EMAILS` ile sınırlandırın:

```bash
ADMIN_EMAILS=yonetici@ornek.com,digeradmin@ornek.com
```

Not:
- Development ortamında `ADMIN_EMAILS` tanımlı değilse oturum açmış kullanıcı admin panelini test edebilir.
- Production ortamında `ADMIN_EMAILS` tanımlamanız önerilir.


## 📱 Capacitor iOS Shell

Bu repo, iOS native kabuğu için Capacitor yapılandırmasını içerir.

### Gerekli komutlar

```bash
npm run cap:sync
npm run cap:open:ios
```

Gerektiğinde native kabuğu sifirdan yeniden uretmek icin:

```bash
npm run cap:add:ios
```

### Sunucu URL davranışı

`capacitor.config.ts`, varsayılan olarak `https://emlak-studio.vercel.app` adresini native WebView içinde açar.
Gerekirse ortam bazında aşağıdaki değişkenle override edin:

```bash
CAPACITOR_SERVER_URL=https://your-env.example.com
```

`NEXT_PUBLIC_SITE_URL` tanimliysa Capacitor onu da fallback olarak kullanir. `ios/` altinda commit edilen baseline Xcode projesi bulunur. `capacitor-shell/` ise hosted WebView kurulumu ve hata fallback'i icin gerekli minimal local bundle'i saglar.

## ✨ Özellikler

- **AI Fotoğraf Geliştirme:** Düşük çözünürlüklü fotoğrafları 4K kaliteye yükseltin.
- **Sanal Dekorasyon (Virtual Staging):** Boş odaları yapay zeka ile mobilyalandırın.
- **Örnekler Galerisi:** Öncesi/Sonrası karşılaştırmalı interaktif galeri.
- **Dinamik Araç Sayfaları:** 20+ farklı AI aracı için özel sayfalar.
- **Premium Tasarım:** Emlak sektörüne uygun, modern ve güven veren arayüz.

## 🛠️ Teknolojiler

- **Framework:** Next.js 15+ (App Router)
- **Dil:** TypeScript
- **Stil:** CSS Modules (Premium Light Theme)
- **İkonlar:** Lucide React

## 📂 Proje Yapısı

- `/app`: Sayfalar ve yönlendirmeler
- `/components`: Tekrar kullanılabilir UI bileşenleri
- `/public`: Görseller ve statik dosyalar
- `/styles`: Global stiller

---
Geliştirici: [Ali Deniz Ergun]
