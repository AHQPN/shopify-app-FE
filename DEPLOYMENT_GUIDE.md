# 🚀 Hướng dẫn chạy Shopify App với Spring Boot Backend

## ✅ Đã hoàn thành

### 1. Spring Boot Backend (Port 8080)
- ✅ OAuth authentication endpoints
- ✅ Session management với JPA
- ✅ Webhook handlers
- ✅ CORS configuration
- ✅ H2 database (development)
- ✅ Security configuration

### 2. React Frontend (Port 3000/3001)
- ✅ Shopify Polaris UI
- ✅ Client-side routing
- ✅ API integration với Spring Boot
- ✅ Proxy configuration

## 🔧 Để chạy LOCAL (đã test xong):

### Terminal 1: Spring Boot Backend
```bash
cd D:\Spring\custom-shopify
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
.\mvnw.cmd spring-boot:run
```
Backend chạy tại: http://localhost:8080

### Terminal 2: React Frontend
```bash
cd D:\theme\my-app
npm run dev
```
Frontend chạy tại: http://localhost:3001

### Test kết nối:
```bash
curl http://localhost:8080/api/health
```

## 🌐 Để chạy trên SHOPIFY (embedded app):

### Bước 1: Cấu hình Spring Boot cho production
Sửa `D:\Spring\custom-shopify\src\main\resources\application.properties`:
```properties
# Thêm cấu hình cho tunnel
server.forward-headers-strategy=framework
```

### Bước 2: Chạy Shopify CLI với tunnel
```bash
cd D:\theme\my-app
npx shopify app dev
```

Shopify CLI sẽ:
1. Tạo tunnel (cloudflare) cho cả frontend VÀ backend
2. Cập nhật app URLs trong Shopify Partners
3. Mở Shopify Admin với app embedded

### Bước 3: Cấu hình .env
Tạo `.env` trong `D:\theme\my-app`:
```env
VITE_SHOPIFY_API_KEY=73b514cf8dc1297f305e160896482857
VITE_SPRING_API_URL=https://your-tunnel-url.trycloudflare.com
```

Và `.env` trong `D:\Spring\custom-shopify`:
```properties
SHOPIFY_API_KEY=73b514cf8dc1297f305e160896482857
SHOPIFY_API_SECRET=your_actual_secret_from_partners
SHOPIFY_APP_URL=https://your-tunnel-url.trycloudflare.com
```

### Bước 4: Chạy cả 2 services
```bash
# Terminal 1: Spring Boot
cd D:\Spring\custom-shopify
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
.\mvnw.cmd spring-boot:run

# Terminal 2: Shopify App Dev
cd D:\theme\my-app
npx shopify app dev
```

## 📝 OAuth Flow trên Shopify:

1. Merchant truy cập: `https://admin.shopify.com/store/{store}/apps/my-app`
2. Shopify redirect tới: `https://tunnel-url.com/api/auth?shop=store.myshopify.com`
3. Spring Boot redirect merchant tới Shopify OAuth: `https://store.myshopify.com/admin/oauth/authorize`
4. Merchant approve permissions
5. Shopify callback tới: `https://tunnel-url.com/api/auth/callback?code=xxx&hmac=xxx`
6. Spring Boot exchange code for access token
7. Save session vào database
8. Redirect tới frontend: `https://tunnel-url.com/?shop=store.myshopify.com`

## 🔍 Endpoints quan trọng:

### Spring Boot (Backend):
- `GET /api/health` - Health check
- `GET /api/auth?shop=xxx` - Initiate OAuth
- `GET /api/auth/callback` - OAuth callback
- `POST /webhooks/app/uninstalled` - App uninstall webhook
- `POST /webhooks/app/scopes_update` - Scopes update webhook

### React (Frontend):
- `/` - Home page
- `/additional` - Additional page

## ⚠️ Lưu ý quan trọng:

1. **API Secret**: Cần lấy từ Shopify Partners dashboard
2. **Tunnel URL**: Shopify CLI tự tạo, cần update vào .env
3. **Webhooks**: Cần register sau khi install app lần đầu
4. **Database**: Đang dùng H2 in-memory, cần chuyển sang PostgreSQL cho production

## 🐛 Troubleshooting:

### Frontend không connect được backend:
- Check CORS settings trong Spring Boot
- Check proxy trong vite.config.ts
- Verify backend đang chạy: `curl http://localhost:8080/api/health`

### OAuth không hoạt động:
- Check SHOPIFY_API_SECRET đúng chưa
- Verify HMAC validation logic
- Check redirect URLs trong Shopify Partners

### Webhooks không nhận:
- Verify webhook signature verification
- Check URL trong shopify.app.toml
- Test với Shopify webhook test tool

## 📚 Tài liệu tham khảo:

- Shopify OAuth: https://shopify.dev/docs/apps/auth/oauth
- Shopify Webhooks: https://shopify.dev/docs/apps/webhooks
- Shopify CLI: https://shopify.dev/docs/apps/tools/cli
- Spring Boot: https://spring.io/projects/spring-boot
