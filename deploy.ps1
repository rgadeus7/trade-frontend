# Trading Dashboard Deployment Script
# This script helps prepare your project for deployment to Vercel

Write-Host "🚀 Trading Dashboard Deployment Preparation" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

# Check if Git is initialized
if (-not (Test-Path ".git")) {
    Write-Host "📁 Initializing Git repository..." -ForegroundColor Yellow
    git init
    Write-Host "✅ Git repository initialized" -ForegroundColor Green
} else {
    Write-Host "✅ Git repository already exists" -ForegroundColor Green
}

# Check if dependencies are installed
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✅ Dependencies already installed" -ForegroundColor Green
}

# Build the project
Write-Host "🔨 Building the project..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build successful!" -ForegroundColor Green
    
    # Add all files to Git
    Write-Host "📝 Adding files to Git..." -ForegroundColor Yellow
    git add .
    
    # Check if there are changes to commit
    $status = git status --porcelain
    if ($status) {
        git commit -m "Build: Trading Dashboard ready for deployment"
        Write-Host "✅ Changes committed to Git" -ForegroundColor Green
    } else {
        Write-Host "ℹ️  No changes to commit" -ForegroundColor Blue
    }
    
    Write-Host ""
    Write-Host "🎉 Your project is ready for deployment!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Create a GitHub repository" -ForegroundColor White
    Write-Host "2. Add your GitHub repository as remote origin" -ForegroundColor White
    Write-Host "3. Push your code to GitHub" -ForegroundColor White
    Write-Host "4. Deploy to Vercel using the dashboard or CLI" -ForegroundColor White
    Write-Host ""
    Write-Host "For detailed instructions, see DEPLOYMENT.md" -ForegroundColor Cyan
    
} else {
    Write-Host "❌ Build failed! Please fix the errors and try again." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
