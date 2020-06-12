- Install Docker for Desktop on your computer
- Swith to Linux Containers if needed
- Enable Kubernetes => Settings => Kubernetes => Enable Kubernetes
- go to front subfolder, and execute the command npm run build-Docker
- go to back subfolder, and execute the command npm run build-Docker
- go to localsessionManager and sessionManager and execute the command npm run build-Docker
- Open Settings for Docker for Desktop => Resources => File Sharing. Add the /config/ingres /config/istio /log/stateless /log/stateful /log/front directories to allow sharing

Kubernetes files are located in k8s subfolder.

