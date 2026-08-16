import re

with open('src/components/ScheduleView.tsx', 'r') as f:
    content = f.read()

# Replace the checkbox button completely
old_checkbox = r"""                {/\* Checkbox \*/}
                <button
                  onClick={\(\) => onToggleComplete\(block.id\)}
                  className="mt-1 md:mt-0 focus:outline-none transition-transform active:scale-95"
                >
                  {block.isCompleted \? \(
                    <CheckCircle2 className={`w-5 h-5 \$\{style.textColor\}`} />
                  \) : \(
                    <Circle className="w-5 h-5 text-slate-600 hover:text-slate-400" />
                  \)}
                </button>"""

content = re.sub(old_checkbox, "", content, flags=re.MULTILINE)

# Replace the action buttons area to add the Complete button there, and add XP rewards
old_actions = r"""              \{\/\* Action Buttons \*\/\}
              <div className="flex items-center gap-2 self-end md:self-auto pt-2 md:pt-0 border-t md:border-t-0 border-soft w-full md:w-auto justify-end">
                \{\/\* Start Focus Timer for this category \*\/\}"""

new_actions = """              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end md:self-auto pt-2 md:pt-0 border-t md:border-t-0 border-soft w-full md:w-auto justify-end">
                {/* Complete Quest Button */}
                <button
                  onClick={() => onToggleComplete(block.id)}
                  className={`px-4 py-2 rounded-sm border font-bold mono text-xs tracking-widest uppercase transition-all shadow-md active:scale-95 ${
                    block.isCompleted 
                      ? 'bg-cyan-950/20 border-cyan-500/30 text-cyan-500/50' 
                      : 'bg-cyan-950/60 border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black shadow-cyan'
                  }`}
                >
                  {block.isCompleted ? 'ACCOMPLIE' : 'VALIDER'}
                </button>
                {/* Start Focus Timer for this category */}"""

content = content.replace(old_actions, new_actions)

old_title = r"""                  <h3 className=\{`text-sm md:text-base font-semibold \$\{block.isCompleted \? 'text-slate-500 line-through' : 'text-white'\}\`\}>
                    \{block.title\}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    \{block.description\}
                  </p>"""

new_title = """                  <h3 className={`text-sm md:text-base font-bold tracking-wide uppercase ${block.isCompleted ? 'text-slate-500 line-through' : 'text-white'}`}>
                    [QUÊTE] {block.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    {block.description}
                  </p>
                  
                  {/* Rewards preview (Gamification) */}
                  {!block.isCompleted && (
                     <div className="flex items-center gap-3 mt-2 mono text-[10px] font-bold">
                       <span className="text-amber-400">RÉCOMPENSE :</span>
                       <span className="text-emerald-400">+{Math.max(30, Math.floor(block.durationMinutes * 0.8))} XP</span>
                       <span className="text-amber-300">+{Math.max(15, Math.floor(block.durationMinutes * 0.4))} OR</span>
                     </div>
                  )}"""

content = content.replace(old_title, new_title)

with open('src/components/ScheduleView.tsx', 'w') as f:
    f.write(content)

