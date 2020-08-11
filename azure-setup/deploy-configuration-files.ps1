$azConfig = Get-Content -Path "./azure-poc.config.json" | ConvertFrom-Json
$storageName = $azConfig.filestorage.name
$shareName = $azConfig.filestorage.fileshare
$credentialFile = $azConfig.filestorage.generatedfilename
$credentials = Get-Content -Path $credentialFile | ConvertFrom-Json
$accountKey = $credentials.password 
$connectionString = $credentials.connectionstring

Write-Host "Uploading configuration file to Azure Fileshare with connection string $connectionString"

$files = Get-ChildItem -Path ..\app\config\azure\*.json -Name
foreach($file in $files) {
    Write-Host "Uploading $file to fileshare $shareName"
    az storage file upload `
        --share-name $shareName `
        --source ../app/config/azure/$file `
        --connection-string $connectionString
}