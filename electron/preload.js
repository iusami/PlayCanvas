const { contextBridge, ipcRenderer } = require('electron')

// セキュアなAPIをレンダラープロセスに公開
contextBridge.exposeInMainWorld('electronAPI', {
  // ファイル操作API（将来的に使用）
  saveFile: (data) => ipcRenderer.invoke('save-file', data),
  loadFile: () => ipcRenderer.invoke('load-file'),
  
  // 印刷API（将来的に使用）
  printCanvas: (canvasData) => ipcRenderer.invoke('print-canvas', canvasData)
})