// Auto-Login Feature
// Automatically logs in to BlizFlow when visiting the app

export class AutoLogin {
  constructor() {
    this.loginUrl = 'https://blizflow.online/sign-in';
    this.dashboardUrl = 'https://blizflow.online/dashboard';
  }

  async checkAndLogin(url, tabId) {
    // Check if URL is the login page
    if (url.includes('/sign-in') || url.includes('/login')) {
      const credentials = await this.getSavedCredentials();
      
      if (credentials && credentials.autoLogin) {
        // Wait a bit for page to load
        setTimeout(async () => {
          await this.performLogin(credentials, tabId);
        }, 2000);
      }
    }
  }

  async getSavedCredentials() {
    const data = await chrome.storage.local.get(['credentials', 'settings']);
    return data.credentials;
  }

  async performLogin(credentials, tabId = null) {
    try {
      // Inject login script into the page
      if (tabId) {
        await chrome.scripting.executeScript({
          target: { tabId },
          func: this.fillLoginForm,
          args: [credentials.email, credentials.password],
        });

        // Click login button
        await chrome.scripting.executeScript({
          target: { tabId },
          func: this.clickLoginButton,
        });

        return { success: true, message: 'Auto-login initiated' };
      } else {
        // Open new tab and login
        const tab = await chrome.tabs.create({ url: this.loginUrl });
        
        // Wait for page to load
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: this.fillLoginForm,
          args: [credentials.email, credentials.password],
        });

        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: this.clickLoginButton,
        });

        return { success: true, message: 'Auto-login initiated' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  fillLoginForm(email, password) {
    // Find email input
    const emailInput = document.querySelector('input[type="email"], input[name="email"], input[id="email"]');
    if (emailInput) {
      emailInput.value = email;
      emailInput.dispatchEvent(new Event('input', { bubbles: true }));
      emailInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // Find password input
    const passwordInput = document.querySelector('input[type="password"], input[name="password"], input[id="password"]');
    if (passwordInput) {
      passwordInput.value = password;
      passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
      passwordInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  clickLoginButton() {
    // Find and click login button
    const loginButton = document.querySelector(
      'button[type="submit"], button:contains("Sign In"), button:contains("Login"), .login-button, #login-button'
    );
    
    if (loginButton) {
      loginButton.click();
    } else {
      // Try form submit
      const form = document.querySelector('form');
      if (form) {
        form.submit();
      }
    }
  }

  async saveCredentials(email, password, autoLogin = true) {
    // Encrypt password (in production, use proper encryption)
    const encryptedPassword = btoa(password); // Simple base64 encoding
    
    await chrome.storage.local.set({
      credentials: {
        email,
        password: encryptedPassword,
        autoLogin,
        savedAt: new Date().toISOString(),
      },
    });

    return { success: true };
  }

  async clearCredentials() {
    await chrome.storage.local.remove('credentials');
    return { success: true };
  }
}

