@echo off
echo ========================================
echo Anderson Direct Transport Broker Console
echo Deployment Script
echo ========================================
echo.

echo Navigating to broker console directory...
cd apps\broker-console

echo.
echo Installing dependencies...
call npm install

echo.
echo Building application...
call npm run build

echo.
echo Testing build...
call npm run lint

echo.
echo ========================================
echo Build completed successfully!
echo ========================================
echo.
echo Next steps:
echo 1. Install Vercel CLI: npm install -g vercel
echo 2. Login to Vercel: vercel login
echo 3. Deploy: vercel
echo.
echo Or visit: https://vercel.com/new
echo ========================================

pause
