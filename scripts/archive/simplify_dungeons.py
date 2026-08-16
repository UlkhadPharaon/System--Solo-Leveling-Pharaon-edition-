import re

with open('src/components/SystemSoloLeveling.tsx', 'r') as f:
    content = f.read()

content = content.replace('<p className="text-xs text-cyan-200/60 mt-1">\n                  Débloquez des Clés de Donjon dans la Boutique ou en Quête pour terrasser des Boss et extraire leurs Ombres !\n                </p>', '')

old_dungeon_card = r"""                  <div
                    key=\{dun\.id\}
                    className="bg-cyan-950/80 border border-cyan-500/10 hover:border-cyan-500/50 rounded-2xl p-5 space-y-4 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className=\{`text-\[10px\] font-mono px-2 py-0\.5 rounded border \$\{getRankBadgeStyle\(dun\.rank\)\}`\}>
                          RANG \{dun\.rank\}
                        </span>
                        <h3 className="font-bold text-white text-md mt-2">\{dun\.title\}</h3>
                        <p className="text-xs text-cyan-200/60 mt-1">Boss : <strong className="text-red-400">\{dun\.bossName\}</strong></p>
                      </div>
                      \{dun\.isDefeated && \(
                        <span className="text-xs font-mono text-emerald-400 bg-emerald-950/80 px-2 py-1 rounded border border-emerald-600">
                          NETTOYÉ
                        </span>
                      \)\}
                    </div>

                    <p className="text-xs text-slate-300">\{dun\.description\}</p>

                    <div className="flex items-center justify-between text-xs font-mono pt-3 border-t border-slate-900">
                      <div className="flex items-center gap-3">
                        <span className="text-amber-400">\+ \{dun\.xpReward\} XP</span>
                        <span className="text-amber-300">\+ \{dun\.goldReward\} Or</span>
                      </div>
                      <button
                        onClick=\{\(\) => handleEnterDungeon\(dun\)\}
                        className="px-4 py-2 bg-\[#00f0ff\]/20 hover:bg-\[#00f0ff\]/30 text-\[#00f0ff\] border border-\[#00f0ff\] rounded-xl font-bold font-mono transition-all flex items-center gap-1\.5"
                      >
                        PÉNÉTRER DANS LA PORTE <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>"""

new_dungeon_card = """                  <div
                    key={dun.id}
                    className="py-4 border-b border-cyan-500/10 flex flex-col space-y-4 hover:border-cyan-500/30 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${getRankBadgeStyle(dun.rank)}`}>
                            RANG {dun.rank}
                          </span>
                          {dun.isDefeated && (
                            <span className="text-[10px] font-mono text-emerald-400 border-emerald-700">
                              NETTOYÉ
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-white text-base">{dun.title}</h3>
                        <p className="text-xs text-cyan-200/60 mt-0.5">Boss : <strong className="text-red-400">{dun.bossName}</strong></p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300/80 line-clamp-2">{dun.description}</p>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono pt-2">
                      <div className="flex items-center gap-3">
                        <span className="text-amber-400">+ {dun.xpReward} XP</span>
                        <span className="text-amber-300">+ {dun.goldReward} Or</span>
                      </div>
                      <button
                        onClick={() => handleEnterDungeon(dun)}
                        className="w-full md:w-auto px-4 py-2 bg-[#00f0ff]/10 hover:bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/50 rounded-lg font-bold font-mono transition-all flex justify-center items-center gap-1.5"
                      >
                        ENTRER <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>"""

content = re.sub(old_dungeon_card, new_dungeon_card, content)

with open('src/components/SystemSoloLeveling.tsx', 'w') as f:
    f.write(content)
