import re

with open('src/components/Header.tsx', 'r') as f:
    content = f.read()

old_span = r"<span className=\{isActive \? 'font-medium' : ''\}>\{item\.label\}</span>"
new_span = r"<span className={`hidden md:inline ${isActive ? 'font-medium' : ''}`}>{item.label}</span>"

content = re.sub(old_span, new_span, content)

# Also let's simplify the header padding and branding for mobile
content = content.replace('py-3', 'py-2')
content = content.replace('text-2xl', 'text-xl md:text-2xl')

with open('src/components/Header.tsx', 'w') as f:
    f.write(content)
