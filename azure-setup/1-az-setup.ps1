$azConfig = Get-Content -Path ".\azure-poc.config.json" | ConvertFrom-Json

#Create Resource Group
Write-Host "Creating Resource Group $azConfig.group.name"
az group create  --name  $azConfig.group.name `
                 --location $azConfig.group.location

#Create Azure Postgres Db
Write-Host "Creating Azure Postgres DB Service $azConfig.db.name"
az postgres server create --resource-group $azConfig.group.name `
                          --name $azConfig.db.name  `
                          --location $azConfig.db.location `
                          --admin-user $azConfig.db.admin.user `
                          --admin-password $azConfig.db.admin.password `
                          --sku-name $azConfig.db.sku

Write-Host "Creating Azure Postgres Database $azConfig.db.database on Server $azConfig.db.name"
az postgres db create --name $azConfig.db.database `
                      --resource-group $azConfig.group.name `
                      --server-name $azConfig.db.name

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

#Create Azure Kubernetes Service (AKS)
Write-Host "Creating Azure Kubernetes Service $azConfig.akscluster.name"
az aks create --resource-group $azConfig.group.name `
              --name $azConfig.akscluster.name `
              --node-count $azConfig.akscluster.nodecount `
              --enable-addons monitoring `
              --generate-ssh-keys `
              --attach-acr $azConfig.registry.name

              
#Create Storage Account
Write-Host "Creating Azure Storage Account $azConfig.filestorage.name"
az storage account create --name $azConfig.filestorage.name `
                          --resource-group $azConfig.group.name `
                          --sku Standard_LRS 


$fsConnectionString = $(az storage account show-connection-string `
                        -g $azConfig.group.name  `
                        -n $azConfig.filestorage.name -o tsv)

Write-Host "Creating Azure File Share $azConfig.fileshare on Account $azConfig.filestorage.name"
az storage share create `
        --name $azConfig.filestorage.fileshare `
        --connection-string $fsConnectionString

# Get storage account key
$fsstorageKey=$(az storage account keys list `
                        --resource-group $azConfig.group.name  `
                        --account-name $azConfig.filestorage.name  `
                        --query "[0].value" -o tsv)

#Save storage account credentials in file

Write-Host "Saving Azure File Share credentials in $azConfig.filestorage.generatedfilenamee"
if(Test-Path -Path $azConfig.filestorage.generatedfilename) {
    Remove-Item -Path $azConfig.filestorage.generatedfilename -Force
}
$FileStorageName = $azConfig.filestorage.name
@{login="$FileStorageName";password="$fsstorageKey"; connectionstring = "$fsConnectionString"} | ConvertTo-Json | Out-File -FilePath $azConfig.filestorage.generatedfilename
