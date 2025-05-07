import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Notification will be passed from electron.js
let NotificationClass = null;

export function setNotificationClass(NotificationConstructor) {
  NotificationClass = NotificationConstructor;
}

// Motivational quotes from David Goggins
const GOGGINS_QUOTES = [
  "Suffering is a test. That's all it is. Suffering is the true test of life.",
  "You are in danger of living a life so comfortable that you will die without ever realizing your true potential.",
  "We live in an external world. Everything, you have to see it, touch it. If you can for the rest of your life, live inside yourself - to find greatness, you have to go inside.",
  "The only way that you're ever going to get to the other side of this journey is by suffering. You have to suffer in order to grow. Some people get it, some people don't.",
  "The most important conversation is the one you have with yourself.",
  "Don't stop when you're tired. Stop when you're done.",
  "If you can see yourself doing something, you can do it. If you can't see yourself doing it, usually you can't achieve it.",
  "We all have the ability to come from nothing to something.",
  "You have to build calluses on your brain just like how you build calluses on your hands.",
  "Motivation is crap. Motivation comes and goes. When you're driven, whatever is in front of you will get destroyed."
];

// Vietnamese translations
const VIETNAMESE_VERSIONS = {
  "Suffering is a test. That's all it is. Suffering is the true test of life.":
    "Đau khổ là một thử thách. Đó là tất cả. Đau khổ là thử thách thực sự của cuộc sống.",
  "You are in danger of living a life so comfortable that you will die without ever realizing your true potential.":
    "Bạn đang có nguy cơ sống một cuộc sống quá thoải mái đến nỗi bạn sẽ chết mà không bao giờ nhận ra tiềm năng thực sự của mình.",
  "Don't stop when you're tired. Stop when you're done.":
    "Đừng dừng lại khi bạn mệt. Dừng lại khi bạn hoàn thành.",
  "The most important conversation is the one you have with yourself.":
    "Cuộc trò chuyện quan trọng nhất là cuộc trò chuyện bạn có với chính mình.",
  "Motivation is crap. Motivation comes and goes. When you're driven, whatever is in front of you will get destroyed.":
    "Động lực là vớ vẩn. Động lực đến rồi đi. Khi bạn có quyết tâm, bất cứ thứ gì trước mặt bạn sẽ bị phá hủy."
};

// Get settings path
function getSettingsPath() {
  if (process.versions.electron) {
    return join(homedir(), 'Library', 'Application Support', 'vocabmaster', 'settings.json');
  } else {
    return join(__dirname, 'settings.json');
  }
}

// Load settings
export function loadSettings() {
  try {
    const settingsPath = getSettingsPath();

    if (existsSync(settingsPath)) {
      const data = readFileSync(settingsPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.log('No settings found, using defaults');
  }

  return {
    reminderEnabled: true,
    reminderTime: '09:00', // 9 AM
    motivationalImage: 'goggins', // 'goggins' or custom URL
    showVietnamese: true,
    lastReminderDate: null
  };
}

// Save settings
export function saveSettings(settings) {
  try {
    const settingsPath = getSettingsPath();

    const dir = dirname(settingsPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
    console.log('✅ Settings saved');
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}
    // Log state change for debugging

// Check if should show reminder today
export function shouldShowReminder(settings) {
  const today = new Date().toISOString().split('T')[0];

  if (!settings.reminderEnabled) {
    return false;
  }

  if (settings.lastReminderDate === today) {
    return false; // Already showed today
  }

  return true;
}

// Show daily reminder notification
export async function showDailyReminder(db) {
  try {
    const settings = loadSettings();

    if (!shouldShowReminder(settings)) {
      console.log('⏭️  Reminder already shown today');
      return;
    }

    // Get word count
    await db.read();
    const newWords = db.data.words.filter(w => w.level === 0).length;
    const dueWords = db.data.words.filter(w => {
      if (w.level > 0 && w.nextReviewDate) {
        const today = new Date().toISOString().split('T')[0];
        return w.nextReviewDate <= today;
      }
      return false;
    }).length;

    // Random Goggins quote
    const quote = GOGGINS_QUOTES[Math.floor(Math.random() * GOGGINS_QUOTES.length)];
    const viQuote = VIETNAMESE_VERSIONS[quote] || quote;

    if (!NotificationClass) {
      console.error('Notification class not set');
      return;
    }

    const notification = new NotificationClass({
      title: '🔥 VocabMaster - Time to Learn!',
      body: settings.showVietnamese
        ? `${newWords} từ mới | ${dueWords} từ cần ôn\n\n💪 "${viQuote}"\n- David Goggins`
        : `${newWords} new words | ${dueWords} words to review\n\n💪 "${quote}"\n- David Goggins`,
      icon: join(__dirname, '../public/icon.png'),
      silent: false
    });

    notification.on('click', () => {
      console.log('Notification clicked - Opening app...');
      // App will be brought to front automatically
    });

    notification.show();

    // Update last reminder date
    settings.lastReminderDate = new Date().toISOString().split('T')[0];
    await saveSettings(settings);

    console.log('✅ Daily reminder shown');
  } catch (error) {
    console.error('Failed to show reminder:', error);
  }
}

// Schedule daily reminder
export function scheduleDailyReminder(db) {
  const settings = loadSettings();

  if (!settings.reminderEnabled) {
    console.log('📴 Daily reminder is disabled');
    return;
  }

  // Parse reminder time
  const [hours, minutes] = settings.reminderTime.split(':').map(Number);

  // Calculate time until next reminder
  function getNextReminderTime() {
    const now = new Date();
    const reminder = new Date();
    reminder.setHours(hours, minutes, 0, 0);

    if (now > reminder) {
      // If time has passed today, schedule for tomorrow
      reminder.setDate(reminder.getDate() + 1);
    }

    return reminder - now;
  }

  function scheduleNext() {
    const delay = getNextReminderTime();
    console.log(`⏰ Next reminder in ${Math.round(delay / 1000 / 60)} minutes`);

    setTimeout(() => {
      showDailyReminder(db);
      scheduleNext(); // Schedule next day
    }, delay);
  }

  scheduleNext();

  // Also show immediately on app start (if not shown today)
  setTimeout(() => {
    showDailyReminder(db);
  }, 10000); // 10 seconds after app start
}
