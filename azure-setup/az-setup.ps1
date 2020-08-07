$azConfig = Get-Content -Path ".\azure-poc.config.json" | ConvertFrom-Json

#Create Resource Group
az group create  --name  $azConfig.group.name `
                 --location $azConfig.group.location

#Create Azure Postgres Db
az postgres server create --resource-group $azConfig.group.name `
                          --name $azConfig.db.name  `
                          --location $azConfig.db.location `
                          --admin-user $azConfig.db.admin.user `
                          --admin-password $azConfig.db.admin.password `
                          --sku-name $azConfig.db.sku

az postgres db create --name $azConfig.db.database `
                      --resource-group $azConfig.group.name `
                      --server-name $azConfig.db.name

#Create Azure Container Registry (ACR)
az acr create --resource-group $azConfig.group.name `
              --name $azConfig.registry.name `
              --sku Basic

$ACR_REGISTRY_ID=$(az acr show --name $azConfig.registry.name --query id --output tsv)

$sp_password=$(az ad sp create-for-rbac --name http://$azConfig.registry.serviceprincipal --scopes $ACR_REGISTRY_ID --role acrpush --query password --output tsv)
$sp_id=$(az ad sp show --id http://$azConfig.registry.serviceprincipal  --query appId --output tsv)

@{login="$sp_id";password="$sp_password"} | ConvertTo-Json | Out-File -FilePath $azConfig.registry.generatedfilename

#Create Azure Kubernetes Cluster (AKS)
az aks create --resource-group $azConfig.group.name `
              --name $azConfig.akscluster.name `
              --node-count $azConfig.akscluster.nodecount `
              --enable-addons monitoring `
              --generate-ssh-keys `
              --attach-acr $azConfig.registry.name

              
#Create Storage Account
az storage account create --name $azConfig.filestorage.name `
                          --resource-group $azConfig.group.name `
                          --sku Standard_LRS 

az storage share create --account-name $azConfig.filestorage.name `
                        --name $azConfig.filestorage.fileshare

                       
#export AZURE_STORAGE_CONNECTION_STRING=$(az storage account show-connection-string -n $AKS_PERS_STORAGE_ACCOUNT_NAME -g $AKS_PERS_RESOURCE_GROUP -o tsv)
                        
                        # Create the file share
#az storage share create -n $AKS_PERS_SHARE_NAME --connection-string $AZURE_STORAGE_CONNECTION_STRING
                        
                        # Get storage account key
$fsstorageKey=$(az storage account keys list --resource-group $azConfig.group.name  `
                                           --account-name $azConfig.filestorage.name  `
                                           --query "[0].value" -o tsv)

@{login="$azConfig.filestorage.name";password="$fsstorageKey"} | ConvertTo-Json | Out-File -FilePath $azConfig.filestorage.generatedfilename