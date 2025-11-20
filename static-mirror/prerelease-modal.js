// Pre-release modal for No Bad Days
(function() {
  'use strict';
  
  // Create modal HTML
  const modalHTML = `
    <div id="nbd-prerelease-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.7); z-index: 10000; align-items: center; justify-content: center;">
      <div style="background: rgb(253, 251, 247); padding: 2rem; border-radius: 1.2rem; max-width: 500px; width: 90%; max-height: 90vh; overflow-y: auto; position: relative; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
        <button id="nbd-modal-close" style="position: absolute; top: 1rem; right: 1rem; background: none; border: none; font-size: 1.5rem; cursor: pointer; color: rgb(41, 36, 28); padding: 0.5rem; line-height: 1;">&times;</button>
        <h2 style="font-family: Poppins, sans-serif; font-weight: 500; color: rgb(41, 36, 28); margin-top: 0; margin-bottom: 1rem; font-size: 1.5rem;">No Bad Days is Pre-Release</h2>
        <p style="color: rgb(41, 36, 28); margin-bottom: 1.5rem; line-height: 1.6;">Want to learn more or get involved with this project? Please send us a short note here.</p>
        <form id="nbd-prerelease-form" method="post" action="https://formsubmit.co/dberzin@hotmail.com" style="display: flex; flex-direction: column; gap: 1rem;">
          <input type="hidden" name="_subject" value="Pre-Release Interest - No Bad Days">
          <input type="hidden" name="_next" value="">
          <input type="hidden" name="_captcha" value="false">
          <div>
            <label for="nbd-name" style="display: block; margin-bottom: 0.5rem; color: rgb(41, 36, 28); font-weight: 500;">Name</label>
            <input type="text" id="nbd-name" name="name" required style="width: 100%; padding: 0.75rem; border: 1px solid rgba(41, 36, 28, 0.3); border-radius: 0.5rem; font-size: 1rem; font-family: inherit; box-sizing: border-box;">
          </div>
          <div>
            <label for="nbd-email" style="display: block; margin-bottom: 0.5rem; color: rgb(41, 36, 28); font-weight: 500;">Email</label>
            <input type="email" id="nbd-email" name="email" required style="width: 100%; padding: 0.75rem; border: 1px solid rgba(41, 36, 28, 0.3); border-radius: 0.5rem; font-size: 1rem; font-family: inherit; box-sizing: border-box;">
          </div>
          <div>
            <label for="nbd-message" style="display: block; margin-bottom: 0.5rem; color: rgb(41, 36, 28); font-weight: 500;">Message</label>
            <textarea id="nbd-message" name="message" rows="4" required style="width: 100%; padding: 0.75rem; border: 1px solid rgba(41, 36, 28, 0.3); border-radius: 0.5rem; font-size: 1rem; font-family: inherit; box-sizing: border-box; resize: vertical;"></textarea>
          </div>
          <button type="submit" style="background: rgb(255, 230, 167); color: rgb(41, 36, 28); padding: 0.75rem 1.5rem; border: none; border-radius: 0.5rem; font-size: 1rem; font-weight: 500; cursor: pointer; font-family: Poppins, sans-serif; transition: background 0.2s;">Send Message</button>
        </form>
      </div>
    </div>
  `;
  
  // Inject modal into page
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  const modal = document.getElementById('nbd-prerelease-modal');
  const closeBtn = document.getElementById('nbd-modal-close');
  const form = document.getElementById('nbd-prerelease-form');
  
  // Set redirect URL
  const redirectInput = form.querySelector('input[name="_next"]');
  if (redirectInput) {
    redirectInput.value = window.location.origin + window.location.pathname + '?submitted=1';
  }
  
  // Show modal
  function showModal() {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
  
  // Hide modal
  function hideModal() {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }
  
  // Close button
  closeBtn.addEventListener('click', hideModal);
  
  // Close on background click
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      hideModal();
    }
  });
  
  // Close on Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modal.style.display === 'flex') {
      hideModal();
    }
  });
  
  // Intercept login links
  document.addEventListener('click', function(e) {
    const target = e.target.closest('a[href*="/account/login"], a[href*="/account"], a[href*="login"]');
    if (target) {
      e.preventDefault();
      showModal();
    }
  });
  
  // Intercept add to cart forms
  document.addEventListener('submit', function(e) {
    const form = e.target;
    if (form.action && (form.action.includes('/cart/add') || form.action.includes('/cart') || form.querySelector('button[name="add"]') || form.querySelector('button[type="submit"]') && form.closest('[data-type="add-to-cart-form"]'))) {
      e.preventDefault();
      showModal();
    }
  });
  
  // Intercept checkout buttons
  document.addEventListener('click', function(e) {
    const target = e.target.closest('button[name="checkout"], a[href*="/checkout"], button[type="submit"][name="checkout"]');
    if (target) {
      e.preventDefault();
      showModal();
    }
  });
  
  // Handle form submission
  form.addEventListener('submit', function(e) {
    // FormSubmit will handle the submission
    // Just show a brief message
    setTimeout(function() {
      alert('Thank you for your interest! We\'ll be in touch soon.');
      hideModal();
    }, 100);
  });
  
  // Show success message if redirected
  if (window.location.search.includes('submitted=1')) {
    setTimeout(function() {
      alert('Thank you for your interest! We\'ll be in touch soon.');
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    }, 500);
  }
  
  // Auto-show modal on About page after 10 seconds
  if (window.location.pathname.includes('/pages/about') || window.location.pathname.includes('/about')) {
    setTimeout(function() {
      showModal();
    }, 10000); // 10 seconds
  }
})();

