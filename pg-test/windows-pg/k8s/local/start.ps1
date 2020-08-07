Write-Host 'Deleting logs'

Remove-Item -Path ..\..\..\log\*.txt -Force -Recurse

Write-Host 'Logs have been deleted'

function WaitForPodsStarting() {
    [CmdletBinding()]
    param
    (        
        $interval
    )

    Write-Host "Wait for pods running"

    [hashtable]$Return = @{} 

    $pods = $(kubectl get pods -o jsonpath='{.items[*].metadata.name}')
    $waitingonPod = "n"

    $counter = 0
    Do {
        $waitingonPod = ""
        Write-Host "---- waiting until all pods are running ---"

        Start-Sleep -Seconds $interval
        $counter++
        $pods = $(kubectl get pods -o jsonpath='{.items[*].metadata.name}')

        if (!$pods) {
            throw "No pods were found"
        }

        foreach ($pod in $pods.Split(" ")) {
            $podstatus = $(kubectl get pods $pod -o jsonpath='{.status.phase}')
            if ($podstatus -eq "Running") {
                # nothing to do
            }
            elseif ($podstatus -eq "Pending") {                
                $containerReady = $(kubectl get pods $pod -o jsonpath="{.status.containerStatuses[0].ready}")
                if ($containerReady -ne "true" ) {
                    $containerStatus = $(kubectl get pods $pod -o jsonpath="{.status.containerStatuses[0].state.waiting.reason}")
                    if (![string]::IsNullOrEmpty(($containerStatus))) {
                        $waitingonPod = "${waitingonPod}${pod}($containerStatus)`n"    
                    }
                    else {
                        $waitingonPod = "${waitingonPod} ${pod} (container)`n"                        
                    }
                    # Write-Information -MessageData "container in $pod is not ready yet: $containerReady"
                }
            }
            else {
                $waitingonPod = "${waitingonPod} ${pod} => ($podstatus)`n" 
            }
        }
            
        Write-Host "Waiting... [$counter] $waitingonPod"
    }
    while (![string]::IsNullOrEmpty($waitingonPod) -and ($counter -lt 30) )

    kubectl get pods -o wide

    if ($counter -gt 29) {
        Write-Host "--- warnings in kubenetes event log ---"
        kubectl get events | grep "Warning" | tail    
    } 

    return $Return    
}

Write-Host "Starting App"
kubectl apply -f ./db.yaml -f ./deployment.yaml
WaitForPodsStarting -interval 1