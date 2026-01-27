# Shopify App - Spring Boot Backend Migration

## 🎯 Cấu trúc mới

```
my-app/
├── src/                    # React Frontend (SPA)
├── backend/                # Spring Boot Backend (bạn sẽ tạo)
├── nginx.conf             # Nginx config cho production
├── docker-compose.yml     # Docker orchestration
└── ...
```

## ✅ Đã hoàn thành

### Frontend (React SPA)
- ✅ Chuyển đổi từ SSR sang CSR
- ✅ Cấu hình Vite cho SPA thuần
- ✅ Xóa bỏ tất cả dependencies Node.js backend
- ✅ Tạo API service layer để gọi Spring Boot
- ✅ Setup proxy Vite cho development
- ✅ Cấu hình Docker + Nginx cho production

### Backend (Đã loại bỏ Node.js)
- ✅ Đã xóa `@shopify/shopify-app-react-router` 
- ✅ Đã xóa `@prisma/client` và Prisma
- ✅ Đã xóa React Router SSR
- ✅ Đánh dấu các file backend cũ (*.removed)

## 🚀 Cách chạy

### Development
```bash
# Install dependencies
npm install

# Start dev server (port 3000)
npm run dev
```

### Cấu hình môi trường
Tạo file `.env`:
```env
VITE_SHOPIFY_API_KEY=your_shopify_api_key
VITE_SPRING_API_URL=http://localhost:8080
```

## 📦 Cấu trúc Spring Boot cần tạo

### Các chức năng backend cần implement:

#### 1. **Authentication & Session**
```java
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    // OAuth2 flow với Shopify
    // Session management
}
```

#### 2. **Session Management**
```java
@Entity
@Table(name = "sessions")
public class Session {
    @Id
    private String id;
    private String shop;
    private String accessToken;
    // ... các field khác
}

@Repository
public interface SessionRepository extends JpaRepository<Session, String> {
    List<Session> findByShop(String shop);
}
```

#### 3. **Shopify API Integration**
```java
@Service
public class ShopifyApiService {
    private final RestTemplate restTemplate;
    
    // GraphQL Admin API calls
    // REST API calls
}
```

#### 4. **Webhook Handlers**
```java
@RestController
@RequestMapping("/webhooks")
public class WebhookController {
    
    @PostMapping("/app/uninstalled")
    public ResponseEntity<?> handleAppUninstalled(@RequestBody String payload) {
        // Handle app uninstall
    }
    
    @PostMapping("/app/scopes_update")
    public ResponseEntity<?> handleScopesUpdate(@RequestBody String payload) {
        // Handle scopes update
    }
}
```

#### 5. **Spring Boot Dependencies cần thêm**
```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-security</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-oauth2-client</artifactId>
    </dependency>
    <dependency>
        <groupId>org.postgresql</groupId>
        <artifactId>postgresql</artifactId>
    </dependency>
    <!-- Shopify API client (cần tự implement hoặc dùng library) -->
</dependencies>
```

## 🔗 API Endpoints cần implement

Frontend sẽ gọi các endpoints sau từ Spring Boot:

- `GET /api/session` - Get current session
- `GET /api/shop/{shop}` - Get shop data
- `GET /api/products` - List products
- `GET /api/products/{id}` - Get product details
- `POST /webhooks/app/uninstalled` - Webhook handler
- `POST /webhooks/app/scopes_update` - Webhook handler

## 📝 Database Schema (tương đương Prisma)

```sql
CREATE TABLE sessions (
    id VARCHAR(255) PRIMARY KEY,
    shop VARCHAR(255) NOT NULL,
    state VARCHAR(255) NOT NULL,
    is_online BOOLEAN DEFAULT FALSE,
    scope VARCHAR(255),
    expires TIMESTAMP,
    access_token VARCHAR(255) NOT NULL,
    user_id BIGINT,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    email VARCHAR(255),
    account_owner BOOLEAN DEFAULT FALSE,
    locale VARCHAR(50),
    collaborator BOOLEAN DEFAULT FALSE,
    email_verified BOOLEAN DEFAULT FALSE,
    refresh_token VARCHAR(255),
    refresh_token_expires TIMESTAMP
);
```

## 🐳 Docker Commands

```bash
# Build và run với Docker Compose
docker-compose up -d

# Chỉ build frontend
docker build -t shopify-frontend .
```

## 📚 Tài liệu tham khảo

- Shopify API: https://shopify.dev/docs/api
- Shopify OAuth: https://shopify.dev/docs/apps/auth/oauth
- Shopify Webhooks: https://shopify.dev/docs/apps/webhooks

## ⚠️ Lưu ý

1. Frontend đã sẵn sàng, chờ Spring Boot backend
2. Đã cấu hình proxy `/api` → `http://localhost:8080`
3. Cần implement Shopify OAuth flow trong Spring Boot
4. Cần implement webhook signature verification
5. File `shopify.app.toml` vẫn giữ để deploy lên Shopify
