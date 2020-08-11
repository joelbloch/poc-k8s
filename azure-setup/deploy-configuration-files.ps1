c$azConfig = Get-Content -Path "./azure-poc.config.json" | ConvertFrom-Json
$storageName = $azConfig.filestorage.name
$shareName = $azConfig.filestorage.fileshare
$credentialFile = $azConfig.filestorage.generatedfilename
$credentials = Get-Content -Path $credentialFile | ConvertFrom-Json
$accountKey = $credentials.password 
$connectionString = $credentials.connectionstring

Write-Host "Uploading configuration file to Azure Fileshare with connection string $connectionString"

Get-ChildItem -Path ..\app\config\azure\*.json -Name |  `
    az storage file upload `
        --share-name $shareName `
        --source ../app/config/azure/$_ `
        --connection-string $connectionString