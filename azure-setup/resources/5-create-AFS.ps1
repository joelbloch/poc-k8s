$azConfig = $null
$standalone = $FALSE

if(Test-Path -Path ".\azure-poc.config.json") {
    $azConfig = Get-Content -Path ".\azure-poc.config.json" | ConvertFrom-Json
} else {
    if(Test-Path -Path "..\azure-poc.config.json") {
        $azConfig = Get-Content -Path "..\azure-poc.config.json" | ConvertFrom-Json
        $standalone = $TRUE
    }
}

#Create Storage Account
Write-Host "Creating Azure Storage Account $azConfig.filestorage.name"
az storage account create --name $azConfig.filestorage.name `
                          --resource-group $azConfig.group.name `
                          --sku $azConfig.filestorage.sku `
                          --location  $azConfig.group.location


$fsConnectionString = $(az storage account show-connection-string `
                        -g $azConfig.group.name  `
                        -n $azConfig.filestorage.name -o tsv)

[System.Environment]::SetEnvironmentVariable("AZURE_STORAGE_CONNECTION_STRING", $fsConnectionString)

Write-Host "Creating Azure File Share $azConfig.fileshare on Account $azConfig.filestorage.name"
az storage share create `
        --name $azConfig.filestorage.fileshare `
        --connection-string $fsConnectionString

# Get storage account key
$fsstorageKey=$(az storage account keys list `
                        --resource-group $azConfig.group.name  `
                        --account-name $azConfig.filestorage.name  `
                        --query "[0].value" -o tsv)

#Save storage account credentials in file

Write-Host "Saving Azure File Share credentials in $azConfig.filestorage.generatedfilenamee"
if(Test-Path -Path $azConfig.filestorage.generatedfilename) {
    Remove-Item -Path $azConfig.filestorage.generatedfilename -Force
}
$FileStorageName = $azConfig.filestorage.name
$OutputFileName = $azConfig.filestorage.generatedfilename
if($standalone) {
    $OutputFileName = "../" + $OutputFileName
}
@{login="$FileStorageName";password="$fsstorageKey"; connectionstring = "$fsConnectionString"} | ConvertTo-Json | Out-File -FilePath $OutputFileName
