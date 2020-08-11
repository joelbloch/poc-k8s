$azConfig = Get-Content -Path ".\azure-poc.config.json" | ConvertFrom-Json

$acrFileName = $azConfig.registry.generatedfilename
$afsFileName = $azConfig.filestorage.generatedfilename

download $acrFileName
download $afsFileName