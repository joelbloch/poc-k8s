# POC K8s

## Installation steps

__Note__: For kubernetes needs, clone this repository at: d:/dev/poc-k8s

### 1) Docker setup

- Install Docker for Desktop on your computer
- Swith to Linux Containers if needed
- Open Docker for Desktop Settings by right-clicking on the tray icon, and select "Settings". Go to "Kubernetes" => check "Enable Kubernetes"

### 2) Docker configuration

- If need be, create the following folders:
    - log\centralsession
    - log\session
    - log\front
    - log\stateful
    - log\stateless
    
- Open Settings for Docker for Desktop => Resources => File Sharing. Add the following directories to allow sharing:
    - D:\dev\poc-k8s\config
    - D:\dev\poc-k8s\log


### 3) Build application images

- go to front subfolder, and execute the command `npm run build-docker`
- go to back subfolder, and execute the command `npm run build-docker`
- go to localsessionManager and sessionManager and execute the command `npm run build-docker`

### 4) Deploy on kubernetes

- You must have clone this repository at: d:/dev/poc-k8s
- Kubernetes files are located in __k8s__ subfolder.

For instance, go to [k8s/session-management](./k8s/session-management/readme.md) subfolder. Apply the readme.md

If the readme.md tells you to read this readme.md, try not to cycle in an infinite-loop.

