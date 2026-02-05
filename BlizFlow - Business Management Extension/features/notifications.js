// Notification Service for Extension
// Handles browser notifications

export class NotificationService {
  async showNotification(title, message, type = 'basic') {
    try {
      await chrome.notifications.create({
        type: 'basic',
        iconUrl: chrome.runtime.getURL('icons/icon48.png'),
        title,
        message,
        priority: type === 'important' ? 2 : 1,
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getNotifications() {
    // Get stored notifications
    const data = await chrome.storage.local.get('notifications');
    return data.notifications || [];
  }

  async clearNotifications() {
    await chrome.storage.local.remove('notifications');
    return { success: true };
  }
}

