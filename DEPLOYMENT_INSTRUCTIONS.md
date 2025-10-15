# 🚀 AWS Deployment Instructions

## ✅ Infrastructure Status: READY

Your AWS infrastructure has been successfully deployed and configured! Here's what's ready:

### 🏗️ **Infrastructure Created:**
- ✅ VPC with public/private subnets
- ✅ RDS PostgreSQL 15.7 database
- ✅ ElastiCache Redis cluster
- ✅ ECR container registry
- ✅ ECS Fargate cluster and service
- ✅ Application Load Balancer
- ✅ Security groups and IAM roles
- ✅ CloudWatch logging

### 🔑 **Database Credentials:**
- **Host**: `casino-backend-db.cg1ssiusq8pk.us-east-1.rds.amazonaws.com:5432`
- **Database**: `casino`
- **Username**: `casino_admin`
- **Password**: `YourSecurePassword123!`

### 🌐 **Application URL:**
- **Load Balancer**: `http://casino-backend-alb-987561929.us-east-1.elb.amazonaws.com`

---

## 📋 **Next Steps to Complete Deployment:**

### 1. **Install Docker Desktop** (if not already installed)
- Download from: https://www.docker.com/products/docker-desktop/
- Install and restart your computer
- Verify installation: `docker --version`

### 2. **Run the Deployment Script**
```powershell
# Navigate to project root
cd C:\Users\shlap\Downloads\casino

# Run the deployment script
.\deploy-to-aws.ps1
```

**OR** run commands manually:

```powershell
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 787673059911.dkr.ecr.us-east-1.amazonaws.com

# Build the image
docker build -t casino-backend .

# Tag the image
docker tag casino-backend:latest 787673059911.dkr.ecr.us-east-1.amazonaws.com/casino-backend:latest

# Push to ECR
docker push 787673059911.dkr.ecr.us-east-1.amazonaws.com/casino-backend:latest
```

### 3. **Wait for Deployment** (2-3 minutes)
The ECS service will automatically pull the new image and deploy it.

### 4. **Test the Deployment**
```bash
# Health check
curl http://casino-backend-alb-987561929.us-east-1.elb.amazonaws.com/api/v1/health

# API documentation
curl http://casino-backend-alb-987561929.us-east-1.elb.amazonaws.com/api/docs
```

---

## 🔧 **Environment Configuration**

The application is configured with these environment variables:

```env
NODE_ENV=production
DATABASE_URL=postgresql://casino_admin:YourSecurePassword123!@casino-backend-db.cg1ssiusq8pk.us-east-1.rds.amazonaws.com:5432/casino
REDIS_URL=redis://master.casino-backend-redis.fmulhe.use1.cache.amazonaws.com:6379
JWT_SECRET=your-super-secure-jwt-secret-key-for-production-2024
JWT_EXPIRES_IN=7d
CORS_ORIGIN=*
DEMO_MODE=false
THROTTLE_TTL=60
THROTTLE_LIMIT=100
MASTER_WALLET_SEED=your-super-secure-master-wallet-seed-phrase-for-production
WITHDRAWAL_SECRET=your-super-secure-withdrawal-secret-for-production
LOG_LEVEL=info
```

---

## 📊 **Monitoring & Logs**

### **CloudWatch Logs:**
- Log Group: `/ecs/casino-backend`
- View in AWS Console: https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups/log-group/$252Fecs$252Fcasino-backend

### **ECS Service Status:**
- View in AWS Console: https://console.aws.amazon.com/ecs/home?region=us-east-1#/clusters/casino-backend-cluster/services

### **Database Monitoring:**
- View in AWS Console: https://console.aws.amazon.com/rds/home?region=us-east-1#database:id=casino-backend-db

---

## 🛡️ **Security Features**

- ✅ **VPC Isolation**: Database and cache in private subnets
- ✅ **Security Groups**: Minimal access rules
- ✅ **Encryption**: RDS and ElastiCache encrypted at rest
- ✅ **IAM Roles**: Least privilege access
- ✅ **Load Balancer**: Health checks and SSL termination ready
- ✅ **No Public Database Access**: Database only accessible from ECS tasks

---

## 💰 **Cost Estimation**

**Monthly costs (approximate):**
- RDS PostgreSQL (db.t3.micro): ~$15-20
- ElastiCache Redis (cache.t3.micro): ~$15-20
- ECS Fargate (512 CPU, 1GB RAM): ~$10-15
- ALB: ~$20-25
- Data Transfer: ~$5-10
- **Total: ~$65-90/month**

---

## 🚀 **Scaling Options**

### **Horizontal Scaling:**
```bash
# Scale ECS service to 3 instances
aws ecs update-service --cluster casino-backend-cluster --service casino-backend-service --desired-count 3
```

### **Vertical Scaling:**
- Upgrade RDS instance class (db.t3.small, db.t3.medium, etc.)
- Increase ECS task CPU/memory
- Upgrade ElastiCache node type

---

## 🔧 **Troubleshooting**

### **Common Issues:**

1. **Service not starting:**
   ```bash
   # Check ECS service status
   aws ecs describe-services --cluster casino-backend-cluster --services casino-backend-service
   
   # View task logs
   aws logs get-log-events --log-group-name /ecs/casino-backend --log-stream-name <stream-name>
   ```

2. **Database connection issues:**
   ```bash
   # Check RDS status
   aws rds describe-db-instances --db-instance-identifier casino-backend-db
   ```

3. **Load balancer health checks failing:**
   - Verify application is listening on port 3000
   - Check health endpoint `/api/v1/health`
   - Review security group rules

### **Useful Commands:**

```bash
# Check deployment status
aws ecs describe-services --cluster casino-backend-cluster --services casino-backend-service

# View recent logs
aws logs tail /ecs/casino-backend --follow

# Check database connectivity
aws rds describe-db-instances --db-instance-identifier casino-backend-db --query "DBInstances[0].DBInstanceStatus"
```

---

## 🎯 **Production Checklist**

Before going live:

- [ ] **Change default passwords** (JWT_SECRET, MASTER_WALLET_SEED, WITHDRAWAL_SECRET)
- [ ] **Set up SSL certificate** for HTTPS
- [ ] **Configure CORS_ORIGIN** to your frontend domain
- [ ] **Set up monitoring alerts** in CloudWatch
- [ ] **Configure backup retention** for RDS
- [ ] **Set up log retention** policies
- [ ] **Test all endpoints** thoroughly
- [ ] **Load test** the application
- [ ] **Set up CI/CD pipeline** for automated deployments

---

## 🎰 **Your Casino Backend is Ready!**

Once you complete the Docker deployment, your casino backend will be running on enterprise-grade AWS infrastructure with:

- **High Availability**: Multi-AZ deployment
- **Auto Scaling**: ECS Fargate with load balancer
- **Security**: VPC isolation and encryption
- **Monitoring**: CloudWatch logs and metrics
- **Backup**: Automated RDS backups

**Application URL**: `http://casino-backend-alb-987561929.us-east-1.elb.amazonaws.com`

Happy gaming! 🎲🎰
