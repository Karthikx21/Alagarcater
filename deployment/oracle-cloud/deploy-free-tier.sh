#!/bin/bash

# AlgarCatering Deployment Script for Oracle Always Free Tier
# Optimized for VM.Standard.E2.1.Micro (1/8 OCPU, 1GB RAM)

set -e

echo "🎯 Deploying AlgarCatering to Oracle Always Free Tier..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
APP_NAME="algarcatering"
DOMAIN="${DOMAIN:-localhost}"
EMAIL="${EMAIL:-admin@example.com}"

# Check if running on Oracle Cloud
check_oracle_cloud() {
    echo -e "${YELLOW}Checking Oracle Cloud environment...${NC}"
    
    if curl -s --connect-timeout 2 http://169.254.169.254/opc/v1/instance/ >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Running on Oracle Cloud Infrastructure${NC}"
        
        # Get instance information
        INSTANCE_INFO=$(curl -s http://169.254.169.254/opc/v1/instance/)
        echo "Instance Shape: $(echo "$INSTANCE_INFO" | jq -r '.shape // "unknown"')"
        echo "Instance Memory: $(free -h | awk '/^Mem:/ {print $2}')"
        echo "Instance Storage: $(df -h / | awk 'NR==2 {print $2}')"
    else
        echo -e "${YELLOW}⚠️ Not detected as Oracle Cloud instance${NC}"
    fi
}

# System optimization for 1GB RAM
optimize_system() {
    echo -e "${YELLOW}Optimizing system for limited resources...${NC}"
    
    # Configure swap (important for 1GB RAM)
    if [ ! -f /swapfile ]; then
        echo "Creating 1GB swap file..."
        sudo fallocate -l 1G /swapfile
        sudo chmod 600 /swapfile
        sudo mkswap /swapfile
        sudo swapon /swapfile
        echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    fi
    
    # Optimize system parameters
    cat << EOF | sudo tee /etc/sysctl.d/99-oci-free-tier.conf
# Oracle Cloud Free Tier optimizations
vm.swappiness=10
vm.vfs_cache_pressure=50
vm.dirty_ratio=10
vm.dirty_background_ratio=5
net.core.rmem_max=134217728
net.core.wmem_max=134217728
EOF
    
    sudo sysctl -p /etc/sysctl.d/99-oci-free-tier.conf
    
    echo -e "${GREEN}✅ System optimized for free tier${NC}"
}

# Install Docker and Docker Compose (optimized)
install_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${YELLOW}Installing Docker...${NC}"
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        sudo usermod -aG docker $USER
        
        # Optimize Docker for limited resources
        cat << EOF | sudo tee /etc/docker/daemon.json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2",
  "default-ulimits": {
    "nofile": {
      "Name": "nofile",
      "Hard": 64000,
      "Soft": 64000
    }
  }
}
EOF
        
        sudo systemctl restart docker
        sudo systemctl enable docker
        
        echo -e "${GREEN}✅ Docker installed and optimized${NC}"
    else
        echo -e "${GREEN}✅ Docker already installed${NC}"
    fi
    
    # Install Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${YELLOW}Installing Docker Compose...${NC}"
        sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
        echo -e "${GREEN}✅ Docker Compose installed${NC}"
    fi
}

# Setup application
setup_application() {
    echo -e "${YELLOW}Setting up AlgarCatering application...${NC}"
    
    # Create application directory
    sudo mkdir -p /opt/algarcatering
    sudo chown $USER:$USER /opt/algarcatering
    cd /opt/algarcatering
    
    # Clone or copy application (assuming source is available)
    if [ ! -d ".git" ]; then
        echo "Please ensure your application source code is in /opt/algarcatering"
        echo "You can copy it from your local machine or clone from repository"
        return 1
    fi
    
    # Use optimized environment file
    cp deployment/oracle-cloud/.env.free-tier .env
    
    # Generate secure secrets
    POSTGRES_PASSWORD=$(openssl rand -base64 32)
    JWT_SECRET=$(openssl rand -base64 64)
    SESSION_SECRET=$(openssl rand -base64 32)
    
    # Update environment file
    sed -i "s/your-secure-password/${POSTGRES_PASSWORD}/g" .env
    sed -i "s/your-super-secure-jwt-secret-min-32-chars/${JWT_SECRET}/g" .env
    sed -i "s/your-secure-session-secret/${SESSION_SECRET}/g" .env
    
    echo -e "${GREEN}✅ Application configured${NC}"
    
    # Save credentials securely
    cat > credentials.txt << EOF
AlgarCatering Credentials (Oracle Free Tier)
Generated: $(date)

Database Password: ${POSTGRES_PASSWORD}
JWT Secret: ${JWT_SECRET}
Session Secret: ${SESSION_SECRET}

Keep this file secure and backup safely!
EOF
    
    chmod 600 credentials.txt
    echo -e "${GREEN}✅ Credentials saved to credentials.txt${NC}"
}

# Deploy application
deploy_application() {
    echo -e "${YELLOW}Deploying AlgarCatering application...${NC}"
    
    cd /opt/algarcatering
    
    # Use the free tier optimized docker-compose
    cp deployment/oracle-cloud/docker-compose.free-tier.yml docker-compose.yml
    cp deployment/oracle-cloud/postgres-optimization.conf .
    
    # Build and start services
    docker-compose build --no-cache
    docker-compose up -d
    
    # Wait for services to be ready
    echo "Waiting for services to start..."
    sleep 30
    
    # Check if services are running
    if docker-compose ps | grep -q "Up"; then
        echo -e "${GREEN}✅ Services started successfully${NC}"
    else
        echo -e "${RED}❌ Some services failed to start${NC}"
        docker-compose logs
        return 1
    fi
    
    # Run database migrations
    echo "Running database migrations..."
    docker-compose exec -T app npm run db:migrate
    docker-compose exec -T app npm run db:seed
    
    echo -e "${GREEN}✅ Application deployed successfully${NC}"
}

# Setup monitoring
setup_monitoring() {
    echo -e "${YELLOW}Setting up basic monitoring...${NC}"
    
    # Create simple monitoring script
    cat > /opt/algarcatering/monitor.sh << 'EOF'
#!/bin/bash
# Simple monitoring script for AlgarCatering on Oracle Free Tier

LOG_FILE="/opt/algarcatering/monitor.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

# Check memory usage
MEM_USAGE=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
echo "[$DATE] Memory usage: $MEM_USAGE%" >> $LOG_FILE

# Check disk usage
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
echo "[$DATE] Disk usage: $DISK_USAGE%" >> $LOG_FILE

# Check if services are running
if ! docker-compose ps | grep -q "Up"; then
    echo "[$DATE] WARNING: Some services are down" >> $LOG_FILE
    # Restart services if needed
    docker-compose restart
fi

# Check application health
if ! curl -s http://localhost:5000/api/health >/dev/null; then
    echo "[$DATE] WARNING: Application health check failed" >> $LOG_FILE
fi

# Alert if memory usage is too high
if [ "${MEM_USAGE%.*}" -gt 90 ]; then
    echo "[$DATE] ALERT: High memory usage: $MEM_USAGE%" >> $LOG_FILE
fi

# Alert if disk usage is too high
if [ "$DISK_USAGE" -gt 85 ]; then
    echo "[$DATE] ALERT: High disk usage: $DISK_USAGE%" >> $LOG_FILE
fi
EOF
    
    chmod +x /opt/algarcatering/monitor.sh
    
    # Setup cron job for monitoring
    (crontab -l 2>/dev/null; echo "*/5 * * * * /opt/algarcatering/monitor.sh") | crontab -
    
    echo -e "${GREEN}✅ Basic monitoring setup complete${NC}"
}

# Setup firewall
setup_firewall() {
    echo -e "${YELLOW}Setting up firewall...${NC}"
    
    # Configure iptables for Oracle Cloud
    sudo iptables -I INPUT -p tcp --dport 5000 -j ACCEPT
    sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT
    sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT
    
    # Save iptables rules
    sudo iptables-save | sudo tee /etc/iptables/rules.v4
    
    echo -e "${GREEN}✅ Firewall configured${NC}"
}

# Get deployment information
get_deployment_info() {
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
    echo ""
    echo "=== AlgarCatering Deployment Information ==="
    echo ""
    echo "Application: AlgarCatering (Oracle Free Tier)"
    echo "Deployment Date: $(date)"
    echo ""
    echo "Services Status:"
    docker-compose ps
    echo ""
    echo "Memory Usage:"
    free -h
    echo ""
    echo "Disk Usage:"
    df -h /
    echo ""
    
    # Get public IP
    PUBLIC_IP=$(curl -s http://169.254.169.254/opc/v1/vnics/ | jq -r '.[0].publicIp // "Not available"')
    if [ "$PUBLIC_IP" != "Not available" ]; then
        echo "Public IP: $PUBLIC_IP"
        echo "Application URL: http://$PUBLIC_IP:5000"
    else
        echo "Application URL: http://localhost:5000"
    fi
    
    echo ""
    echo "=== Important Files ==="
    echo "Environment: /opt/algarcatering/.env"
    echo "Credentials: /opt/algarcatering/credentials.txt"
    echo "Logs: /opt/algarcatering/monitor.log"
    echo "Docker Compose: /opt/algarcatering/docker-compose.yml"
    echo ""
    echo "=== Management Commands ==="
    echo "View logs: cd /opt/algarcatering && docker-compose logs -f"
    echo "Restart app: cd /opt/algarcatering && docker-compose restart"
    echo "Stop app: cd /opt/algarcatering && docker-compose down"
    echo "Start app: cd /opt/algarcatering && docker-compose up -d"
    echo "Monitor: tail -f /opt/algarcatering/monitor.log"
    echo ""
    echo "=== Next Steps ==="
    echo "1. Configure your domain name to point to: $PUBLIC_IP"
    echo "2. Setup SSL certificate for HTTPS"
    echo "3. Configure Oracle Cloud Security Lists for port 5000"
    echo "4. Setup regular backups"
    echo ""
    echo -e "${GREEN}🍽️ AlgarCatering is now running on Oracle Cloud Always Free Tier!${NC}"
}

# Main execution
main() {
    echo -e "${GREEN}🎯 AlgarCatering Oracle Always Free Tier Deployment${NC}"
    echo "======================================================"
    
    check_oracle_cloud
    optimize_system
    install_docker
    setup_application
    deploy_application
    setup_monitoring
    setup_firewall
    get_deployment_info
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo -e "${RED}❌ Please don't run this script as root${NC}"
    echo "Run as a regular user with sudo privileges"
    exit 1
fi

# Run main function
main "$@"
