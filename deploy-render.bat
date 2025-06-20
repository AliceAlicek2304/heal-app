@echo off
REM Render Deploy Script for HealApp (Windows)
echo 🚀 Preparing HealApp for Render deployment...

REM Check if we're in the right directory
if not exist "render.yaml" (
    echo ❌ Error: render.yaml not found. Please run this script from the project root.
    exit /b 1
)

REM Build and test backend locally first
echo 📦 Building backend...
cd backend
call mvn clean package -DskipTests
if errorlevel 1 (
    echo ❌ Backend build failed!
    exit /b 1
)
cd ..

REM Build frontend locally
echo 🎨 Building frontend...
cd frontend
call npm install
call npm run build
if errorlevel 1 (
    echo ❌ Frontend build failed!
    exit /b 1
)
cd ..

echo ✅ Local builds successful!

REM Create .gitignore if it doesn't exist
if not exist ".gitignore" (
    echo 📝 Creating .gitignore...
    (
        echo # Dependencies
        echo node_modules/
        echo */node_modules/
        echo.
        echo # Build outputs
        echo backend/target/
        echo frontend/build/
        echo.
        echo # IDE files
        echo .idea/
        echo .vscode/
        echo *.iml
        echo.
        echo # OS files
        echo .DS_Store
        echo Thumbs.db
        echo.
        echo # Logs
        echo *.log
        echo logs/
        echo.
        echo # Environment files
        echo .env
        echo .env.local
        echo .env.development.local
        echo .env.test.local
        echo .env.production.local
        echo.
        echo # Database
        echo *.db
        echo *.sqlite
        echo.
        echo # Uploads (for local development)
        echo backend/uploads/
        echo uploads/
    ) > .gitignore
)

echo.
echo 🎯 Next steps for Render deployment:
echo 1. Push your code to GitHub repository
echo 2. Go to https://render.com and sign up/sign in
echo 3. Connect your GitHub repository
echo 4. Create a new Web Service from GitHub
echo 5. Select your repository and branch
echo 6. Choose 'Docker' as environment
echo 7. Set Docker context to './backend' for backend service
echo 8. Set Docker context to './frontend' for frontend service
echo 9. Deploy and monitor logs

echo.
echo 📋 Required Environment Variables for Render:
echo Backend Service:
echo - SPRING_PROFILES_ACTIVE=prod
echo - SPRING_DATASOURCE_URL=^<your-postgres-url^>
echo - SPRING_DATASOURCE_USERNAME=^<your-postgres-user^>
echo - SPRING_DATASOURCE_PASSWORD=^<your-postgres-password^>
echo - JWT_SECRET=^<your-jwt-secret^>
echo.
echo Frontend Service:
echo - REACT_APP_API_BASE_URL=^<your-backend-url^>
echo - NODE_ENV=production

echo.
echo "⚠️ IMPORTANT: File Storage on Render Free Plan"
echo "- Files will be lost when service restarts"
echo "- Use for demo/testing purposes only"
echo "- For production, consider upgrading to paid plan or external storage"
echo "- File endpoints: /uploads/avatar/, /uploads/blog/, /uploads/config/"

echo.
echo ✅ Render deployment preparation complete!
pause
