$azConfig = Get-Content -Path "..\azure-poc.config.json" | ConvertFrom-Json

#Create Resource Group
Write-Host "Creating Resource Group $azConfig.group.name"
az group create  --name  $azConfig.group.name `
                 --location $azConfig.group.location