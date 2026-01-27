# Tính năng Discount Tự động

## Tổng quan

Tính năng này cho phép tự động tính toán phần trăm discount dựa trên giá bán (price) và giá gốc (compare_at_price) của sản phẩm trên Shopify, sau đó lưu kết quả vào metafield.

## Cách hoạt động

### 1. Cơ chế bật/tắt
- Sử dụng toggle switch trên giao diện để bật/tắt tính năng
- Trạng thái được lưu trong database (bảng `app_settings`)
- Khi bật, hệ thống sẽ tự động tính toán cho TẤT CẢ sản phẩm

### 2. Công thức tính discount
```
Discount % = ((Compare At Price - Price) / Compare At Price) × 100
```

**Ví dụ:**
- Price: 80,000đ
- Compare At Price: 100,000đ
- Discount: ((100,000 - 80,000) / 100,000) × 100 = 20%

### 3. Lưu trữ metafield
- **Namespace**: `custom`
- **Key**: `discount_percentage`
- **Type**: `number_decimal`
- **Access**: `MERCHANT_READ` (chỉ đọc, không cho merchant sửa)

Metafield được tạo tự động khi lần đầu tiên chạy.

## API Endpoints

### 1. Lấy cài đặt
```http
GET /api/settings?shop=myshop.myshopify.com
```

**Response:**
```json
{
  "shop": "myshop.myshopify.com",
  "discountFeatureEnabled": true
}
```

### 2. Cập nhật cài đặt (Bật/Tắt)
```http
POST /api/settings?shop=myshop.myshopify.com
Content-Type: application/json

{
  "discountFeatureEnabled": true
}
```

**Response khi BẬT:**
```json
{
  "success": true,
  "discountFeatureEnabled": true,
  "calculationResult": {
    "updated": 45,
    "skipped": 5,
    "total": 50
  }
}
```

## Cấu trúc Backend

### Entity
```java
@Entity
public class AppSettings {
    private Long id;
    private String shop;
    private Boolean discountFeatureEnabled;
}
```

### Service
```java
@Service
public class ProductService {
    // Tính discount cho tất cả sản phẩm
    public Map<String, Object> calculateAllDiscounts(String shop);
    
    // Tính discount cho 1 sản phẩm (từ webhook)
    public void handleProductUpdate(String shop, String productId, ...);
}
```

### Controller
```java
@RestController
@RequestMapping("/api/settings")
public class SettingsController {
    @GetMapping
    public ResponseEntity<?> getSettings(@RequestParam String shop);
    
    @PostMapping
    public ResponseEntity<?> updateSettings(@RequestParam String shop, @RequestBody Map body);
}
```

## Cấu trúc Frontend

### Component
**File**: `src/pages/DiscountFeaturePage.tsx`

**Features:**
- Toggle switch để bật/tắt
- Hiển thị trạng thái hiện tại
- Nút đồng bộ thủ công
- Hiển thị kết quả tính toán
- Error handling và success messages

### Routing
```typescript
// src/App.tsx
<Route path="/discount-feature" element={<DiscountFeaturePage />} />
```

## Shopify API được sử dụng

### 1. GraphQL - Lấy danh sách sản phẩm (có phân trang)
```graphql
{
  products(first: 50, after: "cursor") {
    pageInfo {
      hasNextPage
      endCursor
    }
    edges {
      node {
        id
        title
        variants(first: 10) {
          edges {
            node {
              price
              compareAtPrice
            }
          }
        }
      }
    }
  }
}
```

### 2. GraphQL - Tạo metafield definition
```graphql
mutation {
  metafieldDefinitionCreate(definition: {
    name: "Discount Percentage"
    namespace: "custom"
    key: "discount_percentage"
    type: "number_decimal"
    description: "Auto-calculated discount percentage"
    access: { admin: MERCHANT_READ }
  }) {
    createdDefinition { id }
    userErrors { message }
  }
}
```

### 3. GraphQL - Cập nhật metafield
```graphql
mutation {
  metafieldsSet(metafields: [{
    ownerId: "gid://shopify/Product/123456"
    namespace: "custom"
    key: "discount_percentage"
    type: "number_decimal"
    value: "20.00"
  }]) {
    metafields { id }
    userErrors { message }
  }
}
```

## Yêu cầu về Shopify Scopes

Cần có các scopes sau trong `application.properties`:
```properties
shopify.scopes=read_products,write_products
```

Hoặc trong Shopify Partner Dashboard:
- `read_products` - Để đọc thông tin sản phẩm
- `write_products` - Để ghi metafield vào sản phẩm

## Flow hoạt động

### Khi BẬT tính năng:
1. User click toggle "Bật"
2. Frontend gọi `POST /api/settings` với `discountFeatureEnabled: true`
3. Backend:
   - Lưu trạng thái vào database
   - Gọi Shopify API để lấy TẤT CẢ sản phẩm (có phân trang)
   - Với mỗi sản phẩm:
     - Lấy price và compareAtPrice từ variant đầu tiên
     - Tính discount percentage
     - Lưu vào metafield
   - Trả về kết quả (số lượng updated/skipped/total)
4. Frontend hiển thị kết quả

### Khi TẮT tính năng:
1. User click toggle "Tắt"
2. Frontend gọi `POST /api/settings` với `discountFeatureEnabled: false`
3. Backend chỉ cập nhật trạng thái, KHÔNG xóa metafield đã tạo
4. Frontend hiển thị thông báo tắt thành công

### Đồng bộ thủ công:
1. User click button "Đồng bộ ngay"
2. Tương tự flow BẬT, nhưng giữ nguyên trạng thái hiện tại

## Testing

### 1. Test toggle on/off
```bash
# Bật tính năng
curl -X POST "http://localhost:8080/api/settings?shop=quickstart-f5f1b2e5.myshopify.com" \
  -H "Content-Type: application/json" \
  -d '{"discountFeatureEnabled": true}'

# Tắt tính năng
curl -X POST "http://localhost:8080/api/settings?shop=quickstart-f5f1b2e5.myshopify.com" \
  -H "Content-Type: application/json" \
  -d '{"discountFeatureEnabled": false}'
```

### 2. Test get settings
```bash
curl "http://localhost:8080/api/settings?shop=quickstart-f5f1b2e5.myshopify.com"
```

## Database Schema

```sql
CREATE TABLE app_settings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    shop VARCHAR(255) NOT NULL UNIQUE,
    discount_feature_enabled BOOLEAN DEFAULT FALSE
);
```

## Lưu ý quan trọng

1. **Performance**: Với shop có nhiều sản phẩm, quá trình tính toán có thể mất vài phút
2. **Rate Limiting**: Shopify có giới hạn API rate (40 requests/second), code đã xử lý pagination
3. **Metafield Access**: Metafield được set là `MERCHANT_READ` để merchant không thể sửa thủ công
4. **Error Handling**: Nếu sản phẩm không có compareAtPrice, discount sẽ là 0.0
5. **Session Management**: Cần có access token hợp lệ trong bảng `shopify_session`

## Future Enhancements

- [ ] Thêm webhook để tự động update khi product thay đổi
- [ ] Thêm filter để chỉ tính cho một số sản phẩm cụ thể
- [ ] Thêm scheduling để tự động chạy định kỳ
- [ ] Thêm logging chi tiết hơn
- [ ] Thêm retry mechanism khi API fail
- [ ] Hiển thị progress bar khi tính toán

## Troubleshooting

### Lỗi: "No session found for shop"
- **Nguyên nhân**: Chưa có access token trong database
- **Giải pháp**: Cần hoàn thành OAuth flow trước

### Lỗi: "Error updating metafield"
- **Nguyên nhân**: Thiếu scope `write_products`
- **Giải pháp**: Thêm scope và reinstall app

### Frontend không gọi được API
- **Nguyên nhân**: CORS hoặc backend chưa chạy
- **Giải pháp**: 
  - Kiểm tra backend đang chạy trên port 8080
  - Kiểm tra CORS configuration trong SecurityConfig

## Kết luận

Tính năng này cung cấp một cách đơn giản và tự động để tính toán discount cho tất cả sản phẩm trên Shopify store. Với toggle đơn giản, merchant có thể bật/tắt tính năng và xem kết quả ngay lập tức.
