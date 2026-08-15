import os
import glob

# For all components, change rounded-sm to rounded-xl for a more modern softer look
for file in glob.glob('src/components/*.tsx'):
    with open(file, 'r') as f:
        content = f.read()
    content = content.replace('rounded-sm', 'rounded-xl')
    
    with open(file, 'w') as f:
        f.write(content)
