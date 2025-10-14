const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedFuturesSymbols() {
  console.log('🌱 Seeding futures symbols...');

  const majorSymbols = [
    { base: 'BTC', quote: 'USDC', maxLeverage: 1000 },
    { base: 'ETH', quote: 'USDC', maxLeverage: 1000 },
    { base: 'SOL', quote: 'USDC', maxLeverage: 1000 },
    { base: 'BNB', quote: 'USDC', maxLeverage: 1000 },
    { base: 'ASTER', quote: 'USDC', maxLeverage: 1000 },
  ];

  const memeSymbols = [
    { base: 'COAI', quote: 'USDC', maxLeverage: 10 },
    { base: 'SUI', quote: 'USDC', maxLeverage: 10 },
    { base: 'USELESS', quote: 'USDC', maxLeverage: 10 },
    { base: 'TROLL', quote: 'USDC', maxLeverage: 10 },
    { base: 'PUMPFUN', quote: 'USDC', maxLeverage: 10 },
    { base: '4', quote: 'USDC', maxLeverage: 10 },
  ];

  const allSymbols = [
    ...majorSymbols.map(s => ({ ...s, isMajor: true })),
    ...memeSymbols.map(s => ({ ...s, isMajor: false })),
  ];

  for (const symbolData of allSymbols) {
    const symbolId = `${symbolData.base}-${symbolData.quote}`;
    
    await prisma.futuresSymbol.upsert({
      where: { id: symbolId },
      update: {
        maxLeverage: symbolData.maxLeverage,
        isMajor: symbolData.isMajor,
        isEnabled: true,
      },
      create: {
        id: symbolId,
        base: symbolData.base,
        quote: symbolData.quote,
        maxLeverage: symbolData.maxLeverage,
        isMajor: symbolData.isMajor,
        isEnabled: true,
      },
    });

    console.log(`✅ Seeded symbol: ${symbolId} (${symbolData.isMajor ? 'Major' : 'Meme'}, ${symbolData.maxLeverage}x max leverage)`);
  }

  console.log(`🎯 Successfully seeded ${allSymbols.length} futures symbols!`);
}

async function createInitialTradingRound() {
  console.log('🎲 Creating initial trading round...');

  const crypto = require('crypto');
  
  // Generate new server seed
  const serverSeed = crypto.randomBytes(32).toString('hex');
  const serverSeedHash = crypto.createHash('sha256').update(serverSeed).digest('hex');

  // Calculate round times (24 hours)
  const now = new Date();
  const startsAt = new Date(now);
  startsAt.setUTCHours(0, 0, 0, 0); // Start of current day

  const endsAt = new Date(startsAt);
  endsAt.setUTCDate(endsAt.getUTCDate() + 1); // End of current day

  // Create new round
  const newRound = await prisma.tradingRound.create({
    data: {
      serverSeed,
      serverSeedHash,
      startsAt,
      endsAt,
      intervalMs: 1000, // 1 second intervals
      isActive: true,
    },
  });

  console.log(`✅ Created trading round: ${newRound.id}`);
  console.log(`🔐 Server seed hash: ${serverSeedHash}`);
  console.log(`📅 Round period: ${startsAt.toISOString()} to ${endsAt.toISOString()}`);
}

async function main() {
  try {
    await seedFuturesSymbols();
    await createInitialTradingRound();
    console.log('🚀 Futures trading system initialized successfully!');
  } catch (error) {
    console.error('❌ Failed to seed futures symbols:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
