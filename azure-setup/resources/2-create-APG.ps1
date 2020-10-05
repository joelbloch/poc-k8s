$azConfig = Get-Content -Path ".\azure-poc.config.json" | ConvertFrom-Json

#Create Azure Postgres Db
Write-Host "Creating Azure Postgres DB Service $azConfig.db.name"
az postgres server create --resource-group $azConfig.group.name `
                          --name $azConfig.db.name  `
                          --location $azConfig.db.location `
                          --admin-user $azConfig.db.admin.user `
                          --admin-password $azConfig.db.admin.password `
                          --sku-name $azConfig.db.sku

Write-Host "Disabling SSL connection for the POC"
az postgres server update --name $azConfig.db.database `
                        --resource-group $azConfig.group.name `
                        --ssl-enforcement Disabled

$DbName = $azConfig.db.name
$ServerName = $DbName +".postgres.database.azure.com"

Write-Host "Allowing all incoming requests from Azure"
az postgres server firewall-rule create --resource-group $DbName `
                                        --server-name $ServerName `
                                        --name AllowAllAzureIps `
                                        --start-ip-address 0.0.0.0 `
                                        --end-ip-address 0.0.0.0 `

Write-Host "Creating Azure Postgres Database $azConfig.db.database on Server $azConfig.db.name"
az postgres db create --name $azConfig.db.database `
                      --resource-group $azConfig.group.name `
                      --server-name $azConfig.db.name


