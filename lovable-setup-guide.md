# 🎰 Casino Frontend Setup with Lovable

## Quick Start Guide

### 1. Create Lovable Project
1. Go to [Lovable.dev](https://lovable.dev)
2. Click "Create New Project"
3. Choose "React + TypeScript + Tailwind CSS"
4. Name it "casino-frontend"

### 2. Project Structure
```
src/
├── components/
│   ├── auth/
│   ├── games/
│   ├── wallet/
│   └── shared/
├── hooks/
├── services/
├── types/
└── utils/
```

### 3. Copy Files to Lovable

#### Step 1: Copy Types
- Copy `frontend-types.ts` to `src/types/index.ts`

#### Step 2: Create API Service
Create `src/services/api.ts` with the API service code from the integration guide.

#### Step 3: Create Hooks
- Copy `useAuth.ts` to `src/hooks/useAuth.ts`
- Copy `useWallet.ts` to `src/hooks/useWallet.ts`

#### Step 4: Create Components
- Copy the game components to `src/components/games/`
- Copy the auth components to `src/components/auth/`
- Copy the wallet components to `src/components/wallet/`

### 4. Environment Setup
Create `.env.local` in your Lovable project:
```env
REACT_APP_API_URL=http://localhost:3000/api/v1
```

### 5. Update Main App
Replace `src/App.tsx` with:
```typescript
import React from 'react';
import { AuthProvider } from './hooks/useAuth';
import { Layout } from './components/shared/Layout';
import { GameList } from './components/games/GameList';

function App() {
  return (
    <AuthProvider>
      <Layout>
        <GameList />
      </Layout>
    </AuthProvider>
  );
}

export default App;
```

### 6. Start Development
1. Make sure your casino backend is running (`npm run start:dev`)
2. In Lovable, click "Run" to start the frontend
3. Open the preview URL

## 🎮 Game Components to Build

### Priority Order:
1. **Authentication** (Login/Register)
2. **Wallet Balance** display
3. **Faucet Button** (demo mode)
4. **Candle Flip** game
5. **To the Moon** crash game
6. **Diamond Hands** mines game
7. **Other games** as needed

### Key Features:
- Real-time balance updates
- Bet preview before placing
- Fairness verification
- Responsive design
- Error handling

## 🎨 Styling Tips

### Color Scheme:
- Background: `bg-gray-900`
- Cards: `bg-gray-800`
- Accent: `text-yellow-400`
- Success: `text-green-400`
- Error: `text-red-400`

### Game Cards:
```css
.game-card {
  @apply bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-yellow-400 transition-colors;
}
```

### Buttons:
```css
.btn-primary {
  @apply bg-yellow-400 text-gray-900 px-4 py-2 rounded font-bold hover:bg-yellow-300 transition-colors;
}

.btn-secondary {
  @apply bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors;
}
```

## 🔧 Development Workflow

### 1. Start Backend
```bash
cd casino
npm run start:dev
```

### 2. Test API
Visit `http://localhost:3000/docs` to test endpoints

### 3. Build Frontend
Use Lovable's built-in development tools

### 4. Test Integration
- Register a user
- Get faucet funds
- Place a bet
- Verify fairness

## 🚀 Deployment

### Backend Deployment:
- Use Docker: `docker-compose up -d`
- Deploy to cloud provider (AWS, GCP, Azure)
- Set up production environment variables

### Frontend Deployment:
- Lovable handles deployment automatically
- Update API URL for production
- Configure CORS on backend

## 🎯 Success Criteria

✅ User can register and login  
✅ Wallet balance displays correctly  
✅ Faucet works in demo mode  
✅ Can place and resolve bets  
✅ Fairness verification works  
✅ Responsive design on mobile  
✅ Error handling works properly  

## 🆘 Troubleshooting

### Common Issues:

1. **CORS Errors**
   - Check backend CORS configuration
   - Ensure frontend URL is allowed

2. **Authentication Issues**
   - Check JWT token storage
   - Verify token expiration

3. **API Connection**
   - Ensure backend is running
   - Check API URL configuration

4. **Build Errors**
   - Check TypeScript types
   - Verify all imports are correct

## 📞 Support

If you need help:
1. Check the backend logs
2. Use browser dev tools
3. Test API endpoints directly
4. Review the Swagger docs

The casino backend is fully functional and ready for frontend integration!
