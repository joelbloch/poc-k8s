- Install Docker for Desktop on your computer
- Swith to Linux Containers if needed
- Open Docker for Desktop Settings by right-clicking on the tray icon, and select "Settings". Go to "Kubernetes" => check "Enable Kubernetes"
- If need be, create the following folders:
    - log\centralsession
    - log\session
    - log\front
    - log\stateful
    - log\stateless
- Open Settings for Docker for Desktop => Resources => File Sharing. Add the /config/ingres /config/istio /log/stateless /log/stateful /log/front directories to allow sharing
- go to front subfolder, and execute the command npm run build-Docker
- go to back subfolder, and execute the command npm run build-Docker
- go to localsessionManager and sessionManager and execute the command npm run build-Docker

Kubernetes files are located in k8s subfolder.
For instance, go to ./k8s/session-management subfolder. Apply the readme.txt
If the readme.txt tells you to read this readme.txt, try not to cycle in an infinite-loop.

