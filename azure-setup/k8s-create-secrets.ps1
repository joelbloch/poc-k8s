function CreateK8sSecret() {
    [CmdletBinding()]
    param
    (        
        $FileName,
        $SecretName
    )

    if(Test-Path -PathType $FileName) {
        $Credentials = Get-Content -Path $FileName | ConvertFrom-Json
        kubectl create secret generic $SecretName `
            --from-literal=azurestorageaccountname=$Credentials.login `
            --from-literal=azurestorageaccountkey=$Credentials.password
    } else {
        Write-Host 'Credential file (' +  $FileName + ') is not found'
    }
}

$azConfig = Get-Content -Path ".\azure-poc.config.json" | ConvertFrom-Json

az aks get-credentials --name $azConfig.akscluster.name `
                       --resource-group $azConfig.group.name
CreateK8sSecret `
    -FileName $azConfig.registry.generatedfilename `
    -SecretName  $azConfig.registry.k8ssecretname

CreateK8sSecret `
    -FileName $azConfig.fileshare.generatedfilename `
    -SecretName  $azConfig.fileshare.k8ssecretname

