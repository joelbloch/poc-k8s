Import-Module KubernetesFunctions

Write-Host "Starting Central Session Management"
kubectl apply -f ./yaml/ingress-services.yaml
kubectl apply -f ./yaml/db-local.yaml
kubectl apply -f ./yaml/central-session-manager.yaml
WaitForPodsStarting -interval 1

Write-Host "Starting Stateful, Stateless and Front services"
kubectl apply -f ./yaml/app-server-stateful.yaml -f ./yaml/app-server-stateless.yaml -f ./yaml/web-server.yaml
WaitForPodsStarting -interval 1
kubectl get svc