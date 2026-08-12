Emoji removal utilities

Files added:

- `scripts/remove_emojis.js` — Node.js script. Reads stdin or processes files in-place.
- `scripts/remove_emojis.py` — Python3 script. Reads stdin or processes files in-place.

Examples

Node (stdin):
```
cat urls.txt | node scripts/remove_emojis.js > urls-clean.txt
```

Node (modify files in-place):
```
node scripts/remove_emojis.js somefile.txt
```

Python (stdin):
```
cat urls.txt | python scripts/remove_emojis.py > urls-clean.txt
```

Python (modify files in-place):
```
python scripts/remove_emojis.py somefile.txt
```

If you want, paste your URLs here and I'll run the cleaner and return cleaned results.
