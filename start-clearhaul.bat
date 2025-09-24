@echo off
echo Starting Clearhaul Brokerage Platform...
echo.

echo Installing dependencies...
call npm install

echo.
echo Starting development servers...
echo.

echo Starting Shipper Portal (http://localhost:3000)...
start "Shipper Portal" cmd /k "cd apps/shipper-portal && npm run dev"

echo Starting Carrier App (http://localhost:3001)...
start "Carrier App" cmd /k "cd apps/carrier-app && npm run dev"

echo Starting Broker Console (http://localhost:3002)...
start "Broker Console" cmd /k "cd apps/broker-console && npm run dev"

echo Starting API Gateway (http://localhost:3003)...
start "API Gateway" cmd /k "cd services/api-gateway && npm run start:dev"

echo.
echo All services starting...
echo.
echo Shipper Portal: http://localhost:3000
echo Carrier App: http://localhost:3001
echo Broker Console: http://localhost:3002
echo API Gateway: http://localhost:3003
echo API Docs: http://localhost:3003/api/docs
echo.
echo Press any key to exit...
pause > nul
