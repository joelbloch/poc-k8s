function CreateK8sSecret() {
    [CmdletBinding()]
    param
    (        
        [String]$FileName,
        [String]$SecretName
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
$CredentialFile = $azConfig.registry.generatedfilename
$SecretName =   $azConfig.registry.k8ssecretname
CreateK8sSecret `
    -FileName $CredentialFile `
    -SecretName  $SecretName

# Create secret for accessing Azure File Share
$CredentialFile = $azConfig.fileshare.generatedfilename
$SecretName =   $azConfig.fileshare.k8ssecretname
CreateK8sSecret `
    -FileName $CredentialFile `
    -SecretName  $SecretName

# Install Nginx Ingress Controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v0.34.1/deploy/static/provider/cloud/deploy.yaml

