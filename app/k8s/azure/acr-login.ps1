$credentials = Get-Content -Path acr.json | ConvertFrom-Json
$acrname = $credentials.acrname
$login = $credentials.login
$password = $credentials.password

#docker login $acr --username $login --password $password
az acr login --name $acrname --username $login --password $password