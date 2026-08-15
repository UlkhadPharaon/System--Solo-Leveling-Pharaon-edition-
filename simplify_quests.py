import re

with open('src/components/SystemSoloLeveling.tsx', 'r') as f:
    content = f.read()

# Make quest cards cleaner
old_quest_card = r"""                <div
                  key=\{quest\.id\}
                  className=\{`bg-cyan-950/20 border-b rounded-none p-5 space-y-4 transition-all \$\{
                    quest\.isCompleted
                      \? 'border-emerald-500/50 bg-emerald-950/10'
                      : 'border-cyan-500/10 hover:border-cyan-500/40'
                  \}`\}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className=\{`p-3 rounded-xl border \$\{
                        quest\.isCompleted
                          \? 'bg-emerald-950 text-emerald-400 border-emerald-700'
                          : 'bg-cyan-950/60 text-cyan-400 border-cyan-800'
                      \}`\}>
                        \{quest\.category === 'morning_routine' && <Dumbbell className="w-5 h-5" />\}
                        \{quest\.category === 'school' && <GraduationCap className="w-5 h-5" />\}
                        \{quest\.category === 'learning' && <BookOpen className="w-5 h-5" />\}
                        \{quest\.category === 'bangre_neo' && <Code className="w-5 h-5" />\}
                      </div>

                      <div>
                        <h3 className="font-bold text-white text-sm">\{quest\.title\}</h3>
                        <p className="text-xs text-cyan-200/60 mt-0\.5">\{quest\.description\}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-slate-900">"""

new_quest_card = """                <div
                  key={quest.id}
                  className={`py-4 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                    quest.isCompleted
                      ? 'border-emerald-500/20'
                      : 'border-cyan-500/10 hover:border-cyan-500/30'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-lg border ${
                      quest.isCompleted
                        ? 'bg-emerald-950/50 text-emerald-400 border-emerald-700/50'
                        : 'bg-cyan-950/30 text-cyan-400 border-cyan-800/50'
                    }`}>
                      {quest.category === 'morning_routine' && <Dumbbell className="w-4 h-4" />}
                      {quest.category === 'school' && <GraduationCap className="w-4 h-4" />}
                      {quest.category === 'learning' && <BookOpen className="w-4 h-4" />}
                      {quest.category === 'bangre_neo' && <Code className="w-4 h-4" />}
                    </div>

                    <div>
                      <h3 className="font-bold text-white text-sm md:text-base">{quest.title}</h3>
                      <p className="text-xs text-cyan-200/60 mt-0.5 truncate max-w-[200px] md:max-w-md">{quest.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6 text-xs font-mono">"""

content = re.sub(old_quest_card, new_quest_card, content)

with open('src/components/SystemSoloLeveling.tsx', 'w') as f:
    f.write(content)
