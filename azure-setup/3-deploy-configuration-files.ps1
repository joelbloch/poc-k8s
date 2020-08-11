$azConfig = Get-Content -Path ".\azure-poc.config.json" | ConvertFrom-Json
$credentials = Get-Content -Path $azConfig.fileshare.generatedfilename | ConvertFrom-Json

az storage file upload-batch `
    --account-name $credentials.login `
    --account-key $credentials.passwords `
    --share-name $shareName `
    --source "../app/config/azure" `
    --destination "."