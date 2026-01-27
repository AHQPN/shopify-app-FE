
  (function () {
    const container = document.getElementById('app-product-reviews');
    if (!container) return;

    const productId = 'gid://shopify/Product/' + container.dataset.productId;
    const productName = container.dataset.productName; // Get product name
    const shop = container.dataset.shop;
    
    // Using Ngrok URL from .env (Manual update or assume build process replaces this if set up)
    // For Production: Consider using a Schema Setting.
    const API_URL = 'https://082f6680d202.ngrok-free.app/api'; 

    let replyingToId = null;
    
    // ... (rest of code)

    // Form Submit
    if (form) {
      form.addEventListener('submit', async (e) => {
        // ... (validation logic)
        
          const reviewPayload = {
            productId: productId,
            productName: productName, // Send product name
            customerName: formData.get('customerName'),
            rating: ratingVal,
            comment: formData.get('comment'),
            replyTo: replyingToId,
            media: mediaItems,
          };
          
          // ...

    // Modal Controls
    const modal = document.getElementById('review-modal');
    const btnShow = document.getElementById('btn-show-review-form');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const btnCancel = document.getElementById('btn-cancel-review');
    const form = document.getElementById('review-form');
    const statusDiv = document.getElementById('review-submit-status');
    const fileInput = document.getElementById('file-upload');
    const fileLabel = document.getElementById('file-upload-label');

    function openModal() {
      if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    }

    function closeModal() {
      if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        if (form) form.reset();
        cancelReply();
        statusDiv.innerHTML = '';
        updateFileLabel();
      }
    }

    if (btnShow) {
      btnShow.addEventListener('click', openModal);
    }

    if (modalCloseBtn) {
      modalCloseBtn.addEventListener('click', closeModal);
    }

    if (btnCancel) {
      btnCancel.addEventListener('click', closeModal);
    }

    // Close on outside click
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeModal();
        }
      });
    }

    // File upload handling
    function updateFileLabel() {
      if (!fileInput || !fileLabel) return;

      const fileText = fileLabel.querySelector('.file-text');
      if (fileInput.files.length > 0) {
        fileLabel.classList.add('has-files');
        fileText.innerHTML = `<i class="fa-solid fa-check-circle"></i> ${fileInput.files.length} image${
          fileInput.files.length > 1 ? 's' : ''
        } selected`;
      } else {
        fileLabel.classList.remove('has-files');
        fileText.innerHTML = 'Click to upload images (Max 5 files, 30MB total)';
      }
    }

    if (fileInput) {
      fileInput.addEventListener('change', updateFileLabel);
    }

    // 0. Fetch Stats
    async function loadStats() {
      const statsContainer = document.getElementById('review-stats-container');
      if (!statsContainer) return;

      try {
        const res = await fetch(`${API_URL}/reviews/stats?shop=${shop}&productId=${productId}`);
        if (!res.ok) throw new Error('Failed to load stats');
        const json = await res.json();
        const stats = json.data;

        document.getElementById('avg-rating-value').textContent = stats.averageRating.toFixed(1);
        document.getElementById('total-reviews-count').textContent = stats.totalReviews + ' reviews';

        const avgStars = document.getElementById('avg-rating-stars');
        avgStars.innerHTML = Array(5)
          .fill(0)
          .map(
            (_, i) =>
              `<i class="fa-solid fa-star" style="color: ${
                i < Math.round(stats.averageRating) ? '#fbbf24' : '#e5e7eb'
              }; font-size: 18px;"></i>`
          )
          .join('');

        const totalReviews = stats.totalReviews && stats.totalReviews > 0 ? parseInt(stats.totalReviews) : 1;

        const createBar = (star, count) => {
          const safeCount = count || 0;
          const pct = (safeCount / totalReviews) * 100;
          return `
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <span style="width: 30px; font-size: 13px; color: #4b5563;">${star} <i class="fa-solid fa-star" style="font-size: 10px; color: #fbbf24;"></i></span>
                <div style="flex: 1; height: 8px; background-color: #e5e7eb; border-radius: 4px; overflow: hidden;">
                    <div style="display: block; height: 100%; width: ${pct}%; background-color: #10b981; border-radius: 4px; transition: width 0.3s ease;"></div>
                </div>
                <span style="width: 20px; font-size: 13px; color: #6b7280; text-align: right;">${safeCount}</span>
            </div>
          `;
        };

        const barsHtml = `
          ${createBar(5, stats.fiveStars)}
          ${createBar(4, stats.fourStars)}
          ${createBar(3, stats.threeStars)}
          ${createBar(2, stats.twoStars)}
          ${createBar(1, stats.oneStar)}
        `;

        document.getElementById('rating-bars').innerHTML = barsHtml;
      } catch (e) {
        console.error(e);
      }
    }

    // 1. Fetch Reviews
    async function loadReviews() {
      const listContainer = document.getElementById('reviews-list');

      loadStats();

      try {
        const res = await fetch(`${API_URL}/reviews?shop=${shop}&productId=${productId}`);
        if (!res.ok) throw new Error('Failed to load');
        const json = await res.json();
        const allReviews = json.data.content;

        if (allReviews.length === 0) {
          listContainer.innerHTML = `
          <div style="text-align: center; padding: 40px 0; color: #6b7280;">
            <i class="fa-regular fa-comments" style="font-size: 48px; color: #d1d5db; margin-bottom: 16px;"></i>
            <p style="margin: 0; font-size: 16px; font-weight: 500;">No reviews yet.</p>
            <p style="margin: 8px 0 0 0; font-size: 14px;">Be the first to share your experience!</p>
          </div>`;
          return;
        }

        const parents = allReviews.filter((r) => !r.replyTo);
        const replies = allReviews.filter((r) => r.replyTo);

        const renderReview = (r, isReply = false) => {
          const stars = Array(5)
            .fill(0)
            .map(
              (_, i) =>
                `<i class="fa-solid fa-star" style="color: ${
                  i < r.rating ? '#fbbf24' : '#e5e7eb'
                }; font-size: 14px;"></i>`
            )
            .join('');

          return `
            <div style="${
              isReply
                ? 'margin-left: 48px; border-left: 3px solid #dbeafe; padding-left: 16px; background: #f0f9ff;'
                : 'border-bottom: 1px solid #f3f4f6; padding-bottom: 20px;'
            } margin-bottom: 20px; padding: 16px; border-radius: 8px;">
              <div style="display:flex; justify-content:space-between; align-items: center; margin-bottom: 12px;">
                 <div style="display:flex; align-items:center; gap: 12px;">
                    <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; color: white; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(102, 126, 234, 0.3);">
                        ${(r.customerName || 'A').charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <strong style="color: #111827; font-size: 15px; display:block;">${
                          r.customerName || 'Anonymous'
                        }</strong>
                        <small style="color: #9ca3af; font-size: 12px;">${new Date(r.createdAt).toLocaleDateString(
                          'en-US',
                          { year: 'numeric', month: 'short', day: 'numeric' }
                        )}</small>
                    </div>
                    ${
                      isReply
                        ? '<span style="font-size: 11px; color: #2563eb; background: #dbeafe; padding: 3px 8px; border-radius: 4px; font-weight: 600; margin-left: 8px;">REPLY</span>'
                        : ''
                    }
                 </div>
                 <div style="display: flex; gap: 4px;">
                     ${!isReply && r.rating ? stars : ''}
                 </div>
              </div>
              <p style="margin: 0 0 12px 0; color: #374151; line-height: 1.6; font-size: 15px;">${r.comment}</p>
              ${
                r.media && r.media.length
                  ? `
                 <div style="display:flex; gap:12px; overflow-x:auto; padding-bottom: 8px; margin-top: 12px;">
                   ${r.media
                     .map((m) =>
                       m.mediaType === 'IMAGE'
                         ? `<img src="${API_URL.replace('/api', '')}${
                             m.mediaUrl
                           }" style="height:100px; width: 100px; object-fit: cover; border-radius: 12px; border: 2px solid #e5e7eb; cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'" />`
                         : `<video src="${API_URL.replace('/api', '')}${
                             m.mediaUrl
                           }" style="height:100px; border-radius: 12px;" controls></video>`
                     )
                     .join('')}
                 </div>`
                  : ''
              }
              
              ${
                !isReply && modal
                  ? `<div style="margin-top: 12px;">
                      <button class="btn-reply" data-id="${r.id}" data-name="${
                      r.customerName || 'Anonymous'
                    }" style="background: #eff6ff; border: 1px solid #bfdbfe; color: #2563eb; font-size: 13px; font-weight: 600; cursor: pointer; padding: 6px 12px; border-radius: 6px; transition: all 0.2s;">
                        <i class="fa-solid fa-reply"></i> Reply
                     </button>
                   </div>`
                  : ''
              }
            </div>
          `;
        };

        const html = parents
          .map((p) => {
            const pReplies = replies.filter((r) => r.replyTo === p.id);
            pReplies.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            return renderReview(p) + pReplies.map((r) => renderReview(r, true)).join('');
          })
          .join('');

        listContainer.innerHTML = html;

        listContainer.querySelectorAll('.btn-reply').forEach((btn) => {
          btn.addEventListener('click', (e) => {
            const id = btn.dataset.id;
            const name = btn.dataset.name;
            startReply(id, name);
          });
        });
      } catch (e) {
        console.error(e);
        listContainer.innerHTML =
          '<p style="color:#ef4444; text-align: center; padding: 20px;">Error loading reviews.</p>';
      }
    }

    // Reply Logic
    function startReply(id, name) {
      replyingToId = id;
      openModal();

      // Hide Rating Input
      const ratingGroup = form.querySelector('.star-rating-input').closest('.form-group');
      if (ratingGroup) ratingGroup.style.display = 'none';

      const bannerContainer = document.getElementById('reply-banner-container');
      if (bannerContainer) {
        bannerContainer.innerHTML = `
          <div class="reply-banner">
            <span><i class="fa-solid fa-reply" style="margin-right: 6px;"></i>Replying to <strong>${name}</strong></span>
            <button type="button" class="cancel-reply-btn" id="btn-cancel-reply-banner">Ã—</button>
          </div>
        `;

        document.getElementById('btn-cancel-reply-banner').onclick = cancelReply;
      }
    }

    function cancelReply() {
      replyingToId = null;

      // Show Rating Input
      const ratingGroup = form.querySelector('.star-rating-input').closest('.form-group');
      if (ratingGroup) ratingGroup.style.display = 'block';

      const bannerContainer = document.getElementById('reply-banner-container');
      if (bannerContainer) {
        bannerContainer.innerHTML = '';
      }
    }

    // Form Submit
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        statusDiv.innerHTML =
          '<span style="color: #3b82f6;"><i class="fa-solid fa-spinner fa-spin"></i> Submitting...</span>';

        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;

        const ratingInput = form.querySelector('input[name="rating"]:checked');
        let ratingVal = ratingInput ? parseInt(ratingInput.value) : 5;

        // If replying, rating is null
        if (replyingToId) {
          ratingVal = null;
        }

        try {
          const mediaItems = [];

          if (fileInput.files.length > 0) {
            if (fileInput.files.length > 5) {
              throw new Error('You can only upload a maximum of 5 images.');
            }

            let totalSize = 0;
            const MAX_SIZE = 30 * 1024 * 1024;

            for (let i = 0; i < fileInput.files.length; i++) {
              const file = fileInput.files[i];
              if (!file.type.startsWith('image/')) {
                throw new Error(`File ${file.name} is not an image.`);
              }
              totalSize += file.size;
            }

            if (totalSize > MAX_SIZE) {
              throw new Error('Total file size exceeds 30MB limit.');
            }

            const uploadData = new FormData();
            for (let i = 0; i < fileInput.files.length; i++) {
              uploadData.append('files', fileInput.files[i]);
            }

            const uploadRes = await fetch(`${API_URL}/files/upload`, {
              method: 'POST',
              body: uploadData,
            });

            if (!uploadRes.ok) {
              const errorJson = await uploadRes.json();
              throw new Error(errorJson.message || 'Upload failed');
            }
            const uploadJson = await uploadRes.json();

            uploadJson.data.forEach((url) => {
              mediaItems.push({
                url: url,
                type: 'IMAGE',
                fileSize: 0,
              });
            });
          }

          const reviewPayload = {
            productId: productId,
            productName: productName,
            customerName: formData.get('customerName'),
            rating: ratingVal,
            comment: formData.get('comment'),
            replyTo: replyingToId,
            media: mediaItems,
          };

          const res = await fetch(`${API_URL}/reviews?shop=${shop}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reviewPayload),
          });

          if (!res.ok) throw new Error('Review submission failed');

          statusDiv.innerHTML =
            '<span style="color: #10b981;"><i class="fa-solid fa-circle-check"></i> Review submitted successfully!</span>';

          setTimeout(() => {
            closeModal();
            loadReviews();
            if (submitBtn) submitBtn.disabled = false;
          }, 1500);
        } catch (err) {
          console.error(err);
          statusDiv.innerHTML = `<span style="color: #ef4444;"><i class="fa-solid fa-circle-exclamation"></i> ${err.message}</span>`;
          if (submitBtn) submitBtn.disabled = false;
        }
      });
    }

    // Init
    loadReviews();
  })();

