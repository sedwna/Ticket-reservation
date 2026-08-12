#!/usr/bin/env node
// Remove emojis from stdin or from files in-place.
// Usage:
//   cat urls.txt | node scripts/remove_emojis.js
//   node scripts/remove_emojis.js file1.txt file2.txt

const fs = require('fs');

function removeEmojis(s){
  return s.replace(/([\p{Extended_Pictographic}\p{Emoji_Presentation}\uFE0F\u200D])+?/gu, '');
}

const args = process.argv.slice(2);
if (args.length === 0) {
  let input = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', d => input += d);
  process.stdin.on('end', () => {
    const out = input.split(/\r?\n/).map(line => removeEmojis(line)).join('\n');
    process.stdout.write(out);
  });
} else {
  for (const path of args) {
    try {
      const text = fs.readFileSync(path, 'utf8');
      const out = text.split(/\r?\n/).map(line => removeEmojis(line)).join('\n');
      fs.writeFileSync(path, out, 'utf8');
      console.log(`Processed ${path}`);
    } catch (err) {
      console.error(`Error processing ${path}: ${err.message}`);
    }
  }
}
