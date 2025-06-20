#!/bin/bash

# Render Deploy Script for HealApp
echo "🚀 Preparing HealApp for Render deployment..."

# Check if we're in the right directory
if [ ! -f "render.yaml" ]; then
    echo "❌ Error: render.yaml not found. Please run this script from the project root."
    exit 1
fi

# Build and test backend locally first
echo "📦 Building backend..."
cd backend
mvn clean package -DskipTests
if [ $? -ne 0 ]; then
    echo "❌ Backend build failed!"
    exit 1
fi
cd ..

# Build frontend locally
echo "🎨 Building frontend..."
cd frontend
npm install
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed!"
    exit 1
fi
cd ..

echo "✅ Local builds successful!"

# Create .gitignore if it doesn't exist
if [ ! -f ".gitignore" ]; then
    echo "📝 Creating .gitignore..."
    cat > .gitignore << EOF
# Dependencies
node_modules/
*/node_modules/

# Build outputs
backend/target/
frontend/build/

# IDE files
.idea/
.vscode/
*.iml

# OS files
.DS_Store
Thumbs.db

# Logs
*.log
logs/

# Environment files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Database
*.db
*.sqlite

# Uploads (for local development)
backend/uploads/
uploads/
EOF
fi

echo "🎯 Next steps for Render deployment:"
echo "1. Push your code to GitHub repository"
echo "2. Go to https://render.com and sign up/sign in"
echo "3. Connect your GitHub repository"
echo "4. Create a new 'Web Service' from GitHub"
echo "5. Select your repository and branch"
echo "6. Choose 'Docker' as environment"
echo "7. Set build and start commands:"
echo "   - Build Command: Leave empty (Docker will handle this)"
echo "   - Start Command: Leave empty (Docker will handle this)"
echo "8. Set environment variables in Render dashboard"
echo "9. Deploy and monitor logs"

echo ""
echo "📋 Required Environment Variables for Render:"
echo "Backend Service:"
echo "- SPRING_PROFILES_ACTIVE=prod"
echo "- SPRING_DATASOURCE_URL=<your-postgres-url>"
echo "- SPRING_DATASOURCE_USERNAME=<your-postgres-user>"
echo "- SPRING_DATASOURCE_PASSWORD=<your-postgres-password>"
echo "- JWT_SECRET=<your-jwt-secret>"
echo ""
echo "Frontend Service:"
echo "- REACT_APP_API_BASE_URL=<your-backend-url>"
echo "- NODE_ENV=production"

echo ""
echo "✅ Render deployment preparation complete!"
