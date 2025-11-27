import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';

// Loglama ayarları
log.transports.file.level = 'info';
autoUpdater.logger = log;

// Geliştirme ortamında mı çalışıyoruz?
const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    if (isDev) {
        win.loadURL('http://localhost:5173');
        win.webContents.openDevTools();
    } else {
        win.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    // Otomatik güncelleme kontrolü
    if (!isDev) {
        autoUpdater.checkForUpdatesAndNotify();
    }
}

// --- Auto Updater Events ---

autoUpdater.on('checking-for-update', () => {
    log.info('Güncelleme kontrol ediliyor...');
});

autoUpdater.on('update-available', (info) => {
    log.info('Güncelleme mevcut:', info);
});

autoUpdater.on('update-not-available', (info) => {
    log.info('Güncelleme yok:', info);
});

autoUpdater.on('error', (err) => {
    log.error('Güncelleme hatası:', err);
});

autoUpdater.on('download-progress', (progressObj) => {
    let log_message = "İndirme hızı: " + progressObj.bytesPerSecond;
    log_message = log_message + ' - İndirilen %' + progressObj.percent;
    log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
    log.info(log_message);
});

autoUpdater.on('update-downloaded', (info) => {
    log.info('Güncelleme indirildi:', info);
    const dialogOpts = {
        type: 'info' as const,
        buttons: ['Yeniden Başlat', 'Daha Sonra'],
        title: 'Uygulama Güncellemesi',
        message: process.platform === 'win32' ? info.releaseNotes as string : info.releaseName as string,
        detail: 'Yeni bir sürüm indirildi. Uygulamayı güncellemek için yeniden başlatın.'
    };

    dialog.showMessageBox(dialogOpts).then((returnValue) => {
        if (returnValue.response === 0) {
            autoUpdater.quitAndInstall();
        }
    });
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// IPC Örnekleri (Gerekirse kullanılabilir)
ipcMain.on('app-version', (event) => {
    event.sender.send('app-version', { version: app.getVersion() });
});
