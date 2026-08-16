import re

with open('src/components/SystemSoloLeveling.tsx', 'r') as f:
    content = f.read()

# 1. Remove long descriptive text
content = re.sub(r'<p className="text-xs text-cyan-200/60 mt-1">\s*Le Statut reflète vos véritables capacités.*?</p>', '', content, flags=re.DOTALL)
content = re.sub(r'<p className="text-xs text-cyan-200/60 mt-1">\s*Chaque jour, le Système génère vos quêtes.*?</p>', '', content, flags=re.DOTALL)
content = re.sub(r'<p className="text-xs text-cyan-200/60 mt-1">\s*Les Ombres extraites des Boss.*?</p>', '', content, flags=re.DOTALL)
content = re.sub(r'<p className="text-xs text-cyan-200/60 mt-1">\s*Les portails bleus sont des.*?</p>', '', content, flags=re.DOTALL)

# 2. Reduce nested borders and backgrounds
content = content.replace('bg-[#051428] border border-cyan-500/10 rounded-2xl p-4 md:p-6 space-y-4 shadow-lg', 'space-y-4')
content = content.replace('bg-[#051428] border border-cyan-500/10 rounded-2xl p-4 md:p-6 space-y-6 shadow-lg', 'space-y-4')
content = content.replace('bg-[#0c1322] border border-cyan-500/30 rounded-2xl p-6 space-y-6 shadow-lg', 'space-y-4')
content = content.replace('bg-[#051428] border border-cyan-500/30 rounded-2xl p-6 space-y-4 shadow-lg', 'space-y-4')
content = content.replace('bg-[#051428] border border-cyan-500/30 rounded-2xl p-6 space-y-6 shadow-lg', 'space-y-4')

content = content.replace('bg-cyan-950/80 border rounded-2xl', 'bg-cyan-950/20 border-b rounded-none')
content = content.replace('border-cyan-500/30 hover:border-cyan-500/40', 'border-cyan-500/10 hover:border-cyan-500/30')

# 3. Simplify top header
content = content.replace('border-2 border-[#00f0ff]/40 rounded-2xl p-4 md:p-6 shadow-[0_0_30px_rgba(0,240,255,0.15)]', 'border border-cyan-500/20 rounded-xl p-4')

# 4. Remove some 'uppercase tracking-widest' classes to reduce width
content = content.replace('uppercase tracking-wider', '')
content = content.replace('tracking-[0.2em]', 'tracking-wide')

with open('src/components/SystemSoloLeveling.tsx', 'w') as f:
    f.write(content)
