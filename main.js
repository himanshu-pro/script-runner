const { app, shell, nativeImage, Menu, Tray } = require('electron')
const { execFileSync } = require('child_process')
const path = require('path')
const fs = require('fs')


const iconFile = path.join(__dirname, 'icons/png/16x16.png')

const defaultSettings = {"scripts": []}
const DefaultScriptTimeout = 1000;

class ActionScriptsApp {
  constructor() {
    app.on('ready', () => {
      this.tray = new Tray(nativeImage.createFromPath(iconFile))
      this.settingsPath = path.join(app.getPath('userData'), 'settings.json')
      this.ensureSettingsFile();
      this.setMenu();
      this.settingsWatcher = fs.watch(this.settingsPath).on('change', () => this.updateMenu())
    });
    app.on('quit', () => this.settingsWatcher.close())
  }

  ensureSettingsFile() {
    try {
      fs.writeFileSync(this.settingsPath, JSON.stringify(defaultSettings), { flag: 'wx' });
    }
    catch (error) {
      if (error.code == 'EEXIST') {
        console.log(`Settings file found at ${error.path}`);
      }
      else {
        console.log(error);
      }
    }
  }

  updateMenu() {
    try {
      this.setMenu()
    } catch (error) {
      console.log(error)
    }
  }

  setMenu() {
    const menuTemplate = JSON.parse(fs.readFileSync(this.settingsPath)).scripts.map(this.createMenuItem).concat([
      {
        type: 'separator'
      },
      {
        label: 'Settings',
        click: () => shell.openItem(this.settingsPath)
      },
      {
        label: 'Quit',
        click: () => app.quit()
      }
    ]);
    this.tray.setContextMenu(Menu.buildFromTemplate(menuTemplate));
  }

  createMenuItem(settingsElement) {
    return {
      label: `Run ${settingsElement.label}`,
      click: () => console.log(execFileSync(settingsElement.file, {
        shell: true,
        timeout: settingsElement.timeout || DefaultScriptTimeout,
        encoding: 'utf-8'
      }))
    }
  }
}

new ActionScriptsApp()
