function CreateK8sSecret() {
    [CmdletBinding()]
    param
    (        
        $FileName,
        $SecretName
    )

    if(Test-Path -Path $FileName) {
        $Credentials = Get-Content -Path $FileName | ConvertFrom-Json
        kubectl create secret generic $SecretName `
            --from-literal=azurestorageaccountname=$Credentials.login `
            --from-literal=azurestorageaccountkey=$Credentials.password
    } else {
        Write-Host 'Credential file (' +  $FileName + ') is not found'
    }
}

$azConfig = Get-Content -Path ".\azure-poc.config.json" | ConvertFrom-Json

# Sets the AKS cluster we created as the one we access with the next kubectl commands.
az aks get-credentials --name $azConfig.akscluster.name `
                       --resource-group $azConfig.group.name

# Create secret for accessing Azure Container Registry
CreateK8sSecret `
    -FileName $azConfig.registry.generatedfilename `
    -SecretName  $azConfig.registry.k8ssecretname

# Create secret for accessing Azure File Share
CreateK8sSecret `
    -FileName $azConfig.fileshare.generatedfilename `
    -SecretName  $azConfig.fileshare.k8ssecretname

# Install Nginx Ingress Controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v0.34.1/deploy/static/provider/cloud/deploy.yaml

