$azConfig = Get-Content -Path ".\azure-poc.config.json" | ConvertFrom-Json

#Create Azure Kubernetes Service (AKS)
Write-Host "Creating Azure Kubernetes Service $azConfig.akscluster.name"
az aks create --resource-group $azConfig.group.name `
              --name $azConfig.akscluster.name `
              --node-count $azConfig.akscluster.nodecount `
              --enable-addons monitoring `
              --generate-ssh-keys `
              --attach-acr $azConfig.registry.name