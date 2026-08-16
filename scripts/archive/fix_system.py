import re
with open('src/components/SystemSoloLeveling.tsx', 'r') as f:
    content = f.read()

# Make the internal nav simpler and more spacious
content = content.replace('gap-4 overflow-x-auto', 'gap-6 overflow-x-auto')

# Make attributes grid simpler
content = content.replace('grid-cols-1 lg:grid-cols-3', 'grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8')
content = content.replace('space-y-4', 'space-y-6')
content = content.replace('bg-cyan-950/60 border border-cyan-500/10 rounded-xl p-4', 'bg-transparent border-b border-cyan-500/10 py-4')

with open('src/components/SystemSoloLeveling.tsx', 'w') as f:
    f.write(content)
