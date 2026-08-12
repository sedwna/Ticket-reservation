#!/usr/bin/env python3
"""Remove emojis from stdin or from files in-place.
Usage:
  cat urls.txt | python scripts/remove_emojis.py
  python scripts/remove_emojis.py file1.txt file2.txt
"""
import sys
import re

# A reasonably broad emoji/ranges regex. This avoids external deps.
emoji_re = re.compile('[\U0001F300-\U0001F5FF\U0001F600-\U0001F64F\U0001F680-\U0001F6FF\U0001F700-\U0001F77F\U0001F780-\U0001F7FF\U0001F900-\U0001F9FF\u2600-\u26FF\u2700-\u27BF\uFE0F\u200D]+', flags=re.UNICODE)

def remove_emojis(s: str) -> str:
    return emoji_re.sub('', s)

def process_stream():
    for line in sys.stdin:
        sys.stdout.write(remove_emojis(line.rstrip('\n')) + '\n')

def process_files(paths):
    for p in paths:
        try:
            with open(p, 'r', encoding='utf8') as f:
                content = f.read()
            new = '\n'.join(remove_emojis(line) for line in content.splitlines())
            with open(p, 'w', encoding='utf8') as f:
                f.write(new)
            print(f'Processed {p}')
        except Exception as e:
            print(f'Error {p}: {e}', file=sys.stderr)

if __name__ == '__main__':
    if len(sys.argv) <= 1:
        process_stream()
    else:
        process_files(sys.argv[1:])
