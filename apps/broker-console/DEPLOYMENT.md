# Anderson Direct Transport - Broker Console Deployment Guide

## 🚀 Deploy to Vercel (Recommended)

### Prerequisites
- GitHub account
- Vercel account (free tier available)
- Git installed locally

### Step 1: Prepare Repository
```bash
# Navigate to the broker console directory
cd apps/broker-console

# Initialize git repository (if not already done)
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial commit: Anderson Direct Transport Broker Console"

# Create GitHub repository and push
# (Follow GitHub's instructions to create a new repository)
git remote add origin https://github.com/yourusername/anderson-direct-broker-console.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Vercel

#### Option A: Vercel CLI (Recommended)
```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy from the broker-console directory
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? (Select your account)
# - Link to existing project? No
# - Project name: anderson-direct-broker-console
# - Directory: ./
# - Override settings? No
```

#### Option B: Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "New Project"
4. Import your GitHub repository
5. Configure:
   - **Project Name**: `anderson-direct-broker-console`
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/broker-console` (if deploying from monorepo)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
6. Click "Deploy"

### Step 3: Configure Environment Variables (Optional)
In Vercel Dashboard:
1. Go to Project Settings
2. Navigate to "Environment Variables"
3. Add any required variables from `.env.example`

### Step 4: Custom Domain (Optional)
1. In Vercel Dashboard, go to Project Settings
2. Navigate to "Domains"
3. Add your custom domain (e.g., `broker.andersondirect.com`)
4. Follow DNS configuration instructions

## 🚂 Deploy to Railway (Alternative)

### Step 1: Prepare for Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize Railway project
railway init

# Deploy
railway up
```

### Step 2: Configure Railway
1. Set build command: `npm run build`
2. Set start command: `npm start`
3. Set port: `3000` (Railway default)

## 🔧 Production Optimizations

### Performance
- ✅ Next.js automatic optimizations enabled
- ✅ Image optimization configured
- ✅ Static generation where possible
- ✅ Code splitting implemented

### Security
- ✅ Environment variables for sensitive data
- ✅ HTTPS enforced by default on Vercel/Railway
- ✅ Client-side authentication simulation

### Monitoring
- ✅ Vercel Analytics available
- ✅ Error tracking via Vercel
- ✅ Performance monitoring built-in

## 📱 Features Available in Production

### ✅ Fully Functional
- **Authentication System** - Login/logout with demo credentials
- **Dashboard** - Real-time business metrics and activity
- **Load Management** - Create, track, and manage freight loads
- **Carrier Operations** - Source and contract with carriers
- **Dispatch Coordination** - Manage pickups and driver assignments
- **Real-time Monitoring** - Track loads in transit
- **Delivery Management** - Handle POD and completion
- **Financial Operations** - Process settlements and payments
- **Business Analytics** - Performance insights and reporting
- **Load Board** - Multi-source freight opportunities

### 🔮 Future Enhancements
- Real database integration (PostgreSQL)
- External API integrations (DAT, UberFreight)
- Email/SMS notifications
- Document management system
- Advanced reporting and analytics

## 🌐 Access Your Deployed Application

After deployment, your broker console will be available at:
- **Vercel**: `https://anderson-direct-broker-console.vercel.app`
- **Custom Domain**: `https://broker.andersondirect.com` (if configured)

### Demo Credentials
- **Email**: `devin@andersondirect.com`
- **Password**: `demo123`
- **User**: Devin Anderson, President

## 🆘 Troubleshooting

### Build Issues
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Test build locally
npm run build
```

### Deployment Issues
- Check Vercel build logs in dashboard
- Ensure all dependencies are in `package.json`
- Verify environment variables are set correctly

## 📞 Support
For deployment assistance, check:
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Railway Documentation](https://docs.railway.app)
