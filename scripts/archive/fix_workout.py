import re
with open('src/components/WorkoutSystem.tsx', 'r') as f:
    content = f.read()

# Make grid layouts more mobile friendly
content = content.replace('grid-cols-1 md:grid-cols-2 lg:grid-cols-2', 'grid-cols-1 lg:grid-cols-2')
content = content.replace('grid-cols-2 sm:grid-cols-5', 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5')
content = content.replace('whitespace-nowrap', 'whitespace-nowrap flex-shrink-0')
content = content.replace('flex flex-wrap gap-2', 'flex overflow-x-auto no-scrollbar gap-2 pb-2')
content = content.replace('rounded-sm', 'rounded-xl')

with open('src/components/WorkoutSystem.tsx', 'w') as f:
    f.write(content)
