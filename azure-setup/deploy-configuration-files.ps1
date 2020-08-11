$azConfig = Get-Content -Path "./azure-poc.config.json" | ConvertFrom-Json
$storageName = $azConfig.filestorage.name
$shareName = $azConfig.filestorage.fileshare
$credentialFile = $azConfig.filestorage.generatedfilename
$credentials = Get-Content -Path $credentialFile | ConvertFrom-Json

az storage file upload-batch `
    --connection-string $credentials.connectionstring `
    --source "../app/config/azure" `
    --destination ./$shareName