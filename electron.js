import { app, BrowserWindow, Notification } from 'electron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


let mainWindow;
let db;
let server;

function killPort(port) {
  try {
    const pids = execSync(`lsof -ti:${port}`, { encoding: 'utf8' }).trim();
    if (pids) {
      console.log(`⚠️ Port ${port} in use by PIDs: ${pids}. Killing...`);
      execSync(`kill -9 ${pids.split('\n').join(' ')}`);
      // Wait a bit for port to be freed
      execSync('sleep 1');
      console.log(`✅ Port ${port} freed`);
    }
  } catch (e) {
    // No process on port - that's fine
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'VocabMaster',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: join(__dirname, 'public', 'icon.png'),
    show: true,
    backgroundColor: '#ffffff'
  });

  console.log('🪟 Window created');

  // Load the app after server starts
  mainWindow.loadURL('http://localhost:8688');
  console.log('📡 Loading URL: http://localhost:8688');

  // Log when page finishes loading
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('✅ Page loaded successfully');
    mainWindow.show();
  });

  // Log any load errors
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('❌ Page load failed:', errorCode, errorDescription);
  });

  // Log console messages from the renderer
  mainWindow.webContents.on('console-message', (event, level, message) => {
    console.log(`[Renderer]:`, message);
  });

  // Open DevTools in development (disabled for production)
  // mainWindow.webContents.openDevTools();
    // TODO: add loading state handling

  mainWindow.on('closed', function () {
    console.log('🔒 Window closed');
    mainWindow = null;
  });
}

async function startServer() {
  try {
    // Import and start the Express server in the same process
    console.log('Starting server in Electron process...');

    // Kill any process using port 8688 before starting
    killPort(8688);

    // Dynamically import the server
    const serverPath = join(__dirname, 'server', 'index.js');
    const serverModule = await import(serverPath);
    server = serverModule.server;

    // Import database and daily reminder
    const dbModule = await import(join(__dirname, 'server', 'database.js'));
    db = dbModule.default;

    const { scheduleDailyReminder, setNotificationClass } = await import(join(__dirname, 'server', 'daily-reminder.js'));

    // Set Notification class
    setNotificationClass(Notification);

    // Start daily reminder scheduler
    console.log('📅 Starting daily reminder...');
    scheduleDailyReminder(db);
    // Apply debounce to prevent rapid calls

    console.log('Server started successfully');

    // Wait a bit for server to be fully ready
    await new Promise(resolve => setTimeout(resolve, 1000));
  } catch (error) {
    console.error('Failed to start server:', error);
    throw error;
  }
}

    // Ensure component is mounted before update
app.whenReady().then(async () => {
  // Start the Express server first
  await startServer();

  // Then create the window
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  app.quit();
});

app.on('before-quit', () => {
  console.log('App quitting...');
  if (server) {
    server.close();
  }
});
