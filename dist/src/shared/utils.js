"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromSmallestUnits = fromSmallestUnits;
exports.toSmallestUnits = toSmallestUnits;
exports.generateClientSeed = generateClientSeed;
exports.generateServerSeed = generateServerSeed;
exports.sha256 = sha256;
exports.hmacSha256 = hmacSha256;
exports.generateRng = generateRng;
exports.calculateHouseEdgeMultiplier = calculateHouseEdgeMultiplier;
exports.validateCurrencyAmount = validateCurrencyAmount;
exports.formatCurrency = formatCurrency;
exports.generateIdempotencyKey = generateIdempotencyKey;
exports.isDemoMode = isDemoMode;
exports.isDemoOnly = isDemoOnly;
const constants_1 = require("./constants");
function fromSmallestUnits(amount, currency) {
    const decimals = constants_1.CURRENCY_DECIMALS[currency];
    const divisor = BigInt(10 ** decimals);
    const whole = amount / divisor;
    const remainder = amount % divisor;
    if (remainder === 0n) {
        return whole.toString();
    }
    const remainderStr = remainder.toString().padStart(decimals, '0');
    const trimmed = remainderStr.replace(/0+$/, '');
    if (trimmed === '') {
        return whole.toString();
    }
    return `${whole}.${trimmed}`;
}
function toSmallestUnits(amount, currency) {
    const decimals = constants_1.CURRENCY_DECIMALS[currency];
    const [whole, fractional = ''] = amount.split('.');
    const wholeBigInt = BigInt(whole || '0');
    const fractionalPadded = fractional.padEnd(decimals, '0').slice(0, decimals);
    const fractionalBigInt = BigInt(fractionalPadded);
    return wholeBigInt * BigInt(10 ** decimals) + fractionalBigInt;
}
function generateClientSeed() {
    return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
}
function generateServerSeed() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 64; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
async function sha256(input) {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
async function hmacSha256(key, message) {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(key);
    const messageData = encoder.encode(message);
    const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    const hashArray = Array.from(new Uint8Array(signature));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
async function generateRng(serverSeed, clientSeed, nonce) {
    const message = `${clientSeed}:${nonce}`;
    const hash = await hmacSha256(serverSeed, message);
    const hex = hash.substring(0, 8);
    const num = parseInt(hex, 16);
    return num / 0xffffffff;
}
function calculateHouseEdgeMultiplier(winChance, houseEdgeBps) {
    const houseEdge = houseEdgeBps / 10000;
    return (1 - houseEdge) / winChance;
}
function validateCurrencyAmount(amount, currency) {
    try {
        const smallestUnits = toSmallestUnits(amount, currency);
        return smallestUnits > 0n;
    }
    catch {
        return false;
    }
}
function formatCurrency(amount, currency) {
    const num = parseFloat(amount);
    if (isNaN(num))
        return '0';
    const decimals = constants_1.CURRENCY_DECIMALS[currency];
    return num.toFixed(decimals);
}
function generateIdempotencyKey() {
    return `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}
function isDemoMode() {
    return process.env.DEMO_MODE === 'true';
}
function isDemoOnly() {
    return process.env.DEMO_ONLY === 'true';
}
//# sourceMappingURL=utils.js.map