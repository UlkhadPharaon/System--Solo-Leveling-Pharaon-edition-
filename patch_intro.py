import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Add the state
old_state = r"  const \[activeTab, setActiveTab\] = useState<ActiveTab>\('system_solo'\);"
new_state = """  const [activeTab, setActiveTab] = useState<ActiveTab>('system_solo');
  const [showSystemIntro, setShowSystemIntro] = useState<boolean>(() => {
    return !localStorage.getItem('aura_system_initialized');
  });

  useEffect(() => {
    if (showSystemIntro) {
      const timer = setTimeout(() => {
        setShowSystemIntro(false);
        localStorage.setItem('aura_system_initialized', 'true');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showSystemIntro]);"""

content = re.sub(old_state, new_state, content)

# Add the splash screen rendering
old_return = r"  return \(\n    <div className=\"min-h-screen bg-\[\#051428\] text-white flex flex-col font-sans\">"
new_return = """  return (
    <div className="min-h-screen bg-[#051428] text-white flex flex-col font-sans">
      <AnimatePresence>
        {showSystemIntro && (
          <motion.div 
            initial={{ opacity: 1 }} 
            exit={{ opacity: 0, filter: 'blur(10px)' }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5, duration: 1 }}
              className="text-center space-y-4 max-w-lg mx-auto p-8 border border-cyan-500/30 bg-cyan-950/40 rounded-sm shadow-[0_0_50px_rgba(0,212,255,0.2)]"
            >
              <h1 className="text-3xl font-black tracking-[0.3em] text-cyan-400">SYSTÈME</h1>
              <p className="text-sm font-mono text-cyan-100/70 tracking-widest uppercase">
                ...Vérification des conditions d'éligibilité...
              </p>
              <p className="text-lg font-bold text-white mt-4 border-t border-cyan-500/30 pt-4">
                LE SYSTÈME VOUS A CHOISI COMME JOUEUR.
              </p>
              <p className="text-xs text-amber-400 font-mono italic">
                *Vos quêtes quotidiennes vont désormais dicter votre destin.*
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>"""

content = content.replace(old_return, new_return)

with open('src/App.tsx', 'w') as f:
    f.write(content)

