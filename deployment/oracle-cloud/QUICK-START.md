# Quick Start - Deploy AlgarCatering to Oracle Cloud

## 🚀 One-Click Deployment

### Prerequisites (5 minutes)
1. **Oracle Cloud Account** - [Sign up here](https://cloud.oracle.com/en_US/tryit)
2. **Install OCI CLI**:
   ```bash
   # Windows (PowerShell)
   Invoke-WebRequest -Uri "https://raw.githubusercontent.com/oracle/oci-cli/master/scripts/install/install.ps1" | Invoke-Expression
   
   # Linux/Mac
   bash -c "$(curl -L https://raw.githubusercontent.com/oracle/oci-cli/master/scripts/install/install.sh)"
   ```

3. **Configure OCI CLI**:
   ```bash
   oci setup config
   ```

### Option 1: Automated Deployment (Recommended - 10 minutes)

```bash
# 1. Set your Oracle Cloud details
export OCI_COMPARTMENT_ID="ocid1.compartment.oc1..aaaaaaaa..." # Get from OCI Console
export OCI_REGION="us-ashburn-1"  # Choose your preferred region

# 2. Run the deployment script
cd AlgarCatering
chmod +x deployment/oracle-cloud/deploy-to-oci.sh
./deployment/oracle-cloud/deploy-to-oci.sh
```

**That's it!** The script will:
- ✅ Create OCI infrastructure (VCN, OKE cluster)
- ✅ Build and push Docker image to OCI Registry
- ✅ Deploy PostgreSQL database
- ✅ Deploy AlgarCatering application
- ✅ Provide you with the public URL

### Option 2: Simple VM Deployment (15 minutes)

If you prefer a simple virtual machine approach:

1. **Create a Compute Instance** in OCI Console:
   - Shape: VM.Standard.E4.Flex (2 OCPUs, 8GB RAM)
   - Image: Ubuntu 22.04
   - Add your SSH key

2. **Connect and setup**:
   ```bash
   # SSH to your instance
   ssh ubuntu@<your-instance-ip>
   
   # Install Docker
   sudo apt update && sudo apt install -y docker.io docker-compose
   sudo usermod -aG docker ubuntu
   newgrp docker
   
   # Clone and deploy
   git clone <your-repo-url> algarcatering
   cd algarcatering
   
   # Create environment file
   cat > .env << EOF
   NODE_ENV=production
   PORT=5000
   DATABASE_URL=postgresql://postgres:SecurePassword123@postgres:5432/algarcatering
   POSTGRES_PASSWORD=SecurePassword123
   JWT_SECRET=$(openssl rand -base64 64)
   SESSION_SECRET=$(openssl rand -base64 32)
   EOF
   
   # Start the application
   docker-compose up -d
   
   # Initialize database
   docker-compose exec app npm run db:migrate
   docker-compose exec app npm run db:seed
   ```

3. **Access your application**:
   - Open `http://<your-instance-ip>:5000` in your browser

### Option 3: Oracle Always Free Tier (Free!)

Perfect for testing and small deployments:

1. **Use Always Free resources**:
   - 2 Compute instances (1/8 OCPU each)
   - 2 Autonomous Databases
   - Load Balancer
   - 100GB Block Storage

2. **Follow Option 2 steps** but use the Always Free instance shape:
   - Shape: VM.Standard.E2.1.Micro (Always Free)

## 🔧 Configuration

### Environment Variables
```bash
# Required
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:pass@host:5432/algarcatering
JWT_SECRET=your-secure-jwt-secret-min-32-chars
SESSION_SECRET=your-secure-session-secret

# Optional
POSTGRES_PASSWORD=your-secure-db-password
REDIS_URL=redis://localhost:6379
ALLOWED_ORIGINS=https://yourdomain.com
```

### Database Setup
The application uses PostgreSQL. Choose one:

1. **Included PostgreSQL** (in Docker Compose) - Easiest
2. **Oracle Autonomous Database** - Managed, scalable
3. **External PostgreSQL** - Your own database service

### SSL/HTTPS Setup
For production:
1. Get a domain name
2. Configure OCI Load Balancer with SSL certificate
3. Update `ALLOWED_ORIGINS` environment variable

## 📊 Monitoring

### Basic Health Check
```bash
# Check if application is running
curl http://your-domain/api/health

# Check logs
docker-compose logs -f app  # For VM deployment
kubectl logs -f deployment/algarcatering-app -n algarcatering  # For Kubernetes
```

### Resource Usage
```bash
# VM deployment
docker stats

# Kubernetes deployment
kubectl top pods -n algarcatering
```

## 🔒 Security

### Default Security Features
- ✅ JWT authentication
- ✅ Environment-based configuration
- ✅ Database connection encryption
- ✅ CORS protection
- ✅ Input validation

### Additional Security (Recommended)
1. **Enable HTTPS** with SSL certificate
2. **Configure firewall** rules in OCI Security Lists
3. **Use Oracle Vault** for secret management
4. **Enable OCI Audit** logging
5. **Regular updates** of dependencies

## 💰 Cost Estimation

### Option 1: Always Free Tier
**Cost: $0/month** (within Always Free limits)
- Perfect for testing and small deployments

### Option 2: Small Production
**Cost: ~$30-50/month**
- 1 VM.Standard.E4.Flex (2 OCPUs, 8GB)
- 100GB Block Storage
- Load Balancer
- Outbound data transfer

### Option 3: Scalable Production
**Cost: ~$100-200/month**
- OKE cluster (2-4 nodes)
- Oracle Autonomous Database
- Load Balancer with SSL
- Monitoring and logging

## 🚨 Troubleshooting

### Common Issues

1. **"Permission denied" during deployment**
   ```bash
   # Fix OCI CLI permissions
   oci setup config --profile DEFAULT
   ```

2. **Docker image build fails**
   ```bash
   # Ensure you're in the project root directory
   cd AlgarCatering
   docker build -t algarcatering .
   ```

3. **Database connection errors**
   ```bash
   # Check if PostgreSQL is running
   docker-compose ps postgres
   
   # Check database logs
   docker-compose logs postgres
   ```

4. **Application not accessible**
   ```bash
   # Check OCI Security Lists allow HTTP/HTTPS traffic
   # Ensure ports 80/443 are open
   # Check application logs
   ```

### Getting Help
- Check the detailed [OCI Deployment Guide](./OCI-DEPLOYMENT-GUIDE.md)
- Oracle Cloud documentation
- Project GitHub issues

## 🎉 Next Steps

After successful deployment:

1. **Setup Domain & SSL**
   - Configure your domain DNS
   - Setup SSL certificate
   - Update environment variables

2. **Configure Backups**
   - Database backups
   - Application data backups

3. **Monitoring & Alerts**
   - Setup OCI Monitoring
   - Configure alerts for downtime

4. **Performance Optimization**
   - Enable caching
   - Configure CDN
   - Optimize database queries

---

**Need help?** Check our [detailed deployment guide](./OCI-DEPLOYMENT-GUIDE.md) or open an issue on GitHub.
