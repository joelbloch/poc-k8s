Remove-Item -Path ..\..\log\centralsession\session-log.txt
Remove-Item -Path ..\..\log\session\session-log.txt

kubectl apply -f ./stateful.yaml -f ./stateless.yaml -f ./front.yaml