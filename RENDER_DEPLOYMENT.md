# 🚀 Deploy Casino Backend to Render (Free!)

## Why Render?
- ✅ **Free tier**: 750 hours/month (enough for development)
- ✅ **PostgreSQL**: Free tier included
- ✅ **Redis**: Free tier included
- ✅ **Auto-deploy**: From GitHub
- ✅ **Custom domains**: Free
- ✅ **Perfect for your casino backend**

## Step-by-Step Setup

### 1. Prepare Your Code for GitHub

First, let's make sure your code is ready for deployment:

```bash
# Make sure you're in your casino directory
cd C:\Users\shlap\Downloads\casino

# Initialize git if not already done
git init
git add .
git commit -m "Initial casino backend commit"
```

### 2. Push to GitHub

1. Go to [GitHub.com](https://github.com)
2. Create a new repository called "casino-backend"
3. Push your code:

```bash
git remote add origin https://github.com/yourusername/casino-backend.git
git push -u origin main
```

### 3. Create Render Account

1. Go to [render.com](https://render.com)
2. Sign up with GitHub (recommended)
3. Connect your GitHub account

### 4. Deploy Using Blueprint (Easiest)

1. Click **"New +"** → **"Blueprint"**
2. Connect your GitHub repository
3. Select your "casino-backend" repository
4. Render will automatically detect the `render.yaml` file
5. Click **"Apply"**

**That's it!** Render will automatically:
- Create the web service
- Set up PostgreSQL database
- Set up Redis cache
- Configure all environment variables
- Deploy your casino backend

### 5. Manual Setup (Alternative)

If you prefer manual setup:

#### 5.1 Deploy Backend Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Select your "casino-backend" repository
4. Configure the service:

**Basic Settings:**
- **Name**: `casino-backend`
- **Environment**: `Node`
- **Build Command**: `npm install && npx prisma generate && npm run build`
- **Start Command**: `npm run start:prod`
- **Instance Type**: `Free`

#### 5.2 Add PostgreSQL Database
1. Click **"New +"** → **"PostgreSQL"**
2. Configure:
   - **Name**: `casino-db`
   - **Database**: `casino_db`
   - **User**: `casino_user`
   - **Instance Type**: `Free`

#### 5.3 Add Redis Cache
1. Click **"New +"** → **"Redis"**
2. Configure:
   - **Name**: `casino-redis`
   - **Instance Type**: `Free`

#### 5.4 Update Environment Variables
Go back to your web service and add:

```
NODE_ENV=production
PORT=3000
DEMO_MODE=true
DEMO_ONLY=false
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
```

### 6. Set Up Database

After deployment, you'll need to run migrations:

1. Go to your service dashboard
2. Click **"Shell"**
3. Run these commands:

```bash
npx prisma migrate deploy
npm run prisma:seed
```

### 7. Test Your Deployment

Your casino backend will be available at:
`https://casino-backend.onrender.com/api/v1`

Test endpoints:
- Health: `https://casino-backend.onrender.com/api/v1/health`
- Games: `https://casino-backend.onrender.com/api/v1/games`

## Render Free Tier Limits

- **750 hours/month** (enough for development)
- **512MB RAM** (sufficient for your casino backend)
- **Sleeps after 15 minutes** of inactivity (wakes up on request)
- **PostgreSQL**: 1GB storage
- **Redis**: 25MB storage

## Cost Comparison

| Service | Free Tier | Paid Plans |
|---------|-----------|------------|
| **Render** | 750 hours/month | $7/month |
| **Railway** | Very limited | $20/month |
| **Vercel** | Generous | $20/month |
| **Fly.io** | 3 VMs | $1.94/month |

## Next Steps

1. **Deploy to Render** (free)
2. **Get your Render URL**
3. **Update your Lovable frontend** with the Render URL
4. **Test the integration**

Your casino backend will be fully functional on Render's free tier!

## Troubleshooting

### Common Issues:

1. **Build Fails**
   - Check that all dependencies are in package.json
   - Ensure Dockerfile is correct

2. **Database Connection Issues**
   - Verify DATABASE_URL is set correctly
   - Check PostgreSQL service is running

3. **App Sleeps**
   - Free tier apps sleep after 15 minutes of inactivity
   - They wake up automatically on the next request
   - Consider upgrading to paid plan for always-on

4. **Environment Variables**
   - Make sure all required variables are set
   - Check the Render dashboard for any missing variables

### View Logs:
- Go to your service dashboard
- Click on "Logs" tab
- View real-time logs

### Restart Service:
- Go to your service dashboard
- Click "Manual Deploy" → "Deploy latest commit"
