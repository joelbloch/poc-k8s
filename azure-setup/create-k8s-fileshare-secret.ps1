$azConfig = Get-Content -Path ".\azure-poc.config.json" | ConvertFrom-Json
$fileName = $azConfig.fileshare.generatedfilename

if(Test-Path $path -PathType $fileName) {
    $credentials = Get-Content -Path $fileName | ConvertFrom-Json
    kubectl create secret generic $azConfig.registry.k8ssecretname `
        --from-literal=azurestorageaccountname=$credentials.login `
        --from-literal=azurestorageaccountkey=$credentials.password
} else {
    Write-Host 'Credential file (' +  $fileName + ') is not found'
}