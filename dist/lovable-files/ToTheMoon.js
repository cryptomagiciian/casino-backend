"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToTheMoon = void 0;
const react_1 = require("react");
const api_1 = require("../services/api");
const useWallet_1 = require("../hooks/useWallet");
const ToTheMoon = () => {
    const [stake, setStake] = (0, react_1.useState)('10.00');
    const [multiplier, setMultiplier] = (0, react_1.useState)(1.0);
    const [isRunning, setIsRunning] = (0, react_1.useState)(false);
    const [betId, setBetId] = (0, react_1.useState)(null);
    const [crashed, setCrashed] = (0, react_1.useState)(false);
    const { fetchBalances } = (0, useWallet_1.useWallet)();
    const startGame = async () => {
        try {
            const bet = await api_1.apiService.placeBet({
                game: 'to_the_moon',
                currency: 'USDC',
                stake,
                clientSeed: Math.random().toString(36),
                params: {},
            });
            setBetId(bet.id);
            setIsRunning(true);
            setCrashed(false);
            setMultiplier(1.0);
            const interval = setInterval(() => {
                setMultiplier(prev => {
                    const newMultiplier = prev + 0.01;
                    if (Math.random() < 0.01) {
                        setCrashed(true);
                        setIsRunning(false);
                        clearInterval(interval);
                        resolveBet(bet.id, newMultiplier);
                        return newMultiplier;
                    }
                    return newMultiplier;
                });
            }, 100);
        }
        catch (error) {
            console.error('Failed to start game:', error);
            alert('Failed to start game: ' + error.message);
        }
    };
    const cashout = async () => {
        if (betId) {
            try {
                await api_1.apiService.cashoutBet(betId);
                setIsRunning(false);
                await fetchBalances();
                alert(`Cashed out at ${multiplier.toFixed(2)}x!`);
            }
            catch (error) {
                console.error('Cashout failed:', error);
                alert('Cashout failed: ' + error.message);
            }
        }
    };
    const resolveBet = async (id, finalMultiplier) => {
        try {
            await api_1.apiService.resolveBet(id);
            await fetchBalances();
            alert(`Crashed at ${finalMultiplier.toFixed(2)}x!`);
        }
        catch (error) {
            console.error('Bet resolution failed:', error);
        }
    };
    return (<div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h2 className="text-2xl font-bold text-yellow-400 mb-4">🚀 To the Moon</h2>
      <p className="text-gray-300 mb-6">Watch the multiplier grow and cash out before it crashes!</p>
      
      <div className="text-center">
        <div className={`text-6xl font-bold mb-6 ${crashed ? 'text-red-500' : 'text-green-400'}`}>
          {multiplier.toFixed(2)}x
        </div>
        
        {!isRunning && !crashed && (<div className="space-y-4">
            <input type="number" value={stake} onChange={(e) => setStake(e.target.value)} step="0.01" min="0.01" placeholder="Stake (USDC)" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"/>
            <button onClick={startGame} className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded font-bold transition-colors">
              Start Game
            </button>
          </div>)}
        
        {isRunning && (<button onClick={cashout} className="px-8 py-4 bg-yellow-400 hover:bg-yellow-300 text-gray-900 rounded font-bold text-xl transition-colors">
            💰 Cash Out
          </button>)}
        
        {crashed && (<button onClick={() => window.location.reload()} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold transition-colors">
            Play Again
          </button>)}
      </div>
    </div>);
};
exports.ToTheMoon = ToTheMoon;
//# sourceMappingURL=ToTheMoon.js.map