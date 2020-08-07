$AzCred = Get-Credential -UserName joel.bloch@mphasis.com
az login -u $AzCred.UserName -p $AzCred.GetNetworkCredential().Password