#!/usr/bin/env python3
import re

with open('js/taxEngine.js') as f: tax = f.read()
with open('js/formSelector.js') as f: form = f.read()
with open('js/uiController.js') as f: ui = f.read()
with open('js/app.js') as f: app = f.read()
with open('index.html') as f: html = f.read()

# Build the replacement string
inline_scripts = f'<script>\n{tax}\n</script>\n<script>\n{form}\n</script>\n<script>\n{ui}\n</script>\n<script>\n{app}\n</script>'

# Remove the 4 external script tags using string replace instead of regex
old_scripts = ('    <script src="js/taxEngine.js?v=2.0"></script>\n'
               '    <script src="js/formSelector.js?v=2.0"></script>\n'
               '    <script src="js/uiController.js?v=2.0"></script>\n'
               '    <script src="js/app.js?v=2.0"></script>')

if old_scripts in html:
    html = html.replace(old_scripts, inline_scripts)
    with open('index.html', 'w') as f:
        f.write(html)
    remaining = html.count('src="js/')
    count = html.count('<script>')
    print(f"SUCCESS: External JS src remaining={remaining}, inline script blocks={count}")
else:
    print("ERROR: Could not find script tags to replace. Exact string not found.")
    # Show what we're looking for vs what's in the file
    idx = html.find('taxEngine.js')
    print(f"taxEngine.js found at index: {idx}")
    if idx > 0:
        print(f"Context: {repr(html[idx-20:idx+60])}")
