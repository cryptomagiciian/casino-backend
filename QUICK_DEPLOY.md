# 🚀 Quick Railway Deployment

## ⚡ **5-Minute Deployment to Railway**

### **Step 1: Create GitHub Repository**
```bash
# In your casino directory
git init
git add .
git commit -m "Casino backend ready for deployment"
git branch -M main
git remote add origin https://github.com/yourusername/casino-backend.git
git push -u origin main
```

### **Step 2: Deploy to Railway**
1. **Go to**: https://railway.app
2. **Sign up** with GitHub
3. **Click "New Project"**
4. **Select "Deploy from GitHub repo"**
5. **Choose your casino-backend repository**
6. **Railway auto-detects Node.js** ✅

### **Step 3: Add PostgreSQL Database**
1. **In your Railway project**
2. **Click "+ New"**
3. **Select "Database" → "PostgreSQL"**
4. **Railway creates database automatically** ✅

### **Step 4: Set Environment Variables**
Copy these to Railway dashboard:

```env
NODE_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
CORS_ORIGIN=https://your-lovable-app.lovable.app
DEMO_MODE=true
```

### **Step 5: Deploy & Test**
1. **Railway automatically deploys** ✅
2. **Get your URL**: `https://your-app.railway.app`
3. **Test**: `https://your-app.railway.app/api/v1/health`
4. **API Docs**: `https://your-app.railway.app/docs`

### **Step 6: Update Lovable Frontend**
Change API URL in your frontend:
```typescript
const API_BASE_URL = 'https://your-app.railway.app/api/v1';
```

## 🎯 **That's It!**

**Your casino backend is now live and ready for your Lovable frontend!**

**Cost**: ~$5/month (Railway free tier covers small apps)

**Features**:
- ✅ **HTTPS enabled**
- ✅ **PostgreSQL database**
- ✅ **Auto-scaling**
- ✅ **Custom domain ready**
- ✅ **Environment management**

## 🎮 **Test Your Live Casino**

1. **Health Check**: `https://your-app.railway.app/api/v1/health`
2. **Games**: `https://your-app.railway.app/api/v1/games`
3. **Login**: Use demo credentials
4. **Play**: Full casino functionality

## 🆘 **Need Help?**

**Common Issues**:
- **Build fails**: Check Railway logs
- **Database errors**: Run migrations in Railway console
- **CORS errors**: Update CORS_ORIGIN with your Lovable URL

**Railway Console Commands**:
```bash
npx prisma migrate deploy
npx prisma generate
npm run prisma:seed
```

Your casino backend is production-ready! 🎰
