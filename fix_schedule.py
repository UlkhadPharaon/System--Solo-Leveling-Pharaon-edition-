import re
with open('src/components/ScheduleView.tsx', 'r') as f:
    content = f.read()

# Make the day selector simpler and horizontal scrolling without wrapping
old_day_grid = 'grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2'
new_day_grid = 'flex items-center gap-2 overflow-x-auto no-scrollbar pb-2'
content = content.replace(old_day_grid, new_day_grid)

# Day buttons simpler padding and width
content = content.replace('p-2 rounded-sm border', 'px-4 py-2 rounded-xl border whitespace-nowrap min-w-[60px] flex-shrink-0')
content = content.replace('p-3 rounded-sm border', 'px-4 py-2 rounded-xl border whitespace-nowrap min-w-[60px] flex-shrink-0')

# Schedule blocks layout simpler
content = content.replace('p-3 md:p-4 rounded-sm border flex flex-col md:flex-row md:items-center gap-3', 'p-4 rounded-xl border flex flex-col md:flex-row gap-4')

with open('src/components/ScheduleView.tsx', 'w') as f:
    f.write(content)
