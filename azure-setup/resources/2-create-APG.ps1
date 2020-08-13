$azConfig = Get-Content -Path ".\azure-poc.config.json" | ConvertFrom-Json

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
