$credentials = Get-Content -Path acr.json | ConvertFrom-Json
$acrname = $credentials.acrname + '.azurecr.io'
$login = $credentials.login
$password = $credentials.password

docker login $acrname --username $login --password $password
