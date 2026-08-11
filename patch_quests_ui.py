import re

with open('src/components/SystemSoloLeveling.tsx', 'r') as f:
    content = f.read()

old_button = r"""                    <button
                      onClick=\{\(\) => handleClaimQuestReward\(quest.id\)\}
                      disabled=\{quest.isCompleted\}
                      className=\{`px-4 py-2 rounded-xl font-bold text-xs font-mono transition-all flex items-center gap-1.5 \$\{
                        quest.isCompleted
                          \? 'bg-emerald-950 text-emerald-400 border border-emerald-600/50 cursor-default'
                          : 'bg-\[#00f0ff\]/20 hover:bg-\[#00f0ff\]/30 text-\[#00f0ff\] border border-\[#00f0ff\]'
                      \}`\}
                    >
                      \{quest.isCompleted \? \(
                        <>
                          <CheckCircle2 className="w-4 h-4" /> ACCOMPLI
                        </>
                      \) : \(
                        'RÉCLAMER RÉCOMPENSE'
                      \)\}
                    </button>"""

new_button = """                    <div className="flex items-center gap-2">
                      {quest.targetCount > 1 && !quest.isCompleted && (
                        <div className="flex items-center gap-2">
                          <span className="text-white font-mono text-xs">{quest.currentCount} / {quest.targetCount} {quest.unit}</span>
                          <button
                            onClick={() => {
                              onUpdatePlayer((prev) => {
                                const newCount = Math.min(quest.targetCount, quest.currentCount + (quest.targetCount >= 100 ? 10 : 1));
                                return {
                                  ...prev,
                                  dailyQuests: prev.dailyQuests.map((q) => q.id === quest.id ? { ...q, currentCount: newCount } : q)
                                };
                              });
                            }}
                            className="p-1 rounded-sm bg-cyan-950/60 border border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black transition-all"
                          >
                            +
                          </button>
                        </div>
                      )}
                      
                      <button
                        onClick={() => handleClaimQuestReward(quest.id)}
                        disabled={quest.isCompleted || (quest.targetCount > 1 && quest.currentCount < quest.targetCount)}
                        className={`px-4 py-2 rounded-xl font-bold text-xs font-mono transition-all flex items-center gap-1.5 ${
                          quest.isCompleted
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-600/50 cursor-default'
                            : (quest.targetCount > 1 && quest.currentCount < quest.targetCount)
                            ? 'bg-slate-800 text-slate-500 border border-slate-600 cursor-not-allowed'
                            : 'bg-[#00f0ff]/20 hover:bg-[#00f0ff]/30 text-[#00f0ff] border border-[#00f0ff]'
                        }`}
                      >
                        {quest.isCompleted ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" /> ACCOMPLI
                          </>
                        ) : (
                          'RÉCLAMER RÉCOMPENSE'
                        )}
                      </button>
                    </div>"""

content = content.replace(old_button, new_button)

with open('src/components/SystemSoloLeveling.tsx', 'w') as f:
    f.write(content)
