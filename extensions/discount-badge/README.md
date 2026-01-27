# Hướng Dẫn Cài Đặt Discount Badge

## ✨ Tổng Quan
App đã tạo **App Block** tự động hiển thị phần trăm giảm giá từ metafield `custom.discount_percentage` trên tất cả product pages.

## 📦 File Đã Tạo
- **`blocks/discount-badge.liquid`**: App block có thể add vào theme (thủ công)
- **`blocks/auto-discount-embed.liquid`**: App embed tự động inject (KHÔNG cần add thủ công)

## 🚀 Triển Khai

### Bước 1: Deploy Theme Extension
```bash
cd d:\theme\my-app
npm run shopify app deploy
```

### Bước 2: Kích Hoạt App Embed (CHỈ 1 LẦN)
1. Sau khi deploy, vào **Shopify Admin**
2. Vào **Online Store > Themes > Customize**
3. Click **App embeds** (góc trái màn hình)
4. Tìm **"Auto Discount Badge"** và bật ON
5. Lưu theme

## ✅ Hoạt Động Như Thế Nào
- App embed sẽ tự động chạy trên **TẤT CẢ** product pages
- Tự động đọc metafield `custom.discount_percentage`
- Nếu có discount > 0, tự động hiển thị badge đỏ với icon 🔥
- Badge xuất hiện **NGAY TRÊN** product title
- **KHÔNG** cần thêm block vào từng product template

## 🎨 Tính Năng
- ✅ Badge đỏ gradient với animation pulse
- ✅ Icon lửa bounce effect
- ✅ Responsive (mobile & desktop)
- ✅ Tự động ẩn khi không có discount
- ✅ Hiển thị số % làm tròn (VD: 15.5% → 16%)

## 🔧 Tùy Chỉnh (Nếu Cần)
Để thay đổi màu sắc hoặc hiệu ứng, chỉnh sửa file:
[`auto-discount-embed.liquid`](d:\\theme\\my-app\\extensions\\discount-badge\\blocks\\auto-discount-embed.liquid)

## ⚠️ Lưu Ý Quan Trọng
- App embed chỉ cần BẬT 1 LẦN trong Theme Customizer
- Metafield phải có định dạng: `custom.discount_percentage` (number_decimal)
- Badge chỉ hiển thị khi discount > 0
- Nếu theme có cấu trúc đặc biệt, có thể cần điều chỉnh selector trong JavaScript

## 🧪 Test
1. Deploy extension
2. Bật app embed trong theme
3. Truy cập product page có discount metafield
4. Badge sẽ tự động hiển thị trên title

---
**Tạo bởi:** Shopify App - Auto Discount Badge  
**Version:** 1.0.0
