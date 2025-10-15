# AWS Deployment Script for Casino Backend
# Run this script after installing Docker Desktop

Write-Host "🚀 Starting AWS deployment..." -ForegroundColor Green

# Check if Docker is installed
try {
    docker --version
    Write-Host "✅ Docker is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not installed. Please install Docker Desktop first." -ForegroundColor Red
    Write-Host "Download from: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
    exit 1
}

# Check if AWS CLI is configured
try {
    aws sts get-caller-identity
    Write-Host "✅ AWS CLI is configured" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CLI is not configured. Please run 'aws configure' first." -ForegroundColor Red
    exit 1
}

# ECR Repository URL
$ECR_REPO = "787673059911.dkr.ecr.us-east-1.amazonaws.com/casino-backend"
$REGION = "us-east-1"

Write-Host "📦 Logging into ECR..." -ForegroundColor Blue
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ECR_REPO

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to login to ECR" -ForegroundColor Red
    exit 1
}

Write-Host "🔨 Building Docker image..." -ForegroundColor Blue
docker build -t casino-backend .

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to build Docker image" -ForegroundColor Red
    exit 1
}

Write-Host "🏷️ Tagging image..." -ForegroundColor Blue
docker tag casino-backend:latest $ECR_REPO:latest

Write-Host "📤 Pushing image to ECR..." -ForegroundColor Blue
docker push $ECR_REPO:latest

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to push image to ECR" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Image successfully pushed to ECR!" -ForegroundColor Green
Write-Host "🎯 Your application will be available at:" -ForegroundColor Yellow
Write-Host "   http://casino-backend-alb-987561929.us-east-1.elb.amazonaws.com" -ForegroundColor Cyan

Write-Host "`n📋 Next steps:" -ForegroundColor Blue
Write-Host "1. The ECS service will automatically pull the new image" -ForegroundColor White
Write-Host "2. Wait 2-3 minutes for the deployment to complete" -ForegroundColor White
Write-Host "3. Test the health endpoint:" -ForegroundColor White
Write-Host "   curl http://casino-backend-alb-987561929.us-east-1.elb.amazonaws.com/api/v1/health" -ForegroundColor Cyan

Write-Host "`n🎰 Your casino backend is now deployed to AWS!" -ForegroundColor Green
