"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const constants_1 = require("../src/shared/constants");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting database seeding...');
    const demoUsers = [
        {
            handle: 'demo_user_1',
            email: 'demo1@example.com',
            password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KzKz2a',
        },
        {
            handle: 'demo_user_2',
            email: 'demo2@example.com',
            password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KzKz2a',
        },
        {
            handle: 'admin',
            email: 'admin@casino.com',
            password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KzKz2a',
        },
    ];
    for (const userData of demoUsers) {
        const user = await prisma.user.upsert({
            where: { handle: userData.handle },
            update: {},
            create: userData,
        });
        console.log(`✅ Created user: ${user.handle}`);
        for (const currency of Object.values(constants_1.CURRENCIES)) {
            await prisma.walletAccount.upsert({
                where: {
                    userId_currency: {
                        userId: user.id,
                        currency,
                    },
                },
                update: {},
                create: {
                    userId: user.id,
                    currency,
                    available: 0n,
                    locked: 0n,
                },
            });
        }
        const serverSeed = generateServerSeed();
        const serverSeedHash = await sha256(serverSeed);
        await prisma.fairnessSeed.create({
            data: {
                userId: user.id,
                serverSeed,
                serverSeedHash,
                active: true,
            },
        });
        console.log(`✅ Created fairness seed for: ${user.handle}`);
    }
    const gameConfigs = [
        { game: 'candle_flip', houseEdgeBps: 100, params: { winChance: 0.495, multiplier: 1.98 } },
        { game: 'pump_or_dump', houseEdgeBps: 100, params: { winChance: 0.495, multiplier: 1.98 } },
        { game: 'support_or_resistance', houseEdgeBps: 300, params: { winChance: 0.485, multiplier: 2.02 } },
        { game: 'bull_vs_bear_battle', houseEdgeBps: 200, params: { winChance: 0.49, multiplier: 2.0 } },
        { game: 'leverage_ladder', houseEdgeBps: 200, params: { multipliers: [1.3, 1.69, 2.19, 2.85, 3.7, 4.8] } },
        { game: 'stop_loss_roulette', houseEdgeBps: 200, params: { maxMultiplier: 4.0 } },
        { game: 'freeze_the_bag', houseEdgeBps: 200, params: { crashProbability: 0.01 } },
        { game: 'to_the_moon', houseEdgeBps: 200, params: { crashProbability: 0.01 } },
        { game: 'diamond_hands', houseEdgeBps: 200, params: { gridSize: 25, defaultMines: 3 } },
    ];
    for (const config of gameConfigs) {
        await prisma.gameConfig.upsert({
            where: { game: config.game },
            update: config,
            create: config,
        });
        console.log(`✅ Created game config: ${config.game}`);
    }
    const demoUser1 = await prisma.user.findUnique({ where: { handle: 'demo_user_1' } });
    if (demoUser1) {
        const usdcAccount = await prisma.walletAccount.findUnique({
            where: {
                userId_currency: {
                    userId: demoUser1.id,
                    currency: 'USDC',
                },
            },
        });
        if (usdcAccount) {
            await prisma.ledgerEntry.create({
                data: {
                    accountId: usdcAccount.id,
                    amount: 1000000000n,
                    currency: 'USDC',
                    type: 'FAUCET',
                    meta: { demo: true, amount: '1000' },
                },
            });
            console.log(`✅ Added demo funds to: ${demoUser1.handle}`);
        }
    }
    console.log('🎉 Database seeding completed!');
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
main()
    .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map