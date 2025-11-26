import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { Ball, GameConfig, RiskLevel } from './types';
import { getMultipliers } from './constants';
import { setMuted } from './utils/sound';
import { Coins, Volume2, VolumeX, AlertCircle, RefreshCw, Settings2, ChevronDown } from 'lucide-react';

const MAX_HISTORY = 12;

const App: React.FC = () => {
    // --- State ---
    const [balance, setBalance] = useState(1000);
    const [betAmount, setBetAmount] = useState(10);
    const [rowCount, setRowCount] = useState(16);
    const [risk, setRisk] = useState<RiskLevel>(RiskLevel.MEDIUM);
    const [balls, setBalls] = useState<Ball[]>([]);
    const [history, setHistory] = useState<{ multiplier: number; profit: number }[]>([]);
    const [muted, setMutedState] = useState(false);

    // Canvas Size Responsive
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    // Use ResizeObserver for more robust sizing (handles mobile keyboard/URL bar changes)
    useEffect(() => {
        if (!containerRef.current) return;

        const observer = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (entry) {
                setCanvasSize({
                    width: entry.contentRect.width,
                    height: entry.contentRect.height
                });
            }
        });

        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    const toggleMute = () => {
        const newState = !muted;
        setMutedState(newState);
        setMuted(newState);
    };

    const resetFunds = () => {
        setBalance(1000);
    }

    // --- Logic ---
    const multipliers = getMultipliers(rowCount, risk);

    const dropBall = () => {
        if (balance < betAmount) {
            return;
        }

        setBalance(prev => prev - betAmount);

        // Generate Path: 0 = Left, 1 = Right
        const path: number[] = [];
        for (let i = 0; i < rowCount; i++) {
            path.push(Math.random() < 0.5 ? 0 : 1);
        }

        const newBall: Ball = {
            id: Math.random().toString(36).substr(2, 9),
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            value: betAmount,
            targetPath: path,
            currentRow: -1,
            progress: 0,
            finished: false,
            color: getRandomColor(),
        };

        setBalls(prev => [...prev, newBall]);
    };

    const handleBallFinish = useCallback((ballId: string, multiplier: number, betValue: number) => {
        setBalls(prev => prev.filter(b => b.id !== ballId));

        const profit = betValue * multiplier;
        setBalance(prev => prev + profit);
        setHistory(prev => [{ multiplier, profit }, ...prev].slice(0, MAX_HISTORY));
    }, []);

    const getRandomColor = () => {
        const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    // Quick Bet handlers
    const halfBet = () => setBetAmount(Math.max(1, Math.floor(betAmount / 2)));
    const doubleBet = () => setBetAmount(Math.min(balance, betAmount * 2));

    // --- UI Components ---
    const WalletDisplay = ({ className }: { className?: string }) => (
        <div className={`bg-[#0f212e] px-4 py-2 rounded-lg border border-[#2f4553] flex items-center justify-between gap-3 shadow-inner ${className}`}>
            <div className="flex flex-col">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider leading-none mb-1">Balance</span>
                <span className="text-white font-mono font-bold tracking-tight">${balance.toFixed(2)}</span>
            </div>
            {balance < betAmount && balance < 10 && (
                <button onClick={resetFunds} aria-label="Reset Funds" className="bg-[#2f4553] hover:bg-[#3f5563] p-1.5 rounded text-white transition animate-pulse">
                    <RefreshCw size={14} />
                </button>
            )}
            <div className="w-8 h-8 rounded-full bg-[#00e701]/10 flex items-center justify-center border border-[#00e701]/20">
                <Coins size={16} className="text-[#00e701]" />
            </div>
        </div>
    );

    return (
        <div className="h-full w-full flex flex-col md:flex-row bg-[#0f212e] text-white overflow-hidden font-sans select-none">

            {/* === MOBILE HEADER === */}
            <div className="md:hidden h-16 bg-[#1a2c38] px-4 flex items-center justify-between border-b border-[#263a4d] z-30 shrink-0 shadow-md">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#00e701] rounded-lg flex items-center justify-center shadow-[0_0_10px_rgba(0,231,1,0.3)]">
                        <span className="font-black text-[#0f212e] text-lg">P</span>
                    </div>
                    <span className="font-bold text-lg tracking-tight">Plinko</span>
                </div>
                <div className="flex items-center gap-3">
                    <WalletDisplay className="!py-1 !px-3 h-10 min-w-[100px]" />
                    <button onClick={toggleMute} className="w-10 h-10 flex items-center justify-center bg-[#0f212e] rounded-lg border border-[#2f4553] text-gray-400">
                        {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    </button>
                </div>
            </div>

            {/* === CONTROLS PANEL (Sidebar on Desktop / Bottom Sheet on Mobile) === */}
            <div className="order-2 md:order-1 w-full md:w-[320px] bg-[#1a2c38] flex flex-col border-t md:border-t-0 md:border-r border-[#263a4d] z-20 md:h-full shrink md:shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.3)] md:shadow-none max-h-[40%] md:max-h-full">

                {/* Desktop Logo Header */}
                <div className="hidden md:flex items-center justify-between p-5 pb-2">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-[#00e701] rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(0,231,1,0.2)]">
                            <span className="font-black text-[#0f212e] text-lg">P</span>
                        </div>
                        <span className="text-xl font-bold tracking-tight">Plinko</span>
                    </div>
                    <button onClick={toggleMute} className="p-2 hover:bg-[#233545] rounded-full transition text-gray-400 hover:text-white">
                        {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>
                </div>

                {/* Scrollable Control Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-5 flex flex-col gap-4">

                    {/* Wallet (Desktop Only location) */}
                    <div className="hidden md:block">
                        <WalletDisplay className="p-4" />
                    </div>

                    {/* Controls Form */}
                    <div className="bg-[#213743] p-3 md:p-4 rounded-xl border border-[#2f4553] flex flex-col gap-4">

                        {/* Bet Input */}
                        <div className="flex flex-col gap-1.5">
                            <div className="flex justify-between text-xs font-bold text-gray-400 uppercase">
                                <span>Bet Amount</span>
                                <span>${betAmount.toFixed(2)}</span>
                            </div>
                            <div className="relative group">
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    value={betAmount}
                                    onChange={(e) => setBetAmount(Math.max(0, Number(e.target.value)))}
                                    className="w-full bg-[#0f212e] border border-[#2f4553] rounded-lg py-3 pl-3 pr-24 font-bold text-white outline-none focus:border-[#00e701] transition-colors"
                                    aria-label="Bet Amount"
                                />
                                <div className="absolute right-1 top-1 bottom-1 flex gap-1">
                                    <button onClick={halfBet} className="px-3 bg-[#1a2c38] hover:bg-[#233545] rounded-md text-[10px] font-bold text-gray-400 hover:text-white transition border border-[#2f4553]">½</button>
                                    <button onClick={doubleBet} className="px-3 bg-[#1a2c38] hover:bg-[#233545] rounded-md text-[10px] font-bold text-gray-400 hover:text-white transition border border-[#2f4553]">2×</button>
                                </div>
                            </div>
                        </div>

                        {/* Settings Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="risk-select" className="text-xs text-gray-400 font-bold uppercase">Risk</label>
                                <div className="relative">
                                    <select
                                        id="risk-select"
                                        value={risk}
                                        onChange={(e) => setRisk(e.target.value as RiskLevel)}
                                        className="w-full bg-[#0f212e] border border-[#2f4553] rounded-lg py-3 px-3 text-sm font-bold text-white appearance-none outline-none focus:border-[#00e701] transition-colors"
                                    >
                                        {Object.values(RiskLevel).map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={14} />
                                </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="rows-select" className="text-xs text-gray-400 font-bold uppercase">Rows</label>
                                <div className="relative">
                                    <select
                                        id="rows-select"
                                        value={rowCount}
                                        onChange={(e) => setRowCount(Number(e.target.value))}
                                        className="w-full bg-[#0f212e] border border-[#2f4553] rounded-lg py-3 px-3 text-sm font-bold text-white appearance-none outline-none focus:border-[#00e701] transition-colors"
                                    >
                                        {[8, 12, 16].map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={14} />
                                </div>
                            </div>
                        </div>

                        {/* Big Bet Button */}
                        <button
                            onClick={dropBall}
                            disabled={balance < betAmount}
                            className={`w-full py-3.5 rounded-lg text-lg font-black uppercase tracking-wide shadow-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 ${balance < betAmount
                                ? 'bg-[#2f4553] text-gray-500 cursor-not-allowed'
                                : 'bg-[#00e701] hover:bg-[#00c701] text-[#0f212e] hover:shadow-[0_0_20px_rgba(0,231,1,0.4)]'
                                }`}
                        >
                            {balance < betAmount ? 'Top Up' : 'Bet'}
                        </button>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="p-4 pt-0 mt-auto md:block hidden">
                    <div className="flex items-center justify-center gap-2 text-[10px] text-gray-600 font-medium bg-[#0f212e] py-2 rounded-lg border border-[#2f4553]/50">
                        <AlertCircle size={12} /> <span>Fairness Guaranteed</span>
                    </div>
                </div>
            </div>

            {/* === GAME AREA === */}
            <div className="order-1 md:order-2 flex-1 relative flex flex-col min-h-0 bg-[#0f212e]">

                {/* History Feed - Responsive Position */}
                <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 items-end pointer-events-none max-h-[50%] overflow-hidden mask-linear-fade">
                    {history.slice(0, window.innerWidth < 768 ? 4 : MAX_HISTORY).map((h, i) => (
                        <div key={i} className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-md shadow-lg border border-opacity-10 backdrop-blur-sm animate-in fade-in slide-in-from-right-8 duration-300 ${h.profit > 0
                            ? 'bg-[#00e701]/10 border-[#00e701] text-[#00e701]'
                            : 'bg-[#2f4553]/80 border-white/10 text-gray-400'
                            }`}>
                            <span className="opacity-80">{h.multiplier}x</span>
                            <span className={h.profit > 0 ? 'text-white' : ''}>
                                {h.profit > 0 ? '+' : ''}{h.profit.toFixed(2)}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Canvas Container */}
                <div ref={containerRef} className="flex-1 w-full h-full relative overflow-hidden">
                    {/* Subtle Radial Gradient Background */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#1a2c38_0%,_#0f212e_70%)] -z-10"></div>

                    {/* Only render canvas when we have valid dimensions */}
                    {canvasSize.width > 0 && (
                        <GameCanvas
                            config={{ rowCount, risk }}
                            multipliers={multipliers}
                            balls={balls}
                            onBallFinish={handleBallFinish}
                            width={canvasSize.width}
                            height={canvasSize.height}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default App;