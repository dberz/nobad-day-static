// Blog Pagination - Shows 12 posts per page
(function() {
  'use strict';
  
  const POSTS_PER_PAGE = 12;
  
  function initPagination() {
    const blogArticles = document.querySelector('.blog-articles');
    if (!blogArticles) return;
    
    const articles = Array.from(blogArticles.querySelectorAll('.blog-articles__article'));
    // Always show pagination controls, even if all posts fit on one page
    
    // Get current page from URL
    const urlParams = new URLSearchParams(window.location.search);
    let currentPage = parseInt(urlParams.get('page')) || 1;
    
    // Calculate total pages
    const totalPages = Math.ceil(articles.length / POSTS_PER_PAGE);
    
    // Ensure current page is valid
    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;
    
    // Show/hide articles based on current page
    function showPage(page) {
      const startIndex = (page - 1) * POSTS_PER_PAGE;
      const endIndex = startIndex + POSTS_PER_PAGE;
      
      articles.forEach((article, index) => {
        if (index >= startIndex && index < endIndex) {
          article.style.display = '';
        } else {
          article.style.display = 'none';
        }
      });
    }
    
    // Create pagination controls
    function createPaginationControls() {
      const paginationContainer = document.createElement('div');
      paginationContainer.className = 'blog-pagination';
      paginationContainer.style.cssText = `
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 1rem;
        margin: 3rem 0;
        flex-wrap: wrap;
      `;
      
      // Previous button
      const prevButton = document.createElement('button');
      prevButton.textContent = '← Previous';
      prevButton.className = 'blog-pagination__button';
      prevButton.style.cssText = `
        padding: 0.75rem 1.5rem;
        background: var(--color-button, #fff);
        color: var(--color-button-text, #000);
        border: 1px solid var(--color-button-text, #000);
        border-radius: 4px;
        cursor: pointer;
        font-size: 1.25rem;
        transition: all 0.2s;
      `;
      prevButton.disabled = currentPage === 1;
      if (prevButton.disabled) {
        prevButton.style.opacity = '0.5';
        prevButton.style.cursor = 'not-allowed';
      }
      prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
          goToPage(currentPage - 1);
        }
      });
      prevButton.addEventListener('mouseenter', function() {
        if (!this.disabled) {
          this.style.opacity = '0.8';
        }
      });
      prevButton.addEventListener('mouseleave', function() {
        if (!this.disabled) {
          this.style.opacity = '1';
        }
      });
      
      // Page numbers
      const pageNumbers = document.createElement('div');
      pageNumbers.className = 'blog-pagination__numbers';
      pageNumbers.style.cssText = `
        display: flex;
        gap: 0.5rem;
        align-items: center;
      `;
      
      // Show page numbers (max 7 visible)
      const maxVisible = 7;
      let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
      let endPage = Math.min(totalPages, startPage + maxVisible - 1);
      
      if (endPage - startPage < maxVisible - 1) {
        startPage = Math.max(1, endPage - maxVisible + 1);
      }
      
      // First page
      if (startPage > 1) {
        const firstBtn = createPageButton(1);
        pageNumbers.appendChild(firstBtn);
        if (startPage > 2) {
          const ellipsis = document.createElement('span');
          ellipsis.textContent = '...';
          ellipsis.style.cssText = 'padding: 0 0.5rem; font-size: 1.25rem;';
          pageNumbers.appendChild(ellipsis);
        }
      }
      
      // Page number buttons
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.appendChild(createPageButton(i));
      }
      
      // Last page
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          const ellipsis = document.createElement('span');
          ellipsis.textContent = '...';
          ellipsis.style.cssText = 'padding: 0 0.5rem; font-size: 1.25rem;';
          pageNumbers.appendChild(ellipsis);
        }
        pageNumbers.appendChild(createPageButton(totalPages));
      }
      
      // Next button
      const nextButton = document.createElement('button');
      nextButton.textContent = 'Next →';
      nextButton.className = 'blog-pagination__button';
      nextButton.style.cssText = prevButton.style.cssText;
      nextButton.disabled = currentPage === totalPages;
      if (nextButton.disabled) {
        nextButton.style.opacity = '0.5';
        nextButton.style.cursor = 'not-allowed';
      }
      nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
          goToPage(currentPage + 1);
        }
      });
      nextButton.addEventListener('mouseenter', function() {
        if (!this.disabled) {
          this.style.opacity = '0.8';
        }
      });
      nextButton.addEventListener('mouseleave', function() {
        if (!this.disabled) {
          this.style.opacity = '1';
        }
      });
      
      paginationContainer.appendChild(prevButton);
      paginationContainer.appendChild(pageNumbers);
      paginationContainer.appendChild(nextButton);
      
      return paginationContainer;
    }
    
    function createPageButton(pageNum) {
      const button = document.createElement('button');
      button.textContent = pageNum;
      button.className = 'blog-pagination__page-number';
      const isActive = pageNum === currentPage;
      button.style.cssText = `
        min-width: 3rem;
        height: 3rem;
        padding: 0 1rem;
        background: ${isActive ? 'var(--color-button-text, #000)' : 'var(--color-button, #fff)'};
        color: ${isActive ? 'var(--color-button, #fff)' : 'var(--color-button-text, #000)'};
        border: 1px solid var(--color-button-text, #000);
        border-radius: 4px;
        cursor: pointer;
        font-size: 1.25rem;
        font-weight: ${isActive ? 'bold' : 'normal'};
        transition: all 0.2s;
      `;
      
      if (!isActive) {
        button.addEventListener('click', () => goToPage(pageNum));
        button.addEventListener('mouseenter', function() {
          this.style.opacity = '0.8';
        });
        button.addEventListener('mouseleave', function() {
          this.style.opacity = '1';
        });
      } else {
        button.style.cursor = 'default';
      }
      
      return button;
    }
    
    function goToPage(page) {
      currentPage = page;
      
      // Update URL without reload
      const url = new URL(window.location);
      if (page === 1) {
        url.searchParams.delete('page');
      } else {
        url.searchParams.set('page', page);
      }
      window.history.pushState({ page }, '', url);
      
      // Update display
      showPage(currentPage);
      
      // Recreate pagination controls
      const oldPagination = document.querySelector('.blog-pagination');
      if (oldPagination) {
        oldPagination.remove();
      }
      const newPagination = createPaginationControls();
      blogArticles.parentNode.insertBefore(newPagination, blogArticles.nextSibling);
      
      // Scroll to top of blog section
      blogArticles.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    // Remove existing Shopify pagination if present
    const oldShopifyPagination = document.querySelector('.pagination-wrapper');
    if (oldShopifyPagination) {
      oldShopifyPagination.remove();
    }
    
    // Remove rel="next" link tag if present
    const nextLink = document.querySelector('link[rel="next"]');
    if (nextLink) {
      nextLink.remove();
    }
    
    // Initial setup
    showPage(currentPage);
    
    // Add pagination controls after blog articles
    const pagination = createPaginationControls();
    blogArticles.parentNode.insertBefore(pagination, blogArticles.nextSibling);
    
    // Handle browser back/forward buttons
    window.addEventListener('popstate', function(event) {
      const urlParams = new URLSearchParams(window.location.search);
      const page = parseInt(urlParams.get('page')) || 1;
      if (page !== currentPage) {
        currentPage = page;
        showPage(currentPage);
        
        // Recreate pagination controls
        const oldPagination = document.querySelector('.blog-pagination');
        if (oldPagination) {
          oldPagination.remove();
        }
        const newPagination = createPaginationControls();
        blogArticles.parentNode.insertBefore(newPagination, blogArticles.nextSibling);
      }
    });
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPagination);
  } else {
    initPagination();
  }
})();

