Import-Module KubernetesFunctions


Write-Host "Deleting Pods and Services"
kubectl delete -f ./yaml/db-local.yaml -f ./yaml/central-session-manager.yaml -f ./yaml/app-server-stateful.yaml -f ./yaml/app-server-stateless.yaml -f ./yaml/web-server.yaml
WaitForPodsTerminaison -interval 1