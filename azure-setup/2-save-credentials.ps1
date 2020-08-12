
$azConfig = Get-Content -Path ".\azure-poc.config.json" | ConvertFrom-Json
$acr = $azConfig.registry.generatedfilename
$afs = $azConfig.filestorage.generatedfilename

download $acr
download $afs