# Terraviva E-Commerce Web Application

Modern ve güvenli bir e-ticaret platformu. Next.js 15, Auth.js ve Prisma kullanılarak geliştirilmiştir.

## 🚀 Özellikler

- **Modern Stack**: Next.js 15, React 19, TypeScript
- **Güvenli Kimlik Doğrulama**: Auth.js ile RBAC (Role-Based Access Control)
- **Veritabanı**: PostgreSQL + Prisma ORM
- **Dosya Yönetimi**: MinIO object storage
- **UI Framework**: Mantine + Tailwind CSS
- **Form Yönetimi**: React Hook Form + Zod validation

## 👥 Roller ve Yetkiler

Sistem 3 farklı kullanıcı rolü ile çalışır:

- **OWNER** - Tam yetki (sistem sahibi)
- **ADMIN** - Yönetici yetkiler
- **USER** - Normal kullanıcı

## 🛡️ Güvenlik

- `/admin` path'i altındaki tüm sayfalar korumalıdır
- Sadece OWNER ve ADMIN rolleri admin dashboard'una erişebilir
- RBAC sistemi ile detaylı yetkilendirme

## 🛠️ Teknolojiler

### Frontend

- **Next.js 15** - React framework
- **React 19** - UI library
- **TypeScript** - Type safety
- **Mantine** - Component library
- **Tailwind CSS** - Styling

### Backend

- **Auth.js** - Authentication
- **Prisma** - Database ORM
- **PostgreSQL** - Database
- **MinIO** - Object storage
- **Zod** - Schema validation

## 📦 Kurulum

1. **Bağımlılıkları yükleyin:**

   ```bash
   npm install
   ```

2. **Ortam değişkenlerini ayarlayın:**

   ```bash
   cp .env.example .env.local
   ```

3. **Gerekli environment variables:**

   ```env
   DATABASE_URL=
   AUTH_SECRET=
   MINIO_ENDPOINT=
   MINIO_SECRET_KEY=
   MINIO_ACCESS_KEY=
   ```

4. **Veritabanını hazırlayın:**

   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Uygulamayı başlatın:**
   ```bash
   npm run dev
   ```

## 🚪 Erişim

- **Ana Sayfa**: `http://localhost:3000`
- **Admin Dashboard**: `http://localhost:3000/admin` (Yetki gerekli)

## 📁 Proje Yapısı

```
├── app/
│   ├── (admin)/admin/        # Admin dashboard
│   ├── (auth)/              # Authentication pages
│   ├── api/                 # API routes
│   └── ...
├── actions/                 # Server actions
├── lib/                     # Utilities
├── schemas/                 # Validation schemas
└── types/                   # TypeScript types
```

## 🎯 Admin Dashboard

Admin dashboard'u şu modülleri içerir:

- **Ürün Yönetimi** - Kategori ve ürün işlemleri
- **Kullanıcı Yönetimi** - Rol ve yetki kontrolü
- **Dosya Yönetimi** - Resim/video upload
- **Dashboard** - Genel sistem özeti

## 🔧 Geliştirme

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Linting
npm run lint
```

## 📝 Not

Bu proje aktif geliştirme aşamasındadır. Yeni özellikler ve iyileştirmeler sürekli eklenmektedir.
