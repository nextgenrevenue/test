// components-inline.js
// এই ফাইলটি আপনার সকল HTML পেজে include করবেন

(function() {
  'use strict';
  
  // ==================== HTML TEMPLATES ====================
  const templates = {
    header: `
      <header class="admin-header">
        <button class="mobile-menu-btn" id="mobileMenuBtn">☰</button>
        <h1 id="pageTitle">এডমিন ড্যাশবোর্ড</h1>
        <button class="logout-btn" id="logoutBtn">লগআউট</button>
      </header>
      
      <style>
        .admin-header {
          background-color: #1f2937;
          color: #ffffff;
          padding: 15px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          height: 60px;
          box-sizing: border-box;
          /* রোটেশন ফিক্স - সঠিক উচ্চতা বজায় রাখা */
          min-height: 60px;
        }
        
        .admin-header h1 {
          font-size: 22px;
          font-family: 'Noto Sans Bengali', sans-serif;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 60%;
        }
        
        .mobile-menu-btn {
          display: none;
          background: none;
          border: none;
          color: #ffffff;
          font-size: 24px;
          cursor: pointer;
          padding: 5px;
          width: 40px;
          height: 40px;
          flex-shrink: 0;
        }
        
        .logout-btn {
          padding: 8px 16px;
          background-color: #dc2626;
          color: #ffffff;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: 'Noto Sans Bengali', sans-serif;
          white-space: nowrap;
          flex-shrink: 0;
        }
        
        .logout-btn:hover {
          background-color: #b91c1c;
        }
        
        /* মোবাইল স্টাইল */
        @media (max-width: 768px) {
          .mobile-menu-btn {
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .admin-header {
            height: 60px;
            padding: 10px 15px;
          }
          
          .admin-header h1 {
            font-size: 18px;
            max-width: 50%;
          }
        }
        
        /* ল্যান্ডস্কেপ মোডে (ফোন রোটেট করলে) */
        @media (max-width: 768px) and (orientation: landscape) {
          .admin-header {
            height: 50px;
            padding: 8px 15px;
          }
          
          .admin-header h1 {
            font-size: 16px;
            max-width: 40%;
          }
          
          .logout-btn {
            padding: 6px 12px;
            font-size: 14px;
          }
          
          .mobile-menu-btn {
            width: 35px;
            height: 35px;
            font-size: 20px;
          }
        }
        
        /* খুব ছোট ডিভাইসের জন্য */
        @media (max-width: 480px) {
          .admin-header h1 {
            font-size: 16px;
            max-width: 45%;
          }
          
          .logout-btn {
            padding: 6px 12px;
            font-size: 14px;
          }
        }
      </style>
    `,
    
    sidebar: `
  <nav class="admin-sidebar" id="sidebar">
    <ul class="sidebar-menu">
      <li><a href="/dashboard" class="sidebar-link" data-page="dashboard"><i>📊</i> ড্যাশবোর্ড</a></li>
      <li><a href="/serial" class="sidebar-link" data-page="appointments"><i>📅</i> অ্যাপয়েন্টমেন্ট</a></li>
      <li><a href="/live" class="sidebar-link" data-page="live"><i>👨‍⚕️</i> লাইভ অ্যাটেনডেন্স</a></li>
      <li><a href="/serialmanagement" class="sidebar-link" data-page="serialmanagement"><i>⏰</i> সিরিয়াল ম্যানেজমেন্ট</a></li>
      <li><a href="/notice" class="sidebar-link" data-page="notice"><i>👥</i> নোটিস</a></li>
      <li><a href="/settings" class="sidebar-link" data-page="settings"><i>⚙️</i> সেটিংস</a></li>
    </ul>
  </nav>
  
  <style>
    .admin-sidebar {
      width: 250px;
      background-color: #ffffff;
      border-right: 1px solid #e5e7eb;
      padding: 20px 0;
      transition: all 0.3s ease;
      height: calc(100vh - 60px);
      position: sticky;
      top: 60px;
      overflow-y: auto;
      flex-shrink: 0;
    }
    
    .sidebar-menu {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    
    .sidebar-menu li {
      margin-bottom: 5px;
    }
    
    .sidebar-menu a {
      display: flex;
      align-items: center;
      padding: 12px 20px;
      color: #1f2937;
      text-decoration: none;
      transition: all 0.2s ease;
      font-weight: 500;
      font-family: 'Noto Sans Bengali', sans-serif;
    }
    
    .sidebar-menu a:hover, 
    .sidebar-menu a.active {
      background-color: #f3f4f6;
      color: #2563eb;
    }
    
    .sidebar-menu a i {
      margin-right: 10px;
      width: 20px;
      text-align: center;
      flex-shrink: 0;
    }
    
    /* ল্যান্ডস্কেপ মোডে সাইডবার */
    @media (max-width: 768px) and (orientation: landscape) {
      .admin-sidebar {
        height: calc(100vh - 50px);
        top: 50px;
      }
    }
    
    @media (max-width: 768px) {
      .admin-sidebar {
        position: fixed;
        top: 60px;
        left: -250px;
        z-index: 100;
        box-shadow: 2px 0 10px rgba(0,0,0,0.1);
      }
      
      .admin-sidebar.mobile-open {
        left: 0;
      }
    }
  </style>
`,
    
    footer: `
      <footer class="admin-footer">
        <p>© ${new Date().getFullYear()} Doctor Appointment System - Admin Panel</p>
      </footer>
      
      <style>
        .admin-footer {
          background-color: #1f2937;
          color: #ffffff;
          text-align: center;
          padding: 15px;
          margin-top: 20px;
          font-family: 'Noto Sans Bengali', sans-serif;
          position: relative;
          z-index: 1;
        }
        
        @media (max-width: 768px) {
          .admin-footer {
            padding: 10px;
            font-size: 14px;
          }
        }
      </style>
    `
  };
  
  // ==================== COMPONENT LOADER ====================
  const ComponentLoader = {
    // কম্পোনেন্ট রেন্ডার
    render(componentName, containerId, options = {}) {
      const container = document.getElementById(containerId);
      if (!container) {
        console.error(`Container #${containerId} not found`);
        return false;
      }
      
      if (!templates[componentName]) {
        console.error(`Component "${componentName}" not found`);
        return false;
      }
      
      container.innerHTML = templates[componentName];
      
      // অপশনাল টাইটেল সেট
      if (options.title && componentName === 'header') {
        const titleEl = document.getElementById('pageTitle');
        if (titleEl) {
          titleEl.textContent = options.title;
        }
      }
      
      // কম্পোনেন্ট ইনিশিয়ালাইজ
      this.initialize(componentName);
      
      return true;
    },
    
    // কম্পোনেন্ট ইনিশিয়ালাইজেশন
    initialize(componentName) {
      switch(componentName) {
        case 'header':
          this.initHeader();
          break;
        case 'sidebar':
          this.initSidebar();
          break;
      }
    },
    
    // হেডার ইনিশিয়ালাইজ
    initHeader() {
      const logoutBtn = document.getElementById('logoutBtn');
      const mobileMenuBtn = document.getElementById('mobileMenuBtn');
      
      if (logoutBtn) {
        logoutBtn.addEventListener('click', this.handleLogout);
      }
      
      if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', this.toggleSidebar);
      }
      
      // রোটেশন হ্যান্ডলিং
      this.handleViewportChanges();
    },
    
    // সাইডবার ইনিশিয়ালাইজ
    initSidebar() {
      // বর্তমান পেজ সেট
      const currentPage = this.getCurrentPage();
      document.querySelectorAll('.sidebar-link').forEach(link => {
        const page = link.getAttribute('data-page');
        if (page === currentPage) {
          link.classList.add('active');
        }
        
        // মোবাইলে ক্লিক করলে সাইডবার বন্ধ
        link.addEventListener('click', () => {
          if (window.innerWidth <= 768) {
            this.toggleSidebar(false);
          }
        });
      });
    },
    
    // রোটেশন এবং রিসাইজ হ্যান্ডলিং
    handleViewportChanges() {
      const header = document.querySelector('.admin-header');
      const sidebar = document.getElementById('sidebar');
      
      if (!header) return;
      
      // ফোন ল্যান্ডস্কেপ মোডে
      if (window.innerWidth > window.innerHeight && window.innerWidth <= 768) {
        // ল্যান্ডস্কেপ: হেডার ছোট করুন
        header.style.height = '50px';
        header.style.padding = '8px 15px';
        
        const title = document.getElementById('pageTitle');
        if (title) {
          title.style.fontSize = '16px';
        }
        
        // সাইডবার উচ্চতা সঠিক করুন
        if (sidebar) {
          sidebar.style.top = '50px';
          sidebar.style.height = 'calc(100vh - 50px)';
        }
      } else {
        // পোর্ট্রেট বা ডেস্কটপ: নরমাল সাইজ
        header.style.height = '';
        header.style.padding = '';
        
        const title = document.getElementById('pageTitle');
        if (title) {
          title.style.fontSize = '';
        }
        
        // সাইডবার উচ্চতা সঠিক করুন
        if (sidebar) {
          sidebar.style.top = '';
          sidebar.style.height = '';
        }
      }
    },
    
    // সাহায্যকারী ফাংশন
    getCurrentPage() {
      const path = window.location.pathname;
      if (path.includes('dashboard')) return 'dashboard';
      if (path.includes('live')) return 'live';
      if (path.includes('notice')) return 'notice';
      if (path.includes('settings')) return 'settings';
      return 'dashboard';
    },
    
    toggleSidebar(show = null) {
      const sidebar = document.getElementById('sidebar');
      if (!sidebar) return;
      
      if (show === null) {
        sidebar.classList.toggle('mobile-open');
      } else {
        if (show) {
          sidebar.classList.add('mobile-open');
        } else {
          sidebar.classList.remove('mobile-open');
        }
      }
    },
    
    handleLogout() {
      if (confirm('আপনি কি লগআউট করতে চান?')) {
        sessionStorage.clear();
        localStorage.clear();
        window.location.href = '/login';
      }
    },
    
    // সব কম্পোনেন্ট একসাথে লোড
    loadAllComponents(pageTitle = 'এডমিন ড্যাশবোর্ড') {
      this.render('header', 'header-container', { title: pageTitle });
      this.render('sidebar', 'sidebar-container');
      this.render('footer', 'footer-container');
      
      // রোটেশন ইভেন্ট লিসেনার যোগ করুন
      window.addEventListener('resize', () => this.handleViewportChanges());
      window.addEventListener('orientationchange', () => {
        setTimeout(() => this.handleViewportChanges(), 100);
      });
    }
  };
  
  // ==================== GLOBAL EXPOSE ====================
  window.ComponentLoader = ComponentLoader;
  
  // DOMContentLoaded হলে অটো লোড
  document.addEventListener('DOMContentLoaded', function() {
    // যদি অটো-লোড করতে চান
    const shouldAutoLoad = document.body.hasAttribute('data-auto-load-components');
    if (shouldAutoLoad) {
      const pageTitle = document.title || 'এডমিন ড্যাশবোর্ড';
      ComponentLoader.loadAllComponents(pageTitle);
    }
  });
  
})();
