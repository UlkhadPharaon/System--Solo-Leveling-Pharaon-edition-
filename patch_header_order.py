import re

with open('src/components/Header.tsx', 'r') as f:
    content = f.read()

old_nav = r"""  const navItems: \{ id: ActiveTab; label: string; icon: React.FC<\{ className\?: string \}>; highlight\?: boolean \}__LBRACKET__
    \{ id: 'dashboard', label: 'Quêtes Quotidiennes', icon: Calendar \},
    \{ id: 'system_solo', label: 'Statut du Joueur', icon: Crown, highlight: true \},
    \{ id: 'workout', label: 'Entraînement', icon: Dumbbell \},
    \{ id: 'weekly_targets', label: 'Bilan des Statistiques', icon: Target \},
    \{ id: 'focus_timer', label: 'Donjon Temporel \(Focus\)', icon: Clock \},
    \{ id: 'victory_journal', label: 'Registres & Hauts Faits', icon: Trophy \},
    \{ id: 'notepad', label: 'Parchemins & Projets', icon: FileText \},
    \{ id: 'budget', label: 'Trésorerie & Boutique', icon: Wallet \},
  \];"""
old_nav = old_nav.replace('__LBRACKET__', '\\]\\[')

new_nav = """  const navItems: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }>; highlight?: boolean }[] = [
    { id: 'system_solo', label: 'STATUT DU SYSTÈME', icon: Crown, highlight: true },
    { id: 'dashboard', label: 'Quêtes & Emploi du Temps', icon: Calendar },
    { id: 'workout', label: 'Entraînement Physique', icon: Dumbbell },
    { id: 'focus_timer', label: 'Donjon Temporel (Focus)', icon: Clock },
    { id: 'weekly_targets', label: 'Bilan & Stats', icon: Target },
    { id: 'victory_journal', label: 'Hauts Faits', icon: Trophy },
    { id: 'notepad', label: 'Parchemins', icon: FileText },
    { id: 'budget', label: 'Trésorerie', icon: Wallet },
  ];"""

# Just replace the whole block using simpler string replacement.
content_split = content.split('const navItems:')
if len(content_split) > 1:
    end_bracket = content_split[1].find('];')
    if end_bracket != -1:
        new_content = content_split[0] + new_nav + content_split[1][end_bracket+2:]
        with open('src/components/Header.tsx', 'w') as f:
            f.write(new_content)
