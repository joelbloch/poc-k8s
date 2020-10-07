
# 1 - Introduction

The POC is composed of several modules.
- A docker image must be created for each module.
- The application can then be deployed and tested.

In this section, we describe how to deploy the POC on your local machine:
- PG service
- Modules of the POC as Docker Images
- Kubernetes Cluster based on the docker images
- APIs you can test to ensure the POC is running correctly on your computer

## 2.1 - Setup

### 2.1.1 Postgres for Windows

#### a) Download and install Postgres for Windows
Download and install Postgrs for Windows at the following address : `https://www.postgresql.org/download/windows/`
The exact steps for installing postgres for Windows are out of the scope of this document.
Set the admin user password to admin123.

#### b) Download and install PgAdmin4 for Windows
Download and install PgAdmin4 for Windows the following address : `https://www.pgadmin.org/download/pgadmin-4-windows/`
The exact steps for installing PgAdmin4 for Windows are out of the scope of this document.

#### c) Create a new database
Open PgAdmin4, and connect on the pg database running on your localhost.
Create a new database called pocsK8s.

#### d) Update the app-server configuration file if necessary
If you want to change the admin user name, password, or the database name, you can. Just update the file located at the following location:
- `/poc-k8s/app/config/local/app-server.config.json`
- edit the entry `db/local` with the info you provided for the fields `user`, `password`, and `database` :

```
db : {
    "location" : "local",
    "local" : {
        "user": "<ADMIN_USERNAME>",
        "password": "<ADMIN_PASSWORD>",
        "host": "pg-svc",
        "port": 5432,
        "database": "<DATABASE_NAME>"
    },
}
```
This configuration is used by the app server module to access the local database

#### e) Allow access to PG Service from Docker and Kubernetes Cluster

Kubernetes and Docker are considered as external machines to the PG Service, so we need to grant them access from the PG configuration. For the sake of simplicity, we will configure PG to accept all requests from all machines.

1 - Edit the file located at `C:\Program Files\PostgreSQL\10\data\pg_hba.conf`.
2 - Add the following line at the beginning of the list:
`host    all             all             0.0.0.0/0               trust`

You should have the following list:
```
# IPv4 local connections:
host    all             all             0.0.0.0/0               trust
host    all             all             127.0.0.1/32            md5
host    all             all             10.1.1.221/32           md5
```

3 - Restart the PG Windows service for the modification to take effect

### 2.1.2 Install Docker for Desktop

Install Docker for Desktop from the following URL : `https://hub.docker.com/editions/community/docker-ce-desktop-windows/`
Installation steps are out of the scope of this documentation. Still, you should know that it requires you enableing the virtualization in the BIOS of your computer.

Once Docker for Desktop is up and running, there is a new icon in the Windows tray : a whale.
You can right click on the icon and select `settings` to display... the settings.

#### a) Enable Kubernetes

Once Docker for Desktop is up and running, there is a new icon in the Windows tray : a whale.
1 - Right click on the icon and select `settings` to display... the settings.

2 - Press the Docker Engine button on the right, and enable the experimental features:
```
{
  "registry-mirrors": [],
  "insecure-registries": [],
  "debug": true,
  "experimental": true
}
```

3 - Press the Kubernetes button on the right, and check the checkbox `Enable Kubernetes`
4 - Press Apply and Docker will restart.

#### b) Check hosts Windows file

Installation of Docker for Desktop and Kubernetes should modify your hosts file located at : `C:\Windows\System32\drivers\etc\hosts` with 3 new entries:
- `host.docker.internal`
- `gateway.docker.internal`
- `kubernetes.docker.internal`
as Follow :

```
# Added by Docker Desktop
192.168.1.13 host.docker.internal
192.168.1.13 gateway.docker.internal
# To allow the same kube context to work on the host and the container:
127.0.0.1 kubernetes.docker.internal
# End of section
```

Open a DOS cmd, and type ipconfig, you should see one main Ethernet Card, and a Virtual Ethernet Card. The Virtual Ethernet Card is used by docker containers to reach the host.

This configuration is updated at each start-up, and as incredible as it sounds, may be wrong. Let explain what are those dns entries and what should be the correct ip addresses:
- `host.docker.internal`       => it is the dns entry indicating the host ip, used by Docker. The ip should be the ip address of your main Ethernet card.
- `gateway.docker.internal`    => Docker images use a virtual ethernet card to reach the host, it is the ip address of this virtual card.
- `kubernetes.docker.internal` => it is the dns entry indicating the host ip, used by Kubernetes. The ip should be the ip address of your main Ethernet card.

### 2.1.3 Build local docker images

The POC modules are located in the `\POC-k8s\app\modules` subfolders :
- `app-server`
- `web-server`
- `central-session-manager`
- `local-session-manager`
A Docker container image must be created for each module.
1 - Open a cmd terminal. You can either :
    - Go to each module subfolder, and type `npm run build-docker-local`. It will build each docker image one by one.
    - or go to the `\POC-k8s\app` folder, and type `npm run build-all-local` : it will build container images one after another.

### 2.1.4 Local File Sharing 

In order for the POC to work, we need to mount 2 folders for the docker images to use them:
- `\poc-K8s\log` : this folder is used by each pod to generate logs
- `\poc-K8s\app\config` : this folder is used by each module to reach configuration files

To enable file sharing with containers locally:
1 - Right-click on the docker tray icon, and select "Settings"
2 - Navigate to the "Resources" menu
3 - Navigate to the "File Sharing" sub-menu
4 - Use the + button to add the first folder, then again to add the second folder.
5 - Click on the 'Apply and Restart Docker" button to validate your changes

### 2.1.5 Install NGINX Ingress Controller
Kubernetes Ingress Service implements proxy services to reach the Kubernetes Cluster.
Ingress is a Kubernetes specification, implemented by several providers. We use the Nginx provider. To install the nginx implementation:
1 - Open a terminal
2 - Execute the following instruction:  `kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v0.34.1/deploy/static/provider/cloud/deploy.yaml`

Kubectl downloads the Nginx resources and instantiates them.

### 2.1.6 Setup of Powershell Module
Powershell scripts are defined as shortcuts to start and stop the POC in Kubernetes Cluster, as well as check the status of pods and services.
The Powershell scripts use a module provided with this POC. This module needs to be deployed for the scripts to run correctly:
1 - Copy the folder `\POC-K8S\resources\KubernetesFunctions`
2 - Paste the entire folder in `C:\Users\<your_win_username>\Documents\WindowsPowerShell\Modules` (replace <your_win_username> by the correct value in the path).

## 2.2 - Deploy
- Open a Terminal window and go to the folder `\POC-K8S\app\k8s\local`
- The following scripts are available:
  - `1-start-with-local-pg.ps1` => Runs the Kubernetes Cluster and the modules containers are being ran as pods. The local postgres instance is used.  
  - `2-start-with-azure-pg.ps1` => Runs the Kubernetes Cluster and the modules containers are being ran as pods. The azure postgres instance is used.  (out of scope of this documentation)
  - `3-stop.ps1`                => Stops the POC pod modules.
  - `4-list-pods.ps1`           => Lists the pods currently being instantiated.
  - `5-list-svc.ps1`            => List the services currently being instantiated.
  - `6-list-pod.status.ps1`     => List the details of each pod.

  Scripts are prefixed by disinct figures, so they are easy to execute : just type the figure, then tab and enter.

## 2.3 - Test
Once deployed, the following APIs can be accessed:
  
`http://localhost/webserver/ping`           => "Pong from Web Server" from Web Server pod  
`http://localhost/stateless/ping`           => "Pong from Applicaiton Server" from App Server Stateless pod  
`http://localhost/stateless/counter`        => Get Counter value from App Server Stateless pod  
`http://localhost/stateless/db`             => Get DB connection Status from App Server Stateless pod  
`http://localhost/stateful/ping`            => "Pong from Applicaiton Server" from App Server Stateful pod  
`http://localhost/stateful/counter`         => Get Counter value from App Server Stateful pod  
`http://localhost/stateful/db`              => Get DB connection Status from App Server Stateful pod  
`http://localhost/session-mgt/ping`         => "Pong from Central Session Manager" from Central Session Manager pod  
`http://localhost/session-mgt/pods`         => Get all the stateful pods registered to the Central Session Manager  
`http://localhost/session-mgt/sessions`     => Get all stateful sessions registered to the Central Session Manager  
`http://localhost/session-mgt/sessioncount` => Get the number of stateful sessions  
  
Successive calls to `http://localhost/stateless/counter` should not return successive counter values.  
Successive calls to `http://localhost/stateful/counter` from the same browser window should return successive counter values.  




