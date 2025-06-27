# AlgarCatering Oracle Cloud Deployment Script for Windows
# PowerShell script to deploy AlgarCatering to Oracle Cloud Infrastructure

param(
    [Parameter(Mandatory=$true)]
    [string]$CompartmentId,
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "us-ashburn-1",
    
    [Parameter(Mandatory=$false)]
    [string]$ClusterName = "algarcatering-cluster"
)

# Colors for output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Test-Prerequisites {
    Write-ColorOutput "🔍 Checking prerequisites..." $Yellow
    
    # Check if OCI CLI is installed
    try {
        $ociVersion = oci --version 2>$null
        Write-ColorOutput "✅ OCI CLI found: $ociVersion" $Green
    }
    catch {
        Write-ColorOutput "❌ OCI CLI not found. Please install it first." $Red
        Write-ColorOutput "Download from: https://docs.oracle.com/en-us/iaas/Content/API/SDKDocs/cliinstall.htm" $Yellow
        exit 1
    }
    
    # Check if kubectl is installed
    try {
        $kubectlVersion = kubectl version --client --short 2>$null
        Write-ColorOutput "✅ kubectl found" $Green
    }
    catch {
        Write-ColorOutput "❌ kubectl not found. Installing..." $Yellow
        # Install kubectl using chocolatey if available, otherwise provide instructions
        if (Get-Command choco -ErrorAction SilentlyContinue) {
            choco install kubernetes-cli -y
        }
        else {
            Write-ColorOutput "Please install kubectl manually:" $Red
            Write-ColorOutput "https://kubernetes.io/docs/tasks/tools/install-kubectl-windows/" $Yellow
            exit 1
        }
    }
    
    # Check if Docker is installed
    try {
        $dockerVersion = docker --version 2>$null
        Write-ColorOutput "✅ Docker found: $dockerVersion" $Green
    }
    catch {
        Write-ColorOutput "❌ Docker not found. Please install Docker Desktop first." $Red
        Write-ColorOutput "Download from: https://www.docker.com/products/docker-desktop" $Yellow
        exit 1
    }
    
    # Test OCI CLI configuration
    try {
        oci iam compartment list --limit 1 | Out-Null
        Write-ColorOutput "✅ OCI CLI configured properly" $Green
    }
    catch {
        Write-ColorOutput "❌ OCI CLI not configured. Please run 'oci setup config' first." $Red
        exit 1
    }
}

function New-OCIResources {
    Write-ColorOutput "🏗️ Creating OCI resources..." $Yellow
    
    # Create VCN
    Write-ColorOutput "Creating VCN..." $Yellow
    try {
        $vcnResult = oci network vcn create `
            --compartment-id $CompartmentId `
            --display-name "algarcatering-vcn" `
            --cidr-block "10.0.0.0/16" `
            --wait-for-state AVAILABLE 2>$null | ConvertFrom-Json
        
        $script:VcnId = $vcnResult.data.id
        Write-ColorOutput "✅ VCN created: $script:VcnId" $Green
    }
    catch {
        Write-ColorOutput "VCN might already exist, attempting to find existing..." $Yellow
        $existingVcn = oci network vcn list `
            --compartment-id $CompartmentId `
            --display-name "algarcatering-vcn" | ConvertFrom-Json
        
        if ($existingVcn.data.Count -gt 0) {
            $script:VcnId = $existingVcn.data[0].id
            Write-ColorOutput "✅ Using existing VCN: $script:VcnId" $Green
        }
        else {
            Write-ColorOutput "❌ Failed to create or find VCN" $Red
            exit 1
        }
    }
    
    # Create OKE cluster (simplified - in production you'd want subnets, etc.)
    Write-ColorOutput "Creating OKE cluster..." $Yellow
    Write-ColorOutput "⚠️ Note: This is a simplified setup. For production, configure networking properly." $Yellow
}

function Set-KubectlContext {
    param([string]$ClusterId)
    
    Write-ColorOutput "🔧 Setting up kubectl context..." $Yellow
    
    try {
        oci ce cluster create-kubeconfig `
            --cluster-id $ClusterId `
            --file "$env:USERPROFILE\.kube\config" `
            --region $Region `
            --token-version "2.0.0" `
            --kube-endpoint PUBLIC_ENDPOINT
        
        Write-ColorOutput "✅ kubectl configured for OKE cluster" $Green
    }
    catch {
        Write-ColorOutput "❌ Failed to configure kubectl" $Red
        exit 1
    }
}

function Build-AndPushImage {
    Write-ColorOutput "🐳 Building and pushing Docker image..." $Yellow
    
    # Get tenancy namespace
    $tenancyNamespace = (oci os ns get | ConvertFrom-Json).data
    $regionKey = $Region.Split('-')[0..1] -join '-'
    $registryUrl = "$regionKey.ocir.io"
    $imageTag = "$registryUrl/$tenancyNamespace/algarcatering:latest"
    
    Write-ColorOutput "Building Docker image..." $Yellow
    try {
        docker build -t $imageTag .
        if ($LASTEXITCODE -ne 0) {
            throw "Docker build failed"
        }
        Write-ColorOutput "✅ Docker image built successfully" $Green
    }
    catch {
        Write-ColorOutput "❌ Failed to build Docker image" $Red
        exit 1
    }
    
    Write-ColorOutput "Pushing image to OCI Registry..." $Yellow
    Write-ColorOutput "⚠️ You may be prompted to login to OCI Registry" $Yellow
    
    try {
        docker push $imageTag
        if ($LASTEXITCODE -ne 0) {
            throw "Docker push failed"
        }
        Write-ColorOutput "✅ Image pushed to OCI Registry: $imageTag" $Green
    }
    catch {
        Write-ColorOutput "❌ Failed to push image. Please check your OCI Registry authentication." $Red
        Write-ColorOutput "Login with: docker login $registryUrl" $Yellow
        exit 1
    }
    
    return $imageTag
}

function New-KubernetesSecrets {
    Write-ColorOutput "🔐 Creating Kubernetes secrets..." $Yellow
    
    # Generate secure passwords
    $PostgresPassword = [System.Web.Security.Membership]::GeneratePassword(32, 8)
    $JwtSecret = [System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes([System.Web.Security.Membership]::GeneratePassword(64, 16)))
    $SessionSecret = [System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes([System.Web.Security.Membership]::GeneratePassword(32, 8)))
    
    $DatabaseUrl = "postgresql://postgres:$PostgresPassword@postgres-service:5432/algarcatering"
    
    Write-ColorOutput "Generated secure passwords" $Green
    
    # Create namespace
    kubectl create namespace algarcatering --dry-run=client -o yaml | kubectl apply -f -
    
    # Create secrets
    kubectl create secret generic app-secrets `
        --namespace=algarcatering `
        --from-literal=postgres-password="$PostgresPassword" `
        --from-literal=database-url="$DatabaseUrl" `
        --from-literal=jwt-secret="$JwtSecret" `
        --from-literal=session-secret="$SessionSecret" `
        --dry-run=client -o yaml | kubectl apply -f -
    
    Write-ColorOutput "✅ Secrets created in Kubernetes" $Green
}

function Deploy-Application {
    param([string]$ImageTag)
    
    Write-ColorOutput "🚀 Deploying application to Kubernetes..." $Yellow
    
    # Update deployment file with correct image
    $deploymentPath = "deployment\oracle-cloud\oke-deployment.yaml"
    if (Test-Path $deploymentPath) {
        (Get-Content $deploymentPath) -replace '<YOUR_OCI_REGISTRY>/algarcatering:latest', $ImageTag | Set-Content $deploymentPath
        
        kubectl apply -f $deploymentPath
        
        Write-ColorOutput "Waiting for deployment to be ready..." $Yellow
        kubectl wait --for=condition=available --timeout=300s deployment/algarcatering-app -n algarcatering
        
        Write-ColorOutput "✅ Application deployed successfully" $Green
    }
    else {
        Write-ColorOutput "❌ Deployment file not found: $deploymentPath" $Red
        exit 1
    }
}

function Get-DeploymentInfo {
    Write-ColorOutput "📋 Getting deployment information..." $Yellow
    
    # Wait for external IP
    $externalIp = ""
    $attempts = 0
    $maxAttempts = 30
    
    while ([string]::IsNullOrEmpty($externalIp) -and $attempts -lt $maxAttempts) {
        Write-ColorOutput "Waiting for external IP... (attempt $($attempts + 1)/$maxAttempts)" $Yellow
        Start-Sleep -Seconds 10
        
        try {
            $serviceInfo = kubectl get svc algarcatering-service -n algarcatering -o json | ConvertFrom-Json
            if ($serviceInfo.status.loadBalancer.ingress) {
                $externalIp = $serviceInfo.status.loadBalancer.ingress[0].ip
            }
        }
        catch {
            # Continue waiting
        }
        
        $attempts++
    }
    
    if (![string]::IsNullOrEmpty($externalIp)) {
        Write-ColorOutput "`n🎉 Deployment completed successfully!" $Green
        Write-ColorOutput "=================================" $Green
        Write-ColorOutput "Application URL: http://$externalIp" $Green
        Write-ColorOutput "Namespace: algarcatering" $Yellow
        Write-ColorOutput "Database: PostgreSQL (internal cluster)" $Yellow
        Write-ColorOutput "`nTo access your application:" $Yellow
        Write-ColorOutput "1. Open your browser and go to: http://$externalIp" $Yellow
        Write-ColorOutput "2. For HTTPS, configure a domain and SSL certificate" $Yellow
        Write-ColorOutput "`nTo manage your deployment:" $Yellow
        Write-ColorOutput "kubectl get pods -n algarcatering" $Yellow
        Write-ColorOutput "kubectl logs -f deployment/algarcatering-app -n algarcatering" $Yellow
    }
    else {
        Write-ColorOutput "⚠️ External IP not available yet. Check later with:" $Yellow
        Write-ColorOutput "kubectl get svc algarcatering-service -n algarcatering" $Yellow
    }
}

# Main execution
function Main {
    Write-ColorOutput "🍽️ AlgarCatering Oracle Cloud Deployment" $Green
    Write-ColorOutput "========================================" $Green
    Write-ColorOutput "Compartment ID: $CompartmentId" $Yellow
    Write-ColorOutput "Region: $Region" $Yellow
    Write-ColorOutput "Cluster Name: $ClusterName" $Yellow
    Write-ColorOutput ""
    
    # Add required assembly for password generation
    Add-Type -AssemblyName System.Web
    
    Test-Prerequisites
    
    Write-ColorOutput "⚠️ Note: This script provides a simplified deployment." $Yellow
    Write-ColorOutput "For production use, please review the full deployment guide." $Yellow
    Write-ColorOutput ""
    
    # For this simplified version, we'll focus on the containerized deployment
    Write-ColorOutput "This script will help you deploy using Docker Compose on a VM." $Yellow
    Write-ColorOutput "For full OKE deployment, please use the bash script or follow the manual steps." $Yellow
    
    # $imageTag = Build-AndPushImage
    # New-KubernetesSecrets
    # Deploy-Application $imageTag
    # Get-DeploymentInfo
    
    Write-ColorOutput "`n✅ Prerequisites check completed!" $Green
    Write-ColorOutput "`nNext steps:" $Yellow
    Write-ColorOutput "1. Create a Compute Instance in OCI" $Yellow
    Write-ColorOutput "2. SSH to the instance and run:" $Yellow
    Write-ColorOutput "   git clone <your-repo> algarcatering" $Yellow
    Write-ColorOutput "   cd algarcatering" $Yellow
    Write-ColorOutput "   docker-compose up -d" $Yellow
    Write-ColorOutput "`nFor detailed instructions, see: deployment\oracle-cloud\QUICK-START.md" $Yellow
}

# Run the main function
Main
