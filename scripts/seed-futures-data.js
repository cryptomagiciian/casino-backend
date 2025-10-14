const fetch = require('node-fetch');

const API_BASE_URL = 'https://casino-backend-production-8186.up.railway.app/api/v1';

async function seedFuturesData() {
  console.log('🌱 Seeding futures trading data...');
  
  try {
    // Seed futures symbols
    console.log('📊 Seeding futures symbols...');
    const symbolsResponse = await fetch(`${API_BASE_URL}/futures/seed/symbols`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (symbolsResponse.ok) {
      const symbolsResult = await symbolsResponse.json();
      console.log('✅ Futures symbols seeded:', symbolsResult.message);
    } else {
      console.error('❌ Failed to seed symbols:', symbolsResponse.status, symbolsResponse.statusText);
    }
    
    // Create initial trading round
    console.log('🎲 Creating initial trading round...');
    const roundResponse = await fetch(`${API_BASE_URL}/futures/seed/round`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (roundResponse.ok) {
      const roundResult = await roundResponse.json();
      console.log('✅ Trading round created:', roundResult.message);
    } else {
      console.error('❌ Failed to create trading round:', roundResponse.status, roundResponse.statusText);
    }
    
    // Test endpoints
    console.log('🧪 Testing futures endpoints...');
    
    // Test symbols endpoint
    const testSymbolsResponse = await fetch(`${API_BASE_URL}/futures/symbols`);
    if (testSymbolsResponse.ok) {
      const symbols = await testSymbolsResponse.json();
      console.log(`✅ Symbols endpoint working: ${symbols.length} symbols found`);
      symbols.forEach(symbol => {
        console.log(`   - ${symbol.id}: ${symbol.maxLeverage}x leverage (${symbol.isMajor ? 'Major' : 'Meme'})`);
      });
    } else {
      console.error('❌ Symbols endpoint failed:', testSymbolsResponse.status);
    }
    
    // Test current round endpoint
    const testRoundResponse = await fetch(`${API_BASE_URL}/futures/round/current`);
    if (testRoundResponse.ok) {
      const round = await testRoundResponse.json();
      console.log('✅ Current round endpoint working:', {
        id: round.id,
        startsAt: round.startsAt,
        endsAt: round.endsAt,
        isActive: round.isActive
      });
    } else {
      console.error('❌ Current round endpoint failed:', testRoundResponse.status);
    }
    
    console.log('🚀 Futures trading system setup complete!');
    
  } catch (error) {
    console.error('❌ Error seeding futures data:', error.message);
  }
}

// Run the seeding
seedFuturesData();
