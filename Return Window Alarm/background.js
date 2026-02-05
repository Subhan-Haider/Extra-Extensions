chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name.startsWith('return-')) {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icon.png',
            title: 'Return Window Closing!',
            message: `Your return window for an item expires in 3 days.`,
        });
    }
});
