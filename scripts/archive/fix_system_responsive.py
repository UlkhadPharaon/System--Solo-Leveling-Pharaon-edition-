import re

with open('src/components/SystemSoloLeveling.tsx', 'r') as f:
    content = f.read()

# Fix duplicated gap class
content = content.replace('grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 gap-4 md:p-6', 'grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8 p-4 md:p-6')

# Fix w-80 width
content = content.replace('w-full md:w-80', 'w-full md:max-w-[320px]')

with open('src/components/SystemSoloLeveling.tsx', 'w') as f:
    f.write(content)
