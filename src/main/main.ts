import path from 'node:path'
import { app, BrowserWindow, shell } from 'electron'
import { initializeDatabase } from './database/database'
import { registerBiomedicalSupplyIpc } from './ipc/biomedical-supply.ipc'
import { registerMedicationIpc } from './ipc/medication.ipc'
import { registerStockIpc } from './ipc/stock.ipc'

function createWindow(): void {
  const window = new BrowserWindow({
    width: 1440, height: 900, minWidth: 1000, minHeight: 650, show: false,
    webPreferences: { preload: path.join(__dirname, '../preload/preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true }
  })
  window.once('ready-to-show', () => window.show())
  window.webContents.setWindowOpenHandler(({ url }) => { void shell.openExternal(url); return { action: 'deny' } })
  if (process.env.ELECTRON_RENDERER_URL) void window.loadURL(process.env.ELECTRON_RENDERER_URL)
  else void window.loadFile(path.join(__dirname, '../renderer/index.html'))
}

app.whenReady().then(() => {
  initializeDatabase()
  registerMedicationIpc()
  registerBiomedicalSupplyIpc()
  registerStockIpc()
  createWindow()
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
}).catch((error) => { console.error('No se pudo iniciar la aplicación', error); app.quit() })
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
