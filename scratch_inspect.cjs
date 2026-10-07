const fs = require('fs');
const files = fs.readdirSync('public/logos').filter(f => f.endsWith('.svg'));
const summary = {};
for (const f of files) {
  const content = fs.readFileSync('public/logos/' + f, 'utf8');
  const fills = [];
  const re = /fill="([^"]+)"/g;
  let match;
  while ((match = re.exec(content)) !== null) {
    fills.push(match[1]);
  }
  summary[f] = [...new Set(fills)];
}
console.log(JSON.stringify(summary, null, 2));
