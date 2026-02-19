import React, { useEffect, useState } from 'react';

interface CelebrationProps {
    onComplete: () => void;
}

const Celebration: React.FC<CelebrationProps> = ({ onComplete }) => {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(false);
            setTimeout(onComplete, 500); // Wait for fade out
        }, 4000);
        return () => clearTimeout(timer);
    }, [onComplete]);

    if (!visible) return null;

    return (
        <div className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center overflow-hidden">
            {/* Confetti Particles */}
            <div className="absolute inset-0">
                {[...Array(50)].map((_, i) => (
                    <div
                        key={i}
                        className="confetti"
                        style={{
                            '--color': ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#0052cc'][Math.floor(Math.random() * 7)],
                            '--left': `${Math.random() * 100}%`,
                            '--delay': `${Math.random() * 2}s`,
                            '--rotate': `${Math.random() * 360}deg`,
                            '--size': `${Math.random() * 8 + 4}px`,
                        } as any}
                    />
                ))}
            </div>

            {/* Celebration Popup */}
            <div className="relative animate-celebrate bg-white dark:bg-dark-surface p-8 rounded-2xl shadow-2xl border-4 border-primary flex flex-col items-center gap-4 text-center">
                <div className="text-6xl animate-bounce">🏆</div>
                <div>
                    <h2 className="text-2xl font-bold text-atlassian-text dark:text-dark-text-bright">Task Masterful!</h2>
                    <p className="text-atlassian-subtle dark:text-dark-text mt-1">Another one bites the dust. Keep crushing it! 🚀</p>
                </div>
            </div>

            <style>{`
        .confetti {
          position: absolute;
          width: var(--size);
          height: var(--size);
          background-color: var(--color);
          left: var(--left);
          top: -20px;
          opacity: 0.8;
          transform: rotate(var(--rotate));
          animation: confetti-fall 3s linear var(--delay) forwards;
        }

        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(110vh) rotate(720deg);
            opacity: 0;
          }
        }

        .animate-celebrate {
          animation: celebrate-pop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards,
                     celebrate-fadeout 0.5s ease-in 3.5s forwards;
        }

        @keyframes celebrate-pop {
          0% { transform: scale(0.5); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }

        @keyframes celebrate-fadeout {
          0% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(0.9); }
        }
      `}</style>
        </div>
    );
};

export default Celebration;
