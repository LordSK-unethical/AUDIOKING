// Simple Electron navigation for AUDIOKING
console.log('Loading AUDIOKING navigation...');

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM ready, setting up navigation');
  applyTheme();
  setupNavigation();
  setupKeyboardShortcuts();
});

// Apply theme on page load
function applyTheme() {
  const theme = localStorage.getItem('theme');
  if (theme === 'light') {
    document.body.classList.remove('dark-theme');
  } else {
    document.body.classList.add('dark-theme');
  }
}

function setupNavigation() {
  // Menu items
  const menuItems = [
    { id: 'convert-nav', page: 'converter' },
    { id: 'batch-nav', page: 'batch' },
    { id: 'settings-nav', page: 'settings' },
    { id: 'help-nav', page: 'help' }
  ];

  // Setup menu navigation
  menuItems.forEach(item => {
    const element = document.getElementById(item.id);
    if (element) {
      console.log(`Setting up ${item.id} -> ${item.page}`);
      element.addEventListener('click', (e) => {
        e.preventDefault();
        console.log(`Clicked ${item.id}, navigating to ${item.page}`);
        
        // Update active state immediately
        updateActiveMenuItem(item.id);
        
        // Navigate
        navigateToPage(item.page);
      });
    } else {
      console.warn(`Element not found: ${item.id}`);
    }
  });

  // Setup action buttons
  const startBtn = document.getElementById('start-converter');
  if (startBtn) {
    console.log('Setting up start-converter button');
    startBtn.addEventListener('click', (e) => {
      e.preventDefault();
      navigateToPage('converter');
    });
  }

  const helpBtn = document.getElementById('show-help');
  if (helpBtn) {
    console.log('Setting up help button');
    helpBtn.addEventListener('click', (e) => {
      e.preventDefault();
      navigateToPage('help');
    });
  }
}

async function navigateToPage(page) {
  console.log(`[NAVIGATION] Attempting to navigate to: ${page}`);
  
  // Try Electron navigation first
  if (window.electronAPI && window.electronAPI.navigateTo) {
    try {
      console.log(`[NAVIGATION] Using Electron IPC for: ${page}`);
      const result = await window.electronAPI.navigateTo(page);
      console.log(`[NAVIGATION] IPC result:`, result);
      
      if (result && result.success) {
        console.log(`[NAVIGATION] ✅ Successfully navigated to ${page}`);
        return;
      } else {
        console.warn(`[NAVIGATION] ❌ Navigation failed:`, result);
      }
    } catch (error) {
      console.error(`[NAVIGATION] ❌ Electron navigation error:`, error);
    }
  } else {
    console.warn('[NAVIGATION] electronAPI.navigateTo not available');
  }
  
  // Fallback to browser navigation
  const pageUrls = {
    'converter': 'pages/converter.html',
    'batch': 'pages/batch.html',
    'settings': 'pages/settings.html',
    'help': 'pages/help.html'
  };
  
  if (pageUrls[page]) {
    console.log(`Using fallback navigation to ${pageUrls[page]}`);
    window.location.href = pageUrls[page];
  }
}

function updateActiveMenuItem(activeId) {
  // Remove active class from all menu items
  document.querySelectorAll('.menu-item').forEach(item => {
    item.classList.remove('active');
  });
  
  // Add active class to clicked item
  const activeElement = document.getElementById(activeId);
  if (activeElement) {
    activeElement.classList.add('active');
    console.log(`Updated active menu item: ${activeId}`);
  }
}

// Keyboard shortcuts implementation
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ctrl+O - Open file
    if (e.ctrlKey && e.key === 'o' && !e.shiftKey) {
      e.preventDefault();
      document.getElementById('fileInput')?.click();
    }
    // Ctrl+Shift+O - Open multiple files
    else if (e.ctrlKey && e.shiftKey && e.key === 'O') {
      e.preventDefault();
      document.getElementById('batchFileInput')?.click();
    }
    // Ctrl+Enter - Start conversion
    else if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      document.getElementById('convertForm')?.dispatchEvent(new Event('submit'));
    }
    // Escape - Cancel conversion
    else if (e.key === 'Escape') {
      e.preventDefault();
      // Cancel any ongoing conversion
      const convertBtn = document.querySelector('.convert-btn');
      if (convertBtn?.classList.contains('loading')) {
        console.log('Conversion cancelled by user');
      }
    }
    // Ctrl+B - Toggle batch mode
    else if (e.ctrlKey && e.key === 'b') {
      e.preventDefault();
      const batchMode = document.getElementById('batchMode');
      if (batchMode) {
        batchMode.checked = !batchMode.checked;
        batchMode.dispatchEvent(new Event('change'));
      }
    }
  });
}

// Global function for external use
window.navigateToPage = navigateToPage;

console.log('AUDIOKING navigation loaded');