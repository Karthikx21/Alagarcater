# AlgarCatering - Oracle Cloud Infrastructure Deployment Guide

## Overview
This guide provides step-by-step instructions for deploying AlgarCatering to Oracle Cloud Infrastructure (OCI) using multiple deployment options.

## Prerequisites

### 1. Oracle Cloud Account
- Active OCI account with sufficient credits
- Compartment with appropriate permissions
- IAM user with necessary policies

### 2. Local Development Environment
```bash
# Install OCI CLI
curl -L https://raw.githubusercontent.com/oracle/oci-cli/master/scripts/install/install.sh | bash

# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl && sudo mv kubectl /usr/local/bin/

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh
```

### 3. Configure OCI CLI
```bash
oci setup config
# Follow prompts to configure your OCI credentials
```

## Deployment Options

### Option 1: Container Engine for Kubernetes (OKE) - Recommended

#### Quick Deployment
```bash
# Set required environment variables
export OCI_COMPARTMENT_ID="ocid1.compartment.oc1..your-compartment-id"
export OCI_REGION="us-ashburn-1"  # or your preferred region

# Run the automated deployment script
chmod +x deployment/oracle-cloud/deploy-to-oci.sh
./deployment/oracle-cloud/deploy-to-oci.sh
```

#### Manual Deployment Steps

1. **Create OKE Cluster**
```bash
# Create VCN
oci network vcn create \
    --compartment-id $OCI_COMPARTMENT_ID \
    --display-name "algarcatering-vcn" \
    --cidr-block "10.0.0.0/16"

# Create OKE cluster
oci ce cluster create \
    --compartment-id $OCI_COMPARTMENT_ID \
    --name "algarcatering-cluster" \
    --vcn-id $VCN_ID \
    --kubernetes-version "v1.28.2"
```

2. **Configure kubectl**
```bash
oci ce cluster create-kubeconfig \
    --cluster-id $CLUSTER_ID \
    --file ~/.kube/config \
    --region $OCI_REGION \
    --token-version 2.0.0
```

3. **Build and Push Docker Image**
```bash
# Login to OCI Registry
docker login <region>.ocir.io -u '<tenancy>/<username>'

# Build and push
docker build -t <region>.ocir.io/<tenancy>/algarcatering:latest .
docker push <region>.ocir.io/<tenancy>/algarcatering:latest
```

4. **Deploy Application**
```bash
# Create secrets
kubectl create namespace algarcatering
kubectl create secret generic app-secrets \
    --namespace=algarcatering \
    --from-literal=postgres-password="your-secure-password" \
    --from-literal=database-url="postgresql://postgres:password@postgres-service:5432/algarcatering" \
    --from-literal=jwt-secret="your-jwt-secret" \
    --from-literal=session-secret="your-session-secret"

# Deploy
kubectl apply -f deployment/oracle-cloud/oke-deployment.yaml
```

### Option 2: Compute Instance with Docker

#### 1. Create Compute Instance
```bash
# Create instance
oci compute instance launch \
    --compartment-id $OCI_COMPARTMENT_ID \
    --availability-domain $AVAILABILITY_DOMAIN \
    --display-name "algarcatering-server" \
    --image-id $UBUNTU_IMAGE_ID \
    --shape "VM.Standard.E4.Flex" \
    --shape-config '{"ocpus": 2, "memory_in_gbs": 8}' \
    --subnet-id $PUBLIC_SUBNET_ID \
    --ssh-authorized-keys-file ~/.ssh/id_rsa.pub
```

#### 2. Setup Server
```bash
# SSH to instance
ssh ubuntu@<instance-public-ip>

# Install Docker and Docker Compose
sudo apt update
sudo apt install -y docker.io docker-compose
sudo usermod -aG docker ubuntu

# Clone repository
git clone <your-repo-url> algarcatering
cd algarcatering
```

#### 3. Configure Environment
```bash
# Create .env file
cat > .env << EOF
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://postgres:your_password@postgres:5432/algarcatering
POSTGRES_PASSWORD=your_secure_password
JWT_SECRET=your_super_secure_jwt_secret_at_least_32_characters_long
SESSION_SECRET=your_secure_session_secret
EOF
```

#### 4. Deploy with Docker Compose
```bash
# Start services
docker-compose up -d

# Run database migrations
docker-compose exec app npm run db:migrate
docker-compose exec app npm run db:seed
```

### Option 3: Oracle Container Registry + Container Instances

#### 1. Push to OCI Registry
```bash
# Build image
docker build -t algarcatering .

# Tag for OCI Registry
docker tag algarcatering <region>.ocir.io/<tenancy>/algarcatering:latest

# Push to registry
docker push <region>.ocir.io/<tenancy>/algarcatering:latest
```

#### 2. Create Container Instance
```bash
oci container-instances container-instance create \
    --compartment-id $OCI_COMPARTMENT_ID \
    --display-name "algarcatering-instance" \
    --availability-domain $AVAILABILITY_DOMAIN \
    --shape "CI.Standard.E4.Flex" \
    --shape-config '{"ocpus": 1, "memory_in_gbs": 4}' \
    --containers '[{
        "displayName": "algarcatering",
        "imageUrl": "<region>.ocir.io/<tenancy>/algarcatering:latest",
        "environmentVariables": {
            "NODE_ENV": "production",
            "PORT": "5000",
            "DATABASE_URL": "your-database-url"
        }
    }]'
```

## Database Options

### Option 1: Oracle Autonomous Database
```bash
# Create autonomous database
oci db autonomous-database create \
    --compartment-id $OCI_COMPARTMENT_ID \
    --db-name "algarcatering" \
    --admin-password "YourSecurePassword123#" \
    --cpu-core-count 1 \
    --data-storage-size-in-tbs 1
```

### Option 2: Self-managed PostgreSQL
Use the PostgreSQL container in the Kubernetes deployment or Docker Compose setup.

### Option 3: External Database Service
Configure DATABASE_URL to point to your preferred database service.

## Security Configuration

### 1. Network Security
```bash
# Create security lists and rules
oci network security-list create \
    --compartment-id $OCI_COMPARTMENT_ID \
    --vcn-id $VCN_ID \
    --display-name "algarcatering-security-list" \
    --ingress-security-rules '[{
        "source": "0.0.0.0/0",
        "protocol": "6",
        "tcpOptions": {"destinationPortRange": {"min": 80, "max": 80}}
    }]'
```

### 2. SSL/TLS Setup
```bash
# Use OCI Load Balancer with SSL termination
oci lb load-balancer create \
    --compartment-id $OCI_COMPARTMENT_ID \
    --display-name "algarcatering-lb" \
    --shape-name "flexible" \
    --subnet-ids '["subnet-id-1", "subnet-id-2"]' \
    --is-private false
```

## Monitoring and Logging

### 1. Enable OCI Logging
```bash
# Create log group
oci logging log-group create \
    --compartment-id $OCI_COMPARTMENT_ID \
    --display-name "algarcatering-logs"
```

### 2. Application Monitoring
```bash
# Add to your Kubernetes deployment
kubectl apply -f - <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: monitoring-config
  namespace: algarcatering
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
    scrape_configs:
      - job_name: 'algarcatering'
        static_configs:
          - targets: ['algarcatering-service:5000']
EOF
```

## Scaling and Performance

### Auto Scaling
```bash
# Horizontal Pod Autoscaler
kubectl apply -f - <<EOF
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: algarcatering-hpa
  namespace: algarcatering
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: algarcatering-app
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
EOF
```

## Backup and Recovery

### Database Backup
```bash
# PostgreSQL backup using kubectl
kubectl exec -it postgres-pod -n algarcatering -- pg_dump -U postgres algarcatering > backup.sql

# Restore
kubectl exec -i postgres-pod -n algarcatering -- psql -U postgres algarcatering < backup.sql
```

## Troubleshooting

### Common Issues

1. **Image Pull Errors**
```bash
# Check OCI Registry authentication
kubectl get secret -n algarcatering
kubectl create secret docker-registry ocir-secret \
    --docker-server=<region>.ocir.io \
    --docker-username='<tenancy>/<username>' \
    --docker-password='<auth-token>'
```

2. **Database Connection Issues**
```bash
# Check database connectivity
kubectl exec -it algarcatering-pod -n algarcatering -- nc -zv postgres-service 5432
```

3. **Load Balancer Issues**
```bash
# Check service status
kubectl get svc -n algarcatering
kubectl describe svc algarcatering-service -n algarcatering
```

## Cost Optimization

### 1. Use Always Free Tier Resources
- 2 Oracle Autonomous Databases
- 2 Compute instances (1/8 OCPU each)
- 2 Block volumes (100 GB total)

### 2. Instance Scheduling
```bash
# Create instance schedule to stop/start instances
oci resource-manager stack create \
    --compartment-id $OCI_COMPARTMENT_ID \
    --display-name "instance-scheduler" \
    --config-source-zip-file-base64 $SCHEDULER_ZIP
```

## Production Checklist

- [ ] SSL/TLS certificates configured
- [ ] Database backups scheduled
- [ ] Monitoring and alerting setup
- [ ] Security groups configured
- [ ] Auto-scaling enabled
- [ ] Log aggregation configured
- [ ] Domain name configured
- [ ] CDN setup for static assets
- [ ] Health checks implemented
- [ ] Disaster recovery plan

## Support and Maintenance

### Regular Tasks
1. Update Docker images
2. Apply security patches
3. Monitor resource usage
4. Review logs for errors
5. Test backup/restore procedures

### Updates
```bash
# Update application
docker build -t <region>.ocir.io/<tenancy>/algarcatering:v1.1 .
docker push <region>.ocir.io/<tenancy>/algarcatering:v1.1
kubectl set image deployment/algarcatering-app algarcatering=<region>.ocir.io/<tenancy>/algarcatering:v1.1 -n algarcatering
```
