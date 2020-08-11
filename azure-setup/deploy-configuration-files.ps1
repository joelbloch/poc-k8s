$azConfig = Get-Content -Path "./azure-poc.config.json" | ConvertFrom-Json
$storageName = $azConfig.filestorage.name
$shareName = $azConfig.filestorage.fileshare

$credentialFile = $azConfig.fileshare.generatedfilename
$credentials = Get-Content -Path $credentialFile | ConvertFrom-Json

az storage file upload-batch `
    --account-name $storageName `
    --account-key $credentials.password `
    --share-name $shareName `
    --source "../app/config/azure" `
    --destination "./"