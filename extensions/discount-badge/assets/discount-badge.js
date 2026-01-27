/**
 * Auto Discount Badge - Asset Injection
 * Tự động hiển thị badge giảm giá từ metafield
 * Không cần bật app embed!
 */

(function() {
  'use strict';
  
  // Đợi DOM load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  function init() {
    // Chỉ chạy trên product pages
    if (!window.location.pathname.includes('/products/')) return;
    
    // Lấy product data từ Shopify object hoặc meta tags
    let discountPercent = null;
    
    // Method 1: Từ Shopify.product nếu có
    if (typeof ShopifyAnalytics !== 'undefined' && ShopifyAnalytics.meta && ShopifyAnalytics.meta.product) {
      const product = ShopifyAnalytics.meta.product;
      // Fetch metafield qua API hoặc inject vào template
    }
    
    // Method 2: Đọc từ meta tag (cần inject ở theme)
    const metaDiscount = document.querySelector('meta[name="product-discount"]');
    if (metaDiscount) {
      discountPercent = parseFloat(metaDiscount.getAttribute('content'));
    }
    
    // Method 3: Đọc từ data attribute trên product form
    const productForm = document.querySelector('form[action*="/cart/add"]');
    if (productForm && productForm.dataset.discount) {
      discountPercent = parseFloat(productForm.dataset.discount);
    }
    
    // Method 4: Parse từ JSON-LD hoặc product JSON
    const scriptTags = document.querySelectorAll('script[type="application/json"]');
    for (const script of scriptTags) {
      try {
        const data = JSON.parse(script.textContent);
        if (data && data.metafields && data.metafields.custom && data.metafields.custom.discount_percentage) {
          discountPercent = parseFloat(data.metafields.custom.discount_percentage);
          break;
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
    
    // Nếu không có discount, exit
    if (!discountPercent || discountPercent <= 0) {
      console.log('No discount found for this product');
      return;
    }
    
    console.log('Discount found:', discountPercent + '%');
    
    // Tìm product title
    const titleSelectors = [
      '.product__title',
      '.product-title',
      'h1[class*="product"]',
      '.product-single__title',
      '.product__heading',
      '[itemprop="name"]',
      '.product-meta__title',
      'h1.h2',
      'h1'
    ];
    
    let titleElement = null;
    for (const selector of titleSelectors) {
      const elements = document.querySelectorAll(selector);
      for (const el of elements) {
        // Tìm h1 trong product page
        if (el.tagName === 'H1' || el.closest('.product-info-main') || el.closest('[class*="product"]')) {
          titleElement = el;
          break;
        }
      }
      if (titleElement) break;
    }
    
    if (!titleElement) {
      console.warn('Discount Badge: Could not find product title');
      // Fallback: tìm h1 đầu tiên
      titleElement = document.querySelector('h1');
    }
    
    if (!titleElement) {
      console.error('Discount Badge: No title element found');
      return;
    }
    
    console.log('Title element found:', titleElement);
    
    // Kiểm tra xem đã có badge chưa
    if (document.querySelector('.auto-discount-badge-wrapper')) {
      console.log('Badge already exists');
      return;
    }
    
    // Tạo discount badge
    const badgeWrapper = document.createElement('div');
    badgeWrapper.className = 'auto-discount-badge-wrapper';
    badgeWrapper.innerHTML = `
      <div class="auto-discount-badge">
        <span class="auto-discount-badge__icon">🔥</span>
        <span class="auto-discount-badge__text">GIẢM ${Math.round(discountPercent)}%</span>
      </div>
    `;
    
    // Insert badge trước title
    titleElement.parentNode.insertBefore(badgeWrapper, titleElement);
    
    console.log('Discount badge inserted');
    
    // Inject styles
    injectStyles();
  }
  
  function injectStyles() {
    if (document.querySelector('#auto-discount-badge-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'auto-discount-badge-styles';
    style.textContent = `
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

      .auto-discount-badge__text {
        letter-spacing: 0.5px;
      }

      @keyframes auto-badge-pulse {
        0%, 100% {
          box-shadow: 0 2px 8px rgba(255, 107, 107, 0.3);
        }
        50% {
          box-shadow: 0 4px 16px rgba(255, 107, 107, 0.5);
        }
      }

      @keyframes auto-badge-bounce {
        0%, 100% {
          transform: translateY(0);
        }
        50% {
          transform: translateY(-3px);
        }
      }

      @media (max-width: 749px) {
        .auto-discount-badge {
          font-size: 12px;
          padding: 6px 12px;
        }
        .auto-discount-badge__icon {
          font-size: 14px;
        }
      }
    `;
    
    document.head.appendChild(style);
  }
  
  // Re-init khi theme section re-renders
  if (typeof Shopify !== 'undefined' && Shopify.designMode) {
    document.addEventListener('shopify:section:load', init);
  }
})();
