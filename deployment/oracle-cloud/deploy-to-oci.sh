#!/bin/bash

# Oracle Cloud Infrastructure (OCI) Deployment Script for AlgarCatering
# This script automates the deployment process to OCI

set -e

echo "🚀 Starting AlgarCatering deployment to Oracle Cloud Infrastructure..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="algarcatering"
NAMESPACE="algarcatering"
OCI_REGION="${OCI_REGION:-us-ashburn-1}"
COMPARTMENT_ID="${OCI_COMPARTMENT_ID}"
CLUSTER_NAME="${CLUSTER_NAME:-algarcatering-cluster}"

# Check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}Checking prerequisites...${NC}"
    
    command -v oci >/dev/null 2>&1 || { echo -e "${RED}❌ OCI CLI is required but not installed. Please install it first.${NC}" >&2; exit 1; }
    command -v kubectl >/dev/null 2>&1 || { echo -e "${RED}❌ kubectl is required but not installed. Please install it first.${NC}" >&2; exit 1; }
    command -v docker >/dev/null 2>&1 || { echo -e "${RED}❌ Docker is required but not installed. Please install it first.${NC}" >&2; exit 1; }
    
    # Check OCI configuration
    oci iam compartment list --limit 1 >/dev/null 2>&1 || { echo -e "${RED}❌ OCI CLI not configured properly. Run 'oci setup config' first.${NC}" >&2; exit 1; }
    
    echo -e "${GREEN}✅ All prerequisites met${NC}"
}

# Create OCI resources
create_oci_resources() {
    echo -e "${YELLOW}Creating OCI resources...${NC}"
    
    # Create VCN if it doesn't exist
    echo "Creating VCN..."
    VCN_ID=$(oci network vcn create \
        --compartment-id "$COMPARTMENT_ID" \
        --display-name "${APP_NAME}-vcn" \
        --cidr-block "10.0.0.0/16" \
        --query 'data.id' \
        --raw-output 2>/dev/null || true)
    
    if [ -z "$VCN_ID" ]; then
        echo "VCN might already exist, getting existing VCN..."
        VCN_ID=$(oci network vcn list \
            --compartment-id "$COMPARTMENT_ID" \
            --display-name "${APP_NAME}-vcn" \
            --query 'data[0].id' \
            --raw-output)
    fi
    
    echo "VCN ID: $VCN_ID"
    
    # Create OKE cluster
    echo "Creating OKE cluster..."
    CLUSTER_ID=$(oci ce cluster create \
        --compartment-id "$COMPARTMENT_ID" \
        --name "$CLUSTER_NAME" \
        --vcn-id "$VCN_ID" \
        --kubernetes-version "v1.28.2" \
        --wait-for-state ACTIVE \
        --query 'data.id' \
        --raw-output 2>/dev/null || true)
    
    if [ -z "$CLUSTER_ID" ]; then
        echo "Cluster might already exist, getting existing cluster..."
        CLUSTER_ID=$(oci ce cluster list \
            --compartment-id "$COMPARTMENT_ID" \
            --name "$CLUSTER_NAME" \
            --query 'data[0].id' \
            --raw-output)
    fi
    
    echo "Cluster ID: $CLUSTER_ID"
}

# Setup kubectl context
setup_kubectl() {
    echo -e "${YELLOW}Setting up kubectl context...${NC}"
    
    oci ce cluster create-kubeconfig \
        --cluster-id "$CLUSTER_ID" \
        --file ~/.kube/config \
        --region "$OCI_REGION" \
        --token-version 2.0.0 \
        --kube-endpoint PUBLIC_ENDPOINT
    
    kubectl config use-context context-$(echo $CLUSTER_ID | cut -c1-8)
    
    echo -e "${GREEN}✅ kubectl configured for OKE cluster${NC}"
}

# Build and push Docker image to OCI Registry
build_and_push_image() {
    echo -e "${YELLOW}Building and pushing Docker image...${NC}"
    
    # Create OCI Registry repository if it doesn't exist
    REGION_KEY=$(echo $OCI_REGION | cut -d'-' -f1-2)
    REGISTRY_URL="${REGION_KEY}.ocir.io"
    TENANCY_NAMESPACE=$(oci os ns get --query 'data' --raw-output)
    IMAGE_TAG="${REGISTRY_URL}/${TENANCY_NAMESPACE}/${APP_NAME}:latest"
    
    echo "Building Docker image..."
    docker build -t "$IMAGE_TAG" .
    
    echo "Logging into OCI Registry..."
    docker login "${REGISTRY_URL}" -u "${TENANCY_NAMESPACE}/$(oci iam user list --query 'data[0].name' --raw-output)"
    
    echo "Pushing image to OCI Registry..."
    docker push "$IMAGE_TAG"
    
    echo -e "${GREEN}✅ Image pushed to OCI Registry: $IMAGE_TAG${NC}"
    
    # Update deployment file with correct image
    sed -i "s|<YOUR_OCI_REGISTRY>/algarcatering:latest|${IMAGE_TAG}|g" deployment/oracle-cloud/oke-deployment.yaml
}

# Create Kubernetes secrets
create_secrets() {
    echo -e "${YELLOW}Creating Kubernetes secrets...${NC}"
    
    # Generate secrets if not provided
    if [ -z "$POSTGRES_PASSWORD" ]; then
        POSTGRES_PASSWORD=$(openssl rand -base64 32)
        echo "Generated POSTGRES_PASSWORD: $POSTGRES_PASSWORD"
    fi
    
    if [ -z "$JWT_SECRET" ]; then
        JWT_SECRET=$(openssl rand -base64 64)
        echo "Generated JWT_SECRET: $JWT_SECRET"
    fi
    
    if [ -z "$SESSION_SECRET" ]; then
        SESSION_SECRET=$(openssl rand -base64 32)
        echo "Generated SESSION_SECRET: $SESSION_SECRET"
    fi
    
    DATABASE_URL="postgresql://postgres:${POSTGRES_PASSWORD}@postgres-service:5432/algarcatering"
    
    # Create namespace
    kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -
    
    # Create secrets
    kubectl create secret generic app-secrets \
        --namespace="$NAMESPACE" \
        --from-literal=postgres-password="$POSTGRES_PASSWORD" \
        --from-literal=database-url="$DATABASE_URL" \
        --from-literal=jwt-secret="$JWT_SECRET" \
        --from-literal=session-secret="$SESSION_SECRET" \
        --dry-run=client -o yaml | kubectl apply -f -
    
    echo -e "${GREEN}✅ Secrets created${NC}"
}

# Deploy application
deploy_application() {
    echo -e "${YELLOW}Deploying application to Kubernetes...${NC}"
    
    kubectl apply -f deployment/oracle-cloud/oke-deployment.yaml
    
    echo "Waiting for deployment to be ready..."
    kubectl wait --for=condition=available --timeout=300s deployment/algarcatering-app -n "$NAMESPACE"
    
    echo -e "${GREEN}✅ Application deployed successfully${NC}"
}

# Get deployment information
get_deployment_info() {
    echo -e "${YELLOW}Getting deployment information...${NC}"
    
    # Get load balancer IP
    EXTERNAL_IP=""
    while [ -z "$EXTERNAL_IP" ]; do
        echo "Waiting for external IP..."
        EXTERNAL_IP=$(kubectl get svc algarcatering-service -n "$NAMESPACE" --template="{{range .status.loadBalancer.ingress}}{{.ip}}{{end}}")
        [ -z "$EXTERNAL_IP" ] && sleep 10
    done
    
    echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
    echo ""
    echo "=== Deployment Information ==="
    echo "Application URL: http://$EXTERNAL_IP"
    echo "Namespace: $NAMESPACE"
    echo "Database: PostgreSQL (internal cluster)"
    echo ""
    echo "To access your application:"
    echo "1. Open your browser and go to: http://$EXTERNAL_IP"
    echo "2. For HTTPS, configure a domain and SSL certificate"
    echo ""
    echo "To manage your deployment:"
    echo "kubectl get pods -n $NAMESPACE"
    echo "kubectl logs -f deployment/algarcatering-app -n $NAMESPACE"
}

# Main execution
main() {
    echo -e "${GREEN}🍽️  AlgarCatering OCI Deployment Script${NC}"
    echo "======================================"
    
    # Validate required environment variables
    if [ -z "$OCI_COMPARTMENT_ID" ]; then
        echo -e "${RED}❌ OCI_COMPARTMENT_ID environment variable is required${NC}"
        echo "Set it with: export OCI_COMPARTMENT_ID=<your-compartment-id>"
        exit 1
    fi
    
    check_prerequisites
    create_oci_resources
    setup_kubectl
    build_and_push_image
    create_secrets
    deploy_application
    get_deployment_info
}

# Run main function
main "$@"
