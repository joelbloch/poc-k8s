$azConfig = Get-Content -Path ".\azure-poc.config.json" | ConvertFrom-Json

# Sets the AKS cluster we created as the one we access with the next kubectl commands.
az aks get-credentials --name $azConfig.akscluster.name `
                       --resource-group $azConfig.group.name

# Create secret for accessing Azure Container Registry
Write-Host "Create Kubernetes Secret for accessing Azure Container Registry"
$CredentialFile = $azConfig.registry.generatedfilename
if(Test-Path -Path $CredentialFile) {
    $SecretName = $azConfig.registry.k8ssecretname | Out-String
    Write-Host "Secret Name : " + $SecretName
    $RegistryName = $azConfig.registry.name + ".azurecr.io"
    $Credentials = Get-Content -Path  $CredentialFile | Out-String | ConvertFrom-Json

    kubectl create secret docker-registry $azConfig.registry.k8ssecretname `
        --docker-server = $RegistryName `
        --docker-username = $Credentials.login `
        --docker-password = $Credentials.password
} else {
    Write-Host 'Credential file (' +  $CredentialFile + ') is not found'
}

# Create secret for accessing Azure File Share
Write-Host "Create secret for accessing Azure File Share"
$CredentialFile = $azConfig.filestorage.generatedfilename

if(Test-Path -Path $CredentialFile) {
    $Credentials = Get-Content -Path  $CredentialFile | Out-String | ConvertFrom-Json
    $SecretName =  $azConfig.filestorage.k8ssecretname

    Write-Host "Secret Name : " + $SecretName

    kubectl create secret generic $SecretName `
        --from-literal=azurestorageaccountname=$Credentials.login `
        --from-literal=azurestorageaccountkey=$Credentials.password
} else {
    Write-Host 'Credential file (' +  $CredentialFile  + ') is not found'
}

# Install Nginx Ingress Controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v0.34.1/deploy/static/provider/cloud/deploy.yaml

