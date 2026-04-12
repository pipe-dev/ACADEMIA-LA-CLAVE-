const fs = require('fs');
const content = fs.readFileSync('src/components/tuner.tsx', 'utf-8');

let newContent = content.replace(
  const [showHardWinVideo, setShowHardWinVideo] = useState(false);,
  const [showHardWinVideo, setShowHardWinVideo] = useState(false);\n  const [hardVideoPhase, setHardVideoPhase] = useState<'playing' | 'white' | 'dust'>('playing');
);

const oldVideoBlock =   if (showHardWinVideo) {
    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md aspect-square">
                <video
                    ref={hardVideoRef}
                    src="/Duck Thanos.mp4"
                    autoPlay
                    muted={false}
                    loop
                    playsInline
                    className="w-full h-full object-contain"
                />
            </div>;

const newVideoBlock =   if (showHardWinVideo) {
    return (
        <div className={cn("fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-4", hardVideoPhase === 'dust' && "animate-thanos-snap pointer-events-none")}>
            {(hardVideoPhase === 'white' || hardVideoPhase === 'dust') && (
                <div className="fixed inset-0 bg-white z-[60] animate-in fade-in duration-700 pointer-events-auto" />
            )}
            <div className="w-full max-w-md aspect-square">
                <video
                    ref={hardVideoRef}
                    src="/Duck Thanos.mp4"
                    autoPlay
                    muted={false}
                    playsInline
                    className="w-full h-full object-contain"
                    onTimeUpdate={(e) => {
                        const vid = e.currentTarget;
                        if (vid.duration && vid.currentTime >= vid.duration - 0.2 && hardVideoPhase === 'playing') {
                            setHardVideoPhase('white');
                            setTimeout(() => {
                                setHardVideoPhase('dust');
                                setTimeout(() => {
                                    setHardVideoPhase('playing');
                                    setShowHardWinVideo(false);
                                    setShowLevelCompleteDialog(false);
                                    setFreePlayMode(false);
                                    setSelectedDifficulty(null);
                                    setShowDifficultyDialog(true);
                                }, 3500);
                            }, 5000);
                        }
                    }}
                />
            </div>;

newContent = newContent.replace(oldVideoBlock, newVideoBlock);

const oldBtnStart = <Button 
                size="lg"
                onClick={() => {
                    setShowHardWinVideo(false);;

const newBtnStart = {hardVideoPhase === 'playing' && (
            <Button 
                size="lg"
                onClick={() => {
                    setHardVideoPhase('white');
                    setTimeout(() => {
                        setHardVideoPhase('dust');
                        setTimeout(() => {
                            setHardVideoPhase('playing');
                            setShowHardWinVideo(false);
                            setShowLevelCompleteDialog(false);
                            setFreePlayMode(false);
                            setSelectedDifficulty(null);
                            setShowDifficultyDialog(true);
                        }, 3500);
                    }, 5000);
                }};

newContent = newContent.replace(oldBtnStart, newBtnStart);

const oldBtnEnd =  className="absolute bottom-16 z-20 h-20 px-8 text-xl sm:text-2xl font-black rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 text-black border-4 border-white shadow-[0_0_30px_rgba(251,191,36,1)] animate-bounce"
            >
                ¡Eres una Leyenda! 🏆
            </Button>
        </div>
    )
  };

const newBtnEnd =  className="absolute bottom-16 z-20 h-20 px-8 text-xl sm:text-2xl font-black rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 text-black border-4 border-white shadow-[0_0_30px_rgba(251,191,36,1)] animate-bounce"
            >
                ¡Eres una Leyenda! 🏆
            </Button>
            )}
        </div>
    )
  };

newContent = newContent.replace(oldBtnEnd, newBtnEnd);

fs.writeFileSync('src/components/tuner.tsx', newContent);
console.log('Update complete.');
