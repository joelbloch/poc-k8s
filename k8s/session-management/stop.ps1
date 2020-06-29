function WaitForPodsTerminaison() {
    [CmdletBinding()]
    param
    (        
        $interval
    )

    Write-Host "Wait for pods terminaison"

    [hashtable]$Return = @{} 

    $pods = $(kubectl get pods -o jsonpath='{.items[*].metadata.name}')
    $waitingonPod = "n"

    $counter = 0
    Do {
        $waitingonPod = ""
        Write-Host "---- Waiting until all pods are stopped ---"

        Start-Sleep -Seconds $interval
        $counter++
        $pods = $(kubectl get pods -o jsonpath='{.items[*].metadata.name}')

        if (!$pods) {
            Write-Host "All Pods were deleted, exiting"
            return ""
        } else {
            foreach ($pod in $pods.Split(" ")) {
                $podstatus = $(kubectl get pods $pod -o jsonpath='{.status.phase}')
                $waitingonPod = "${waitingonPod} ${pod} ${podstatus}`n"    
            }                
            Write-Host "Waiting... [$counter]"
            Write-Host $waitingonPod
        }
    }
    while (![string]::IsNullOrEmpty($waitingonPod) -and ($counter -lt 30) )

    kubectl get pods -o wide

    if ($counter -gt 29) {
        Write-Host "--- warnings in kubenetes event log ---"
        kubectl get events | grep "Warning" | tail    
    } 

    return $Return    
}

kubectl delete -f ./yaml/stateful.yaml -f ./yaml/stateless.yaml -f ./yaml/front.yaml -f ./yaml/central-session.yaml
WaitForPodsTerminaison -interval 1