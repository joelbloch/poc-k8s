$azConfig = Get-Content -Path ".\azure-poc.config.json" | ConvertFrom-Json

$AzCred = Get-Credential -UserName azConfig.login
az login -u $AzCred.UserName -p $AzCred.GetNetworkCredential().Password