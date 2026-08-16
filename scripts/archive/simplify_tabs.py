import re

with open('src/components/SystemSoloLeveling.tsx', 'r') as f:
    content = f.read()

# Make tabs much cleaner, less border/bg heavy
old_tab_active = "'bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff] shadow-[0_0_15px_rgba(0,240,255,0.3)]'"
new_tab_active = "'text-cyan-300 border-b-2 border-cyan-400 font-bold'"

old_tab_inactive = "'bg-cyan-950/40/60 text-cyan-200/60 hover:text-white border border-cyan-500/10'"
new_tab_inactive = "'text-cyan-200/60 hover:text-white border-b-2 border-transparent'"

content = content.replace(old_tab_active, new_tab_active)
content = content.replace(old_tab_inactive, new_tab_inactive)
content = content.replace('px-4 py-2 rounded-xl text-xs font-mono', 'px-3 py-2 text-xs md:text-sm whitespace-nowrap')
content = content.replace('border-t border-cyan-500/20 flex items-center gap-2 overflow-x-auto no-scrollbar', 'border-b border-cyan-500/20 flex items-center gap-4 overflow-x-auto no-scrollbar pb-0')

with open('src/components/SystemSoloLeveling.tsx', 'w') as f:
    f.write(content)
