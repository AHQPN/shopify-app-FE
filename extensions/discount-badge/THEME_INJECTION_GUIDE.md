# Hướng Dẫn Inject Discount Badge Vào Theme

## 🎯 Mục Tiêu
Badge tự động xuất hiện trên **MỌI NƠI** có product mà không cần add block thủ công.

---

## 📝 BƯỚC 1: Inject vào Product Detail Page

### 1.1. Tìm file template product
Vào **Theme Editor** → **Sections** → tìm file:
- `main-product.liquid` HOẶC
- `product-template.liquid` HOẶC  
- `product.liquid`

### 1.2. Thêm code vào NGAY SAU thẻ mở của product title

Tìm dòng có **product title**, thường là:
```liquid
<h1 class="product__title">{{ product.title }}</h1>
```

Thêm **TRƯỚC** dòng đó:
```liquid
{% render 'discount-badge', product: product %}
```

**Ví dụ đầy đủ:**
```liquid
{%- comment -%} Discount Badge - Auto Inject {%- endcomment -%}
{% render 'discount-badge', product: product %}

<h1 class="product__title">
  {{ product.title }}
</h1>
```

---

## 📝 BƯỚC 2: Inject vào Product Cards (Collection/Grid)

### 2.1. Tìm file card template
Vào **Snippets** → tìm file:
- `card-product.liquid` HOẶC
- `product-card.liquid` HOẶC
- `product-grid-item.liquid`

### 2.2. Thêm code vào NGAY SAU hoặc TRƯỚC product title

Tìm phần title của card, thường là:
```liquid
<h3 class="card__heading">
  <a href="{{ card_product.url }}">
    {{ card_product.title }}
  </a>
</h3>
```

Thêm **TRƯỚC** dòng đó:
```liquid
{% render 'discount-badge', product: card_product, inline: true %}
```

**Ví dụ đầy đủ:**
```liquid
{%- comment -%} Discount Badge - Auto Inject {%- endcomment -%}
{% render 'discount-badge', product: card_product, inline: true %}

<h3 class="card__heading">
  <a href="{{ card_product.url }}">
    {{ card_product.title }}
  </a>
</h3>
```

**LƯU Ý:** Tên biến có thể là:
- `card_product` (Dawn theme)
- `product` (các theme khác)
- `item` (một số theme)

Dùng tên biến nào có trong file đó.

---

## 📝 BƯỚC 3: Inject vào Featured Products (Homepage)

### 3.1. Tìm section featured products
Vào **Sections** → tìm:
- `featured-collection.liquid` HOẶC
- `featured-products.liquid`

### 3.2. Tìm phần render product card

Thường có dạng:
```liquid
{% render 'card-product',
  card_product: product,
  ...
%}
```

**KHÔNG CẦN** sửa gì ở đây vì đã inject vào `card-product.liquid` ở Bước 2 rồi.

---

## 📝 BƯỚC 4: Inject CSS Styles (Tùy chọn)

Nếu muốn tùy chỉnh style, thêm vào cuối file `theme.css` hoặc `base.css`:

```css
/* Discount Badge Styles */
.auto-discount-badge-wrapper {
  margin-bottom: 12px;
  display: inline-block;
}

.auto-discount-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 700;
  font-size: 14px;
  box-shadow: 0 2px 8px rgba(255, 107, 107, 0.3);
  animation: auto-badge-pulse 2s ease-in-out infinite;
}

.auto-discount-badge__icon {
  font-size: 16px;
  animation: auto-badge-bounce 1s ease-in-out infinite;
}

@keyframes auto-badge-pulse {
  0%, 100% { box-shadow: 0 2px 8px rgba(255, 107, 107, 0.3); }
  50% { box-shadow: 0 4px 16px rgba(255, 107, 107, 0.5); }
}

@keyframes auto-badge-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

/* Smaller on product cards */
.card .auto-discount-badge {
  font-size: 11px;
  padding: 6px 12px;
}
```

---

## ✅ Kết Quả

Sau khi làm xong 2 bước trên:
- ✅ Badge tự động xuất hiện trên **Product Detail Page**
- ✅ Badge tự động xuất hiện trên **Collection Pages**
- ✅ Badge tự động xuất hiện trên **Homepage Featured Products**
- ✅ Badge tự động xuất hiện trên **Search Results**
- ✅ Badge tự động ẩn nếu product không có discount

---

## 🔍 Tìm File Nhanh

**Cách 1: Dùng Theme Editor**
1. Vào **Online Store** → **Themes** → **Edit code**
2. Tìm trong sidebar:
   - `Sections/` → `main-product.liquid`
   - `Snippets/` → `card-product.liquid`

**Cách 2: Search trong theme**
1. Press **Ctrl+F** trong Theme Editor
2. Search: `product__title` → tìm product detail
3. Search: `card__heading` → tìm product card

---

## ⚠️ Quan Trọng

- **Backup theme** trước khi sửa!
- Test trên **dev theme** trước
- Nếu theme update, cần inject lại
- Snippet `discount-badge.liquid` đã có sẵn từ extension

---

## 🆘 Troubleshooting

**Badge không hiển thị?**
1. Check product có metafield `custom.discount_percentage` chưa
2. Check snippet name đúng: `discount-badge` (không có `.liquid`)
3. Check biến product name đúng: `product`, `card_product`, hay `item`

**Badge hiển thị sai vị trí?**
- Di chuyển dòng `{% render 'discount-badge' %}` lên/xuống
- Thử inject vào element khác (trên image, trên price, etc.)

**Badge trùng lặp?**
- Xóa các dòng inject cũ
- Chỉ inject 1 lần ở 1 nơi

---

**Tạo bởi:** Auto Discount Badge Extension  
**Version:** 1.0.0
