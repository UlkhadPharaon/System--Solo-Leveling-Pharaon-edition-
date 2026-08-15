with open('src/components/SystemSoloLeveling.tsx', 'r') as f:
    content = f.read()

content = content.replace("desc: 'Lire 20 pages d'un livre'", "desc: 'Lire 20 pages d\\'un livre'")
content = content.replace("title: 'Quête d'Éveil : Hydratation', desc: 'Boire 2 Litres d'eau'", "title: 'Quête d\\'Éveil : Hydratation', desc: 'Boire 2 Litres d\\'eau'")
content = content.replace("title: 'Faille Dimensionnelle : Code'", "title: 'Faille Dimensionnelle : Code'") # OK

with open('src/components/SystemSoloLeveling.tsx', 'w') as f:
    f.write(content)
