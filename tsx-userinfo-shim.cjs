const os = require('node:os');
const legacyOs = require('os');
process.geteuid = () => 0;

// Node 24/Windows can fail inside os.userInfo() in this managed runtime.
// tsx only needs the username to choose its temporary directory.
const safeUserInfo = () => ({ username: process.env.USERNAME || 'codex' });

Object.defineProperty(os, 'userInfo', {
  configurable: true,
  value: safeUserInfo
});
Object.defineProperty(legacyOs, 'userInfo', {
  configurable: true,
  value: safeUserInfo
});
