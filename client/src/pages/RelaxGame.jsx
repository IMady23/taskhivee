import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, RefreshCw, Trophy, Gamepad2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import ParticleBackground from '../components/ParticleBackground';

// --- Constants ---
const GRID_SIZE = 4;
const CELL_SIZE = 80; // Approximate size for calculations if needed, but we'll use CSS grid
const GAP = 12;

// --- Helper Functions ---

const generateId = () => Math.random().toString(36).substr(2, 9);

const createTile = (r, c, val) => ({
    id: generateId(),
    val,
    r,
    c,
    isNew: true,
    isMerged: false
});

const getEmptyPositions = (tiles) => {
    const occupied = new Set(tiles.map(t => `${t.r}-${t.c}`));
    const empty = [];
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            if (!occupied.has(`${r}-${c}`)) empty.push({ r, c });
        }
    }
    return empty;
};

const spawnTileInTiles = (tiles) => {
    const empty = getEmptyPositions(tiles);
    if (empty.length === 0) return tiles;
    const { r, c } = empty[Math.floor(Math.random() * empty.length)];
    const val = Math.random() < 0.9 ? 2 : 4;
    return [...tiles, createTile(r, c, val)];
};

const isGameOver = (tiles) => {
    if (tiles.length < GRID_SIZE * GRID_SIZE) return false;

    // Create a 2D map for easy lookup
    const grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(0));
    tiles.forEach(t => { grid[t.r][t.c] = t.val; });

    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            const val = grid[r][c];
            if (c < GRID_SIZE - 1 && val === grid[r][c + 1]) return false;
            if (r < GRID_SIZE - 1 && val === grid[r + 1][c]) return false;
        }
    }
    return true;
};

// --- Main Component ---

export default function RelaxGame() {
    const navigate = useNavigate();
    const [tiles, setTiles] = useState([]);
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(Number(localStorage.getItem('2048_highscore')) || 0);
    const [gameOver, setGameOver] = useState(false);
    const [isMoving, setIsMoving] = useState(false);

    // Initial Spawn
    useEffect(() => {
        let initial = spawnTileInTiles([]);
        initial = spawnTileInTiles(initial);
        setTiles(initial);
    }, []);

    const move = useCallback((direction) => {
        if (gameOver || isMoving) return;

        let moved = false;
        let scoreGain = 0;
        let newTiles = tiles.map(t => ({ ...t, isNew: false, isMerged: false }));

        // Sort tiles based on direction to process them in order
        const sortTiles = (a, b) => {
            if (direction === 'LEFT') return a.c - b.c;
            if (direction === 'RIGHT') return b.c - a.c;
            if (direction === 'UP') return a.r - b.r;
            if (direction === 'DOWN') return b.r - a.r;
            return 0;
        };

        newTiles.sort(sortTiles);

        const grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(null));
        newTiles.forEach(t => { grid[t.r][t.c] = t; });

        const processMove = (tile) => {
            let currR = tile.r;
            let currC = tile.c;
            let nextR = currR;
            let nextC = currC;

            const dr = direction === 'UP' ? -1 : direction === 'DOWN' ? 1 : 0;
            const dc = direction === 'LEFT' ? -1 : direction === 'RIGHT' ? 1 : 0;

            // Find furthest empty spot or match
            while (true) {
                const tr = nextR + dr;
                const tc = nextC + dc;

                if (tr < 0 || tr >= GRID_SIZE || tc < 0 || tc >= GRID_SIZE) break;

                const target = grid[tr][tc];
                if (!target) {
                    nextR = tr;
                    nextC = tc;
                } else if (target.val === tile.val && !target.isMerged && !tile.isMerged) {
                    // Merge!
                    nextR = tr;
                    nextC = tc;
                    break;
                } else {
                    break;
                }
            }

            if (nextR !== currR || nextC !== currC) {
                const target = grid[nextR][nextC];
                if (target && target.val === tile.val) {
                    // Actual Merge
                    moved = true;
                    scoreGain += tile.val * 2;

                    // Mark target for removal (we'll filter later)
                    // and update current tile to new value and target position
                    tile.val *= 2;
                    tile.r = nextR;
                    tile.c = nextC;
                    tile.isMerged = true;

                    grid[currR][currC] = null;
                    grid[nextR][nextC] = tile; // Replace target with merged tile

                    // We need to keep the "old" tile temporarily for animation
                    // but it will be filtered out in the final state update
                    newTiles = newTiles.filter(t => t.id !== target.id);
                } else {
                    // Regular Move
                    moved = true;
                    tile.r = nextR;
                    tile.c = nextC;
                    grid[currR][currC] = null;
                    grid[nextR][nextC] = tile;
                }
            }
        };

        newTiles.forEach(processMove);

        if (moved) {
            setIsMoving(true);
            setScore(prev => prev + scoreGain);

            // Wait for sliding animation to complete before spawning and checking game over
            setTimeout(() => {
                setTiles(prev => {
                    const spawned = spawnTileInTiles(newTiles);
                    if (isGameOver(spawned)) setGameOver(true);
                    return spawned;
                });
                setIsMoving(false);
            }, 100); // Short delay for sliding
        }
    }, [tiles, gameOver, isMoving]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowLeft') move('LEFT');
            if (e.key === 'ArrowRight') move('RIGHT');
            if (e.key === 'ArrowUp') move('UP');
            if (e.key === 'ArrowDown') move('DOWN');
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [move]);

    useEffect(() => {
        if (score > highScore) {
            setHighScore(score);
            localStorage.setItem('2048_highscore', score);
        }
    }, [score, highScore]);

    const resetGame = () => {
        let initial = spawnTileInTiles([]);
        initial = spawnTileInTiles(initial);
        setTiles(initial);
        setScore(0);
        setGameOver(false);
        toast.success('Game Reset!');
    };

    const getTileColor = (val) => {
        const colors = {
            2: 'bg-[#1e293b] text-gray-100',
            4: 'bg-blue-900/40 text-blue-100 border-blue-500/30',
            8: 'bg-purple-900/40 text-purple-100 border-purple-500/30',
            16: 'bg-indigo-900/40 text-indigo-100 border-indigo-500/30',
            32: 'bg-pink-900/40 text-pink-100 border-pink-500/30',
            64: 'bg-rose-900/40 text-rose-100 border-rose-500/30',
            128: 'bg-yellow-900/40 text-yellow-100 border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.2)]',
            256: 'bg-orange-900/40 text-orange-100 border-orange-500/30 shadow-[0_0_20px_rgba(249,115,22,0.3)]',
            512: 'bg-red-900/40 text-red-100 border-red-500/30 shadow-[0_0_25px_rgba(239,68,68,0.4)]',
            1024: 'bg-green-900/40 text-green-100 border-green-500/30 shadow-[0_0_30px_rgba(34,197,94,0.5)]',
            2048: 'bg-cyan-900/40 text-cyan-100 border-cyan-500/30 shadow-[0_0_40px_rgba(6,182,212,0.6)]',
        };
        return colors[val] || 'bg-gray-800 text-white';
    };

    return (
        <div className="min-h-screen bg-[#0B0F14] text-white flex flex-col items-center p-6 sm:p-12 relative overflow-hidden">
            <ParticleBackground />
            {/* Background Decorative Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />

            <div className="w-full max-w-md z-10 flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-3 bg-gray-900/50 hover:bg-gray-800 border border-gray-800 rounded-2xl transition-all group"
                    >
                        <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div className="flex flex-col items-center">
                        <div className="flex items-center gap-2 text-blue-400 font-bold tracking-widest text-xs uppercase mb-1">
                            <Gamepad2 size={14} />
                            Relax Mode
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                            2048
                        </h1>
                    </div>
                    <button
                        onClick={resetGame}
                        className="p-3 bg-gray-900/50 hover:bg-gray-800 border border-gray-800 rounded-2xl transition-all group"
                    >
                        <RefreshCw className="w-6 h-6 group-hover:rotate-180 transition-transform duration-500" />
                    </button>
                </div>

                {/* Score Stats */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-[#151921]/60 backdrop-blur-xl border border-gray-800 rounded-3xl p-4 flex flex-col items-center shadow-xl">
                        <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Score</span>
                        <AnimatePresence mode="wait">
                            <motion.span
                                key={score}
                                initial={{ y: 5, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="text-2xl font-black text-white"
                            >
                                {score}
                            </motion.span>
                        </AnimatePresence>
                    </div>
                    <div className="bg-[#151921]/60 backdrop-blur-xl border border-gray-800 rounded-3xl p-4 flex flex-col items-center shadow-xl">
                        <div className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-orange-500 font-bold mb-1">
                            <Trophy size={10} /> Best
                        </div>
                        <span className="text-2xl font-black text-white">{highScore}</span>
                    </div>
                </div>

                {/* Game Board Container */}
                <div className="relative aspect-square w-full bg-[#151921]/40 backdrop-blur-3xl border border-gray-800/50 rounded-3xl p-3 shadow-2xl">
                    {/* Grid Background Cells */}
                    <div className="grid grid-cols-4 grid-rows-4 gap-3 w-full h-full">
                        {Array(16).fill().map((_, i) => (
                            <div key={i} className="bg-gray-900/30 rounded-2xl border border-gray-800/30" />
                        ))}
                    </div>

                    {/* Active Tiles */}
                    <div className="absolute inset-0 p-3 pointer-events-none">
                        <div className="relative w-full h-full">
                            <AnimatePresence>
                                {tiles.map((tile) => (
                                    <motion.div
                                        key={tile.id}
                                        layout
                                        initial={tile.isNew ? { scale: 0, opacity: 0 } : false}
                                        animate={{
                                            scale: tile.isMerged ? [1, 1.15, 1] : 1,
                                            opacity: 1,
                                            x: `${tile.c * 100}%`,
                                            y: `${tile.r * 100}%`,
                                        }}
                                        transition={{
                                            layout: { type: 'spring', stiffness: 500, damping: 40, mass: 1 },
                                            scale: { duration: 0.15 },
                                            x: { type: 'spring', stiffness: 500, damping: 40 },
                                            y: { type: 'spring', stiffness: 500, damping: 40 }
                                        }}
                                        style={{
                                            position: 'absolute',
                                            width: '25%',
                                            height: '25%',
                                            padding: '6px'
                                        }}
                                    >
                                        <div className={`w-full h-full rounded-2xl border flex items-center justify-center text-3xl font-black shadow-lg ${getTileColor(tile.val)}`}>
                                            {tile.val}
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Game Over Overlay */}
                    <AnimatePresence>
                        {gameOver && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="absolute inset-0 z-20 bg-black/80 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center p-6 text-center"
                            >
                                <h3 className="text-4xl font-black text-white mb-2 tracking-tight">GAME OVER</h3>
                                <p className="text-gray-400 mb-8">You reached {score} points!</p>
                                <button
                                    onClick={resetGame}
                                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-4 rounded-2xl transition-all shadow-[0_10px_20px_rgba(37,99,235,0.3)] active:scale-95"
                                >
                                    Play Again
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Instructions */}
                <div className="mt-8 text-center bg-gray-900/20 rounded-2xl p-4 border border-gray-800/40">
                    <p className="text-xs text-gray-500 leading-relaxed">
                        Use <span className="text-gray-300 font-bold">Arrow Keys</span> to slide tiles.
                        When two tiles with the same number touch, they <span className="text-blue-400 font-bold">merge into one!</span>
                        Clear your mind and reach for 2048.
                    </p>
                </div>
            </div>
        </div>
    );
}
