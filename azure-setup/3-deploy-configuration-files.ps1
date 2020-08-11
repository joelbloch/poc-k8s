$azConfig = Get-Content -Path "./azure-poc.config.json" | ConvertFrom-Json
$credentialFile = $azConfig.fileshare.generatedfilename
$credentials = Get-Content -Path $credentialFile | ConvertFrom-Json

. ./0-as-login.ps1

$storageName = $azConfig.filestorage.name
$shareName = azConfig.filestorage.fileshare
az storage file upload-batch `
    --account-name $storageName `
    --account-key $credentials.password `
    --share-name $shareName `
    --source "../app/config/azure" `
    --destination "./"