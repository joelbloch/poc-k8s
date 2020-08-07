# How to create and mount file share on Azure and Kubernetes

pock8sstorage
zPviX9Wp7B1xdsRFHkPSqURTHgH0ToukWiq586Q8apIMQlSrQi0lvxSzBba3LcbTHjl1WvPqt3x59vKlxscxqQ==

kubectl create secret generic pock8s-share-secret --from-literal=azurestorageaccountname=pock8sstorage --from-literal=zPviX9Wp7B1xdsRFHkPSqURTHgH0ToukWiq586Q8apIMQlSrQi0lvxSzBba3LcbTHjl1WvPqt3x59vKlxscxqQ==

STORAGE_KEY=$(az storage account keys list --resource-group pocK8s --account-name $AKS_PERS_STORAGE_ACCOUNT_NAME --query "[0].value" -o tsv)
