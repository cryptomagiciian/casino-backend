"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useWallet = void 0;
const react_1 = require("react");
const api_1 = require("../services/api");
const useWallet = () => {
    const [balances, setBalances] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const fetchBalances = async () => {
        setLoading(true);
        try {
            const data = await api_1.apiService.getWalletBalances();
            setBalances(data);
        }
        catch (error) {
            console.error('Failed to fetch balances:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const faucet = async (currency, amount) => {
        try {
            await api_1.apiService.faucet(currency, amount);
            await fetchBalances();
        }
        catch (error) {
            console.error('Faucet failed:', error);
            throw error;
        }
    };
    (0, react_1.useEffect)(() => {
        fetchBalances();
    }, []);
    return {
        balances,
        loading,
        fetchBalances,
        faucet,
    };
};
exports.useWallet = useWallet;
//# sourceMappingURL=useWallet.js.map