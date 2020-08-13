$azConfig = Get-Content -Path "..\azure-poc.config.json" | ConvertFrom-Json

#Create Azure Container Registry (ACR)
Write-Host "Creating Azure Container Registry $azConfig.registry.name"
az acr create --resource-group $azConfig.group.name `
              --name $azConfig.registry.name `
              --sku Basic

$ACR_REGISTRY_ID=$(az acr show --name $azConfig.registry.name --query id --output tsv) 
$ACR_ServicePrincipal = $azConfig.registry.serviceprincipal

$sp_password=$(az ad sp create-for-rbac --name http://$ACR_ServicePrincipal --scopes $ACR_REGISTRY_ID --role acrpush --query password --output tsv)
$sp_id=$(az ad sp show --id http://$ACR_ServicePrincipal --query appId --output tsv)

Write-Host "Saving Azure Container Registry credentials in $azConfig.registry.generatedfilenamee"
if(Test-Path -Path $azConfig.registry.generatedfilename) {
    Remove-Item -Path $azConfig.registry.generatedfilename -Force
}
$acrname = $azConfig.registry.name
@{acrname = "$acrname"; login="$sp_id";password="$sp_password"} | ConvertTo-Json | Out-File -FilePath $azConfig.registry.generatedfilename
