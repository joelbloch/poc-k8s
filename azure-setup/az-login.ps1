$AzCred = $host.ui.PromptForCredential("Need credentials", "Please enter your Azure user name and password.", "", "NetBiosUserName")
az login -u $AzCred.UserName -p $AzCred.Password