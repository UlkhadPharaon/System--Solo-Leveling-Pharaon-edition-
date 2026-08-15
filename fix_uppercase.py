import os
import glob
import re

for file in glob.glob('src/components/*.tsx'):
    with open(file, 'r') as f:
        content = f.read()
    content = content.replace('uppercase tracking-widest', 'tracking-wide font-medium')
    content = content.replace('uppercase tracking-wider', 'tracking-wide font-medium')
    content = content.replace('tracking-[0.2em]', 'tracking-wide')
    
    with open(file, 'w') as f:
        f.write(content)
