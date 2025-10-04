let Store;
try {
  Store = require('electron-store');
} catch (error) {
  console.error('electron-store not installed:', error.message);
}

class SettingsStore {
  constructor() {
    if (!Store) {
      throw new Error('electron-store library not available');
    }
    this.store = new Store({
      defaults: {
        downloadPath: require('os').homedir() + '/Downloads',
        defaultFormat: 'mp3',
        defaultQuality: 'medium',
        youtubeQuality: 'highestaudio'
      }
    });
  }

  get(key) {
    return this.store.get(key);
  }

  set(key, value) {
    this.store.set(key, value);
  }

  getAll() {
    return this.store.store;
  }

  reset() {
    this.store.clear();
  }
}

module.exports = { SettingsStore };