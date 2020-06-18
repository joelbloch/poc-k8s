0) Apply readme.txt

1) Reset Kubernetes Cluster from Docker for PC
Docker for Desktop => Settings => Kubernetes => Reset Kubernetes Cluster

2) Download Istio
- download from https://github.com/istio/istio/releases/tag/1.6.1 and unzip / copy on a local folder.
- add the bin subfolder in the path environment (ex : C:\Program Files (x86)\istio-1.6.0\bin)

3) Installation of Istio
istioctl install --set profile=demo
kubectl label namespace default istio-injection=enabled

4) Run the application
kubectl apply -f stateful.yaml
kubectl apply -f stateless.yaml
kubectl apply -f front.yaml

5) ensure your application is running
kubectl get pods
kubectl get services
troubleshooting => kubectl log <podname>

5) Dashboard
istioctl dashboard kiali

6) Test 
in your browser:
http://localhost:30000/ping                 => pong from front service
http://localhost:30000/stateless/ping       => pong from stateless service
http://localhost:30000/stateful/ping        => pong from stateful service
http://localhost:30000/stateless/counter    => counter value, should not be consecutive but increasing slowly
http://localhost:30000/stateful/counter     => counter value, should be consecutive


