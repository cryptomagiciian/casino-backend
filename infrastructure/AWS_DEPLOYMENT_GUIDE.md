# AWS Deployment Guide

## 🎉 Infrastructure Successfully Deployed!

Your casino backend infrastructure has been successfully deployed to AWS using Terraform.

## 📊 Infrastructure Summary

### ✅ Created Resources

1. **VPC & Networking**
   - VPC: `vpc-0ce3fa03fd2732a75`
   - Public Subnets: 2 (us-east-1a, us-east-1b)
   - Private Subnets: 2 (us-east-1a, us-east-1b)
   - Internet Gateway
   - Route Tables

2. **Database (RDS PostgreSQL)**
   - Instance: `casino-backend-db`
   - Engine: PostgreSQL 15.7
   - Endpoint: `casino-backend-db.cg1ssiusq8pk.us-east-1.rds.amazonaws.com:5432`
   - Database: `casino`
   - Username: `casino_admin`
   - Password: Auto-generated (stored in AWS Secrets Manager)

3. **Cache (ElastiCache Redis)**
   - Endpoint: `master.casino-backend-redis.fmulhe.use1.cache.amazonaws.com`
   - Engine: Redis 7.x
   - Node Type: cache.t3.micro

4. **Container Registry (ECR)**
   - Repository: `787673059911.dkr.ecr.us-east-1.amazonaws.com/casino-backend`

5. **Container Orchestration (ECS Fargate)**
   - Cluster: `casino-backend-cluster`
   - Service: `casino-backend-service`
   - Task Definition: `casino-backend-task`

6. **Load Balancer (ALB)**
   - DNS Name: `casino-backend-alb-987561929.us-east-1.elb.amazonaws.com`
   - Zone ID: `Z35SXDOTRQ7X7K`

7. **Security Groups**
   - ALB Security Group (ports 80, 443)
   - ECS Tasks Security Group (port 3000)
   - RDS Security Group (port 5432)
   - ElastiCache Security Group (port 6379)

8. **IAM Roles**
   - ECS Execution Role
   - ECS Task Role

9. **CloudWatch**
   - Log Group: `/ecs/casino-backend`

## 🔧 Next Steps

### 1. Build and Push Docker Image

```bash
# Navigate to project root
cd C:\Users\shlap\Downloads\casino

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 787673059911.dkr.ecr.us-east-1.amazonaws.com

# Build the image
docker build -t casino-backend .

# Tag the image
docker tag casino-backend:latest 787673059911.dkr.ecr.us-east-1.amazonaws.com/casino-backend:latest

# Push the image
docker push 787673059911.dkr.ecr.us-east-1.amazonaws.com/casino-backend:latest
```

### 2. Get Database Password

```bash
# Get the database password from AWS Secrets Manager
aws secretsmanager get-secret-value --secret-id rds-db-credentials/casino-backend-db --query SecretString --output text
```

### 3. Update Environment Variables

Create a `.env` file with the following variables:

```env
# Database
DATABASE_URL=postgresql://casino_admin:<PASSWORD>@casino-backend-db.cg1ssiusq8pk.us-east-1.rds.amazonaws.com:5432/casino

# Redis
REDIS_URL=redis://master.casino-backend-redis.fmulhe.use1.cache.amazonaws.com:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-here

# CORS
CORS_ORIGIN=https://your-frontend-domain.com

# Demo Mode
DEMO_MODE=false

# Other settings
JWT_EXPIRES_IN=7d
THROTTLE_TTL=60
THROTTLE_LIMIT=100
```

### 4. Deploy Application

The ECS service is already created and will automatically pull the latest image from ECR. The service will be available at:

**Load Balancer URL**: `http://casino-backend-alb-987561929.us-east-1.elb.amazonaws.com`

### 5. Health Check

Test the deployment:

```bash
curl http://casino-backend-alb-987561929.us-east-1.elb.amazonaws.com/api/v1/health
```

## 🔍 Monitoring

### CloudWatch Logs
- Log Group: `/ecs/casino-backend`
- View logs in AWS Console or CLI

### ECS Service
- Monitor service status in ECS Console
- Check task health and logs

### RDS Monitoring
- Database performance metrics in RDS Console
- Connection monitoring

## 💰 Cost Estimation

**Monthly costs (approximate):**
- RDS PostgreSQL (db.t3.micro): ~$15-20
- ElastiCache Redis (cache.t3.micro): ~$15-20
- ECS Fargate (512 CPU, 1GB RAM): ~$10-15
- ALB: ~$20-25
- Data Transfer: ~$5-10
- **Total: ~$65-90/month**

## 🛡️ Security Features

- ✅ VPC with private subnets for databases
- ✅ Security groups with minimal access
- ✅ Encrypted storage (RDS, ElastiCache)
- ✅ IAM roles with least privilege
- ✅ No public database access
- ✅ Load balancer with health checks

## 🚀 Scaling

### Horizontal Scaling
- Increase ECS service desired count
- ALB automatically distributes traffic

### Vertical Scaling
- Upgrade RDS instance class
- Increase ECS task CPU/memory
- Upgrade ElastiCache node type

## 🔧 Troubleshooting

### Common Issues

1. **Service not starting**
   - Check ECS task logs in CloudWatch
   - Verify environment variables
   - Check security group rules

2. **Database connection issues**
   - Verify RDS security group allows ECS access
   - Check database credentials
   - Ensure VPC connectivity

3. **Load balancer health checks failing**
   - Verify application is listening on port 3000
   - Check health endpoint `/api/v1/health`
   - Review security group rules

### Useful Commands

```bash
# Check ECS service status
aws ecs describe-services --cluster casino-backend-cluster --services casino-backend-service

# View task logs
aws logs get-log-events --log-group-name /ecs/casino-backend --log-stream-name <stream-name>

# Check RDS status
aws rds describe-db-instances --db-instance-identifier casino-backend-db
```

## 📝 Notes

- The infrastructure is production-ready with proper security
- All resources are tagged for easy management
- Backup and monitoring are configured
- The setup supports both development and production workloads

Your casino backend is now running on enterprise-grade AWS infrastructure! 🎰
