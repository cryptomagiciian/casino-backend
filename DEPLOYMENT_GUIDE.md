# 🚀 Casino Backend Deployment Guide

## 🎯 **Recommended: Railway (Best for Your Needs)**

**Why Railway?**
- ✅ **Free tier**: $5/month credit (covers small apps)
- ✅ **Zero config**: Deploy from GitHub in 2 minutes
- ✅ **PostgreSQL included**: No separate database setup
- ✅ **Automatic HTTPS**: Secure by default
- ✅ **Custom domains**: Free subdomain provided
- ✅ **Environment variables**: Easy config management

## 🚀 **Option 1: Railway Deployment (Recommended)**

### **Step 1: Prepare for Deployment**

1. **Create GitHub Repository**
   ```bash
   git init
   git add .
   git commit -m "Initial casino backend"
   git branch -M main
   git remote add origin https://github.com/yourusername/casino-backend.git
   git push -u origin main
   ```

2. **Update Environment Variables**
   Create `railway.env`:
   ```env
   NODE_ENV=production
   PORT=3000
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
   JWT_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=7d
   DEMO_MODE=true
   DEMO_ONLY=false
   CORS_ORIGIN=https://your-lovable-app.lovable.app
   ```

### **Step 2: Deploy to Railway**

1. **Go to Railway**: https://railway.app
2. **Sign up** with GitHub
3. **Click "New Project"**
4. **Select "Deploy from GitHub repo"**
5. **Choose your casino-backend repository**
6. **Add PostgreSQL database**:
   - Click "+ New"
   - Select "Database" → "PostgreSQL"
7. **Deploy**: Railway will automatically build and deploy

### **Step 3: Configure Environment**

1. **Go to your project settings**
2. **Add environment variables** from `railway.env`
3. **Set CORS_ORIGIN** to your Lovable app URL
4. **Redeploy** if needed

### **Step 4: Run Database Migrations**

Railway provides a console. Run:
```bash
npx prisma migrate deploy
npx prisma generate
npm run prisma:seed
```

**Cost**: ~$5/month (free tier covers small apps)

---

## 🌐 **Option 2: Render (Alternative)**

**Why Render?**
- ✅ **Free tier**: 750 hours/month
- ✅ **PostgreSQL included**
- ✅ **Automatic deploys**
- ✅ **Custom domains**

### **Deploy to Render**

1. **Go to Render**: https://render.com
2. **Sign up** with GitHub
3. **New Web Service** → Connect GitHub repo
4. **Configure**:
   - Build Command: `npm install && npx prisma generate && npx prisma migrate deploy`
   - Start Command: `npm run start:prod`
   - Environment: Node
5. **Add PostgreSQL database**
6. **Set environment variables**

**Cost**: Free tier available, $7/month for always-on

---

## ☁️ **Option 3: Vercel + PlanetScale (Most Scalable)**

**Why This Combo?**
- ✅ **Vercel**: Free hosting, excellent performance
- ✅ **PlanetScale**: Free MySQL database
- ✅ **Serverless**: Scales automatically
- ✅ **Global CDN**: Fast worldwide

### **Setup Vercel + PlanetScale**

1. **Deploy to Vercel**:
   - Go to https://vercel.com
   - Import GitHub repository
   - Configure build settings

2. **Setup PlanetScale**:
   - Go to https://planetscale.com
   - Create free database
   - Get connection string

3. **Update for Vercel**:
   - Add `vercel.json` configuration
   - Update database connection
   - Set environment variables

**Cost**: Free tier available, scales with usage

---

## 🎯 **Quick Start: Railway (Recommended)**

Let me help you deploy to Railway right now:

### **1. Create Railway Account**
- Go to https://railway.app
- Sign up with GitHub
- Connect your GitHub account

### **2. Deploy Your Casino Backend**
- Click "New Project"
- Select "Deploy from GitHub repo"
- Choose your casino-backend repository
- Railway will automatically detect it's a Node.js app

### **3. Add Database**
- Click "+ New" in your project
- Select "Database" → "PostgreSQL"
- Railway will provide the DATABASE_URL

### **4. Set Environment Variables**
```env
NODE_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
CORS_ORIGIN=https://your-lovable-app.lovable.app
DEMO_MODE=true
```

### **5. Update Your Lovable Frontend**
Update the API URL in your frontend:
```typescript
const API_BASE_URL = 'https://your-app-name.railway.app/api/v1';
```

## 🔧 **Production Optimizations**

### **Security Enhancements**
```typescript
// Add to your backend
app.use(helmet());
app.use(compression());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
}));
```

### **Environment Variables**
```env
# Production settings
NODE_ENV=production
PORT=3000
DATABASE_URL=your-production-database-url
JWT_SECRET=your-very-secure-jwt-secret
JWT_REFRESH_SECRET=your-very-secure-refresh-secret
CORS_ORIGIN=https://your-lovable-app.lovable.app
DEMO_MODE=true
DEMO_ONLY=false
```

## 🎮 **After Deployment**

### **Test Your Deployed Backend**
1. **Health Check**: `https://your-app.railway.app/api/v1/health`
2. **API Docs**: `https://your-app.railway.app/docs`
3. **Games List**: `https://your-app.railway.app/api/v1/games`

### **Update Lovable Frontend**
1. **Change API URL** to your deployed backend
2. **Test authentication** with demo users
3. **Test games** and betting functionality

## 💰 **Cost Comparison**

| Service | Free Tier | Paid Tier | Best For |
|---------|-----------|-----------|----------|
| **Railway** | $5 credit/month | $5+/month | Quick setup, includes DB |
| **Render** | 750 hours/month | $7+/month | Simple deployment |
| **Vercel + PlanetScale** | Free tier | Pay as you scale | High performance |

## 🚀 **Recommended: Railway**

**Why Railway is perfect for you:**
- ✅ **Easiest setup** (2 minutes)
- ✅ **Includes database** (no separate setup)
- ✅ **Free tier** covers your needs
- ✅ **Automatic HTTPS**
- ✅ **Custom domains**
- ✅ **Environment management**

## 🎯 **Next Steps**

1. **Choose Railway** (recommended)
2. **Deploy your backend** (5 minutes)
3. **Update your Lovable frontend** API URL
4. **Test the full casino** system
5. **Share your live casino** app!

Your casino backend is production-ready and will work perfectly with Lovable! 🎰
