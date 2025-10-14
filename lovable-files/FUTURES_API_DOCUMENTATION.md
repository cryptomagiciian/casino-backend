# Futures Trading API Documentation

## Overview
The futures trading system provides a comprehensive derivatives trading platform with provably-fair price paths, isolated margin positions, and automated liquidation protection.

## Key Features
- **TURBOWAVE Provably-Fair System**: 24-hour trading rounds with committed price paths
- **Leverage Support**: Up to 1000x for majors (BTC, ETH, SOL, BNB, ASTER), up to 10x for memes
- **Isolated Margin**: Each position has its own collateral
- **Automated Liquidation**: Real-time liquidation protection with maintenance margin
- **Funding & Borrow Fees**: Applied after 8 hours of position holding
- **Comprehensive Fee Structure**: Open, close, impact, borrow, and funding fees

## API Endpoints

### 1. Get Available Symbols
```http
GET /api/v1/futures/symbols
```

**Response:**
```json
[
  {
    "id": "BTC-USDC",
    "base": "BTC",
    "quote": "USDC",
    "maxLeverage": 1000,
    "isMajor": true,
    "isEnabled": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### 2. Get Current Trading Round
```http
GET /api/v1/futures/round/current
```

**Response:**
```json
{
  "id": "round_123",
  "serverSeedHash": "abc123...",
  "startsAt": "2024-01-01T00:00:00.000Z",
  "endsAt": "2024-01-02T00:00:00.000Z",
  "intervalMs": 1000,
  "isActive": true,
  "revealedAt": null
}
```

### 3. Open Position
```http
POST /api/v1/futures/order/open
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "symbolId": "BTC-USDC",
  "side": "LONG",
  "leverage": 20,
  "collateral": 100.0,
  "qty": 0.01,
  "splitSize": 50.0
}
```

**Response:**
```json
{
  "success": true,
  "positionId": "pos_123",
  "message": "Position opened successfully",
  "fees": {
    "openFee": 0.08,
    "impactFee": 0.02,
    "totalFee": 0.10
  }
}
```

### 4. Close Position
```http
POST /api/v1/futures/order/close
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "positionId": "pos_123",
  "qty": 0.005
}
```

**Response:**
```json
{
  "success": true,
  "positionId": "pos_123",
  "message": "Position partially closed",
  "pnl": 25.50
}
```

### 5. Get User Positions
```http
GET /api/v1/futures/positions?status=OPEN&page=1&limit=20
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "positions": [
    {
      "id": "pos_123",
      "symbolId": "BTC-USDC",
      "side": "LONG",
      "qty": 0.01,
      "entryPrice": 50000.0,
      "collateral": 100.0,
      "leverage": 20,
      "openedAt": "2024-01-01T10:00:00.000Z",
      "status": "OPEN",
      "realizedPnl": 0,
      "feesPaid": 0.10,
      "borrowStartAt": null
    }
  ],
  "total": 1
}
```

### 6. Get Position Details
```http
GET /api/v1/futures/positions/{positionId}
Authorization: Bearer <jwt_token>
```

### 7. Get Liquidation Price
```http
GET /api/v1/futures/positions/{positionId}/liquidation-price
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "liquidationPrice": 47500.0
}
```

### 8. Get Funding Rate
```http
GET /api/v1/futures/funding-rate/{symbolId}
```

**Response:**
```json
{
  "fundingRate": 0.001
}
```

### 9. Get Borrow Rate
```http
GET /api/v1/futures/borrow-rate/{symbolId}
```

**Response:**
```json
{
  "borrowRate": 0.0001
}
```

### 10. Get Maintenance Margin Rate
```http
GET /api/v1/futures/maintenance-margin-rate/{leverage}
```

**Response:**
```json
{
  "maintenanceMarginRate": 0.015
}
```

## Frontend Integration Guide

### 1. API Service Setup
```typescript
// Add to your existing api.ts
class ApiService {
  // Futures endpoints
  async getFuturesSymbols() {
    return this.request('/futures/symbols');
  }

  async getCurrentTradingRound() {
    return this.request('/futures/round/current');
  }

  async openFuturesPosition(orderData: {
    symbolId: string;
    side: 'LONG' | 'SHORT';
    leverage: number;
    collateral: number;
    qty?: number;
    splitSize?: number;
  }) {
    return this.request('/futures/order/open', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async closeFuturesPosition(positionId: string, qty?: number) {
    return this.request('/futures/order/close', {
      method: 'POST',
      body: JSON.stringify({ positionId, qty }),
    });
  }

  async getFuturesPositions(status?: 'OPEN' | 'CLOSED' | 'LIQUIDATED', page = 1, limit = 20) {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    return this.request(`/futures/positions?${params.toString()}`);
  }

  async getFuturesPosition(positionId: string) {
    return this.request(`/futures/positions/${positionId}`);
  }

  async getLiquidationPrice(positionId: string) {
    return this.request(`/futures/positions/${positionId}/liquidation-price`);
  }

  async getFundingRate(symbolId: string) {
    return this.request(`/futures/funding-rate/${symbolId}`);
  }

  async getBorrowRate(symbolId: string) {
    return this.request(`/futures/borrow-rate/${symbolId}`);
  }

  async getMaintenanceMarginRate(leverage: number) {
    return this.request(`/futures/maintenance-margin-rate/${leverage}`);
  }
}
```

### 2. Trading Terminal Component Structure
```typescript
// TradingTerminal.tsx
interface TradingTerminalProps {
  // Main trading interface
}

// SymbolStrip.tsx
interface SymbolStripProps {
  symbols: FuturesSymbol[];
  selectedSymbol: string;
  onSymbolSelect: (symbolId: string) => void;
}

// OrderPanel.tsx
interface OrderPanelProps {
  symbol: FuturesSymbol;
  onOpenPosition: (orderData: OpenOrderData) => void;
  onClosePosition: (positionId: string, qty?: number) => void;
}

// PositionsTable.tsx
interface PositionsTableProps {
  positions: FuturesPosition[];
  onClosePosition: (positionId: string, qty?: number) => void;
}

// Chart.tsx
interface ChartProps {
  symbolId: string;
  showCommittedMark: boolean;
  showBaseline: boolean;
}
```

### 3. Key Calculations

#### Liquidation Price
```typescript
function calculateLiquidationPrice(position: {
  side: 'LONG' | 'SHORT';
  entryPrice: number;
  leverage: number;
  collateral: number;
  feesPaid: number;
  qty: number;
}): number {
  const mmr = 0.005 + (0.005 * Math.log10(position.leverage)); // Maintenance margin rate
  const availableMargin = position.collateral - position.feesPaid;
  
  if (position.side === 'LONG') {
    const marginRatio = availableMargin / (position.qty * position.entryPrice);
    return position.entryPrice * (1 - marginRatio - mmr);
  } else {
    const marginRatio = availableMargin / (position.qty * position.entryPrice);
    return position.entryPrice * (1 + marginRatio + mmr);
  }
}
```

#### Unrealized PnL
```typescript
function calculateUnrealizedPnL(position: {
  side: 'LONG' | 'SHORT';
  entryPrice: number;
  qty: number;
}, markPrice: number): number {
  if (position.side === 'LONG') {
    return position.qty * (markPrice - position.entryPrice);
  } else {
    return position.qty * (position.entryPrice - markPrice);
  }
}
```

#### Fee Calculations
```typescript
function calculateOpenFees(notional: number): {
  openFee: number;
  impactFee: number;
  totalFee: number;
} {
  const openFee = notional * 0.0008; // 0.08%
  const impactFee = Math.min(notional * 0.002, (notional / 1000) * 0.0002); // Impact curve
  return {
    openFee,
    impactFee,
    totalFee: openFee + impactFee,
  };
}
```

### 4. Real-time Updates
The system supports WebSocket streaming for real-time updates:
- Mark price updates
- Position status changes
- Liquidation alerts
- Funding rate updates

### 5. Provably Fair Verification
Users can verify the fairness of any trading round by:
1. Getting the server seed hash from the current round
2. After the round ends, getting the revealed server seed
3. Recalculating the committed mark prices for any timestamp
4. Comparing with the actual settlement prices

## Error Handling
All endpoints return standard HTTP status codes:
- `200`: Success
- `400`: Bad Request (invalid data)
- `401`: Unauthorized (missing/invalid JWT)
- `404`: Not Found
- `500`: Internal Server Error

Error responses include a message field:
```json
{
  "message": "Insufficient balance for position and fees",
  "error": "Bad Request",
  "statusCode": 400
}
```

## Rate Limiting
Futures endpoints are subject to the same rate limiting as other casino endpoints:
- Default: 100 requests per minute per IP
- Authenticated endpoints: Higher limits for logged-in users

## Demo Mode Support
The futures trading system fully supports demo mode:
- All positions and transactions are recorded in testnet
- Demo balances are used for collateral
- No real money is at risk in demo mode
