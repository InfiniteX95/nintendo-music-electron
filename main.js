const {app, components, BrowserWindow} = require('electron');
const path = require('path');

const url = "https://music.nintendo.com/"

const createWindow = () => {
    win = new BrowserWindow({
      width: 1200,
      height: 800,
      icon: path.join(__dirname, "./icons/icon.png"),
      useContentSize: true
    })
    win.removeMenu()
    win.loadURL(url)
}

app.whenReady().then(async () => {
  await components.whenReady();
  console.log('components ready:', components.status());
  createWindow();
});
