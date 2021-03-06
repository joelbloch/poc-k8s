# DEPLOYMENT AND TEST OF THE POC ON AZURE

The POC is composed of several modules : app-server, web-server, central-session-manager, local-session-manager.  
- A docker image must be created for each module.
- The docker images must be pushed to the Azure Container Registry
- The docker images configuration files must be copied to the azure file share.
  
The application can then be deployed and tested.  
  
## 1 - Setup Azure components to deploy the POC
We need to create the Azure Container Registry, Azure File Share, Azure Postgres Database and install the Nginx Ingress Controller on Azure.  
The Ingress Controller will route the traffic to the different services based on the URL requested, and managed the session affinity for stateful services.  
  
Navigate to the `\poc-k8s\azure-setup` and follow instructions listed in the readme.md, then come back here and follow the next step to proceed.  

## 2 - Deploy the POC Configuration files.  
  
1.1 - Use the Azure Cloud Shell Terminal Window on Azure you used to deploy Azure resources  
1.2 - Log on the Azure Portal and open a new Azure Cloud Shell Terminal Window.  
2 - Navigate to the `poc-k8s/az-setup` folder  
3 - Execute the script `deploy-configuration-files.ps1` to deploy the `/config/azure` files into the newly created file share.  
  
## 2 - Build and Push Docker images  
  
The POC modules are located in the `\POC-k8s\app\modules` subfolders :  
- `app-server`
- `web-server`
- `central-session-manager`
- `local-session-manager`
  
A Docker container image must be created for each module :  
  
1 - Open a cmd terminal on your local computer from VS Code. You can either :  
2.1 - Go to each module subfolder, and type `npm run build-docker-azure`. It will build each docker image one by one.  
2.2 - Or go to the `\POC-k8s\app` folder, and type `npm run build-all-azure` : it will build container images one after another.  
3 - Docker images must be pushed to the Azure Container Registry.  
    Unfortunately, you cannot push to images to an ACR if your computer uses the Wyde Network.  
    To be able to do it, you must either use a personal network.  
    From the `\POC-k8s\app` folder, type `npm run push-all-azure` to push all the images you created on the Azure Registry.  
  
You could have alternatively execute the command `npm run build-push-all-azure` to build and push all the images in one command.  
  
You can check the result as follow:  
- Go the Azure Portal, and navigate to the demoK8s Resource Group.
- Open the pock8sregistry.
- From the right menu, click on the Services => Repositories menu item. You should see the 4 images there : 
    - app-server
    - central-session-manager
    - local-session-manager
    - web-server

## 3 - Deploy the Application
  
1 - Log on the Azure Portal at `https://portal.azure.com`  
2 - Open a Powershell Terminal  
3 - Git clone the project if not already done, by typing `git clone https://github.com/joelbloch/poc-k8s.git`  
4 - Navigate to the `/POC-K8S/app/k8s/azure` directory  
    The following scripts are available:  
    - `2-start-with-azure-pg.ps1` => Runs the Kubernetes Cluster and the modules containers are being ran as pods. The azure postgres instance is used.  
    - `3-stop.ps1`                => Stops the POC pod modules.  
    - `4-list-pods.ps1`           => Lists the pods currently being instantiated.  
    - `5-list-svc.ps1`            => List the services currently being instantiated.  
    - `6-list-pod.status.ps1`     => List the details of each pod.  
  
    Scripts are prefixed by disinct figures, so they are easy to execute : just type the figure, then tab and enter.  
    Execute the `2-start-with-azure-pg.ps1` script to launch the POC.  
  
## 4 - Check Deployment
  
Use the script `5-list-svc.ps1` to get the list of services.  
The Ingress Service listed exposed a public IP Address. Use this IP Address in the following section to test the application.  
  
## 5 - Test
Once deployed, the following APIs can be accessed:  
  
Replace the <ipAddress> by the Ingress Service public address found at the precedent step.  
- `http://<ipAddress>/webserver/ping`           => "Pong from Web Server" from Web Server pod
- `http://<ipAddress>/stateless/ping`           => "Pong from Applicaiton Server" from App Server Stateless pod
- `http://<ipAddress>/stateless/counter`        => Get Counter value from App Server Stateless pod
- `http://<ipAddress>/stateless/db`             => Get DB connection Status from App Server Stateless pod
- `http://<ipAddress>/stateful/ping`            => "Pong from Applicaiton Server" from App Server Stateful pod
- `http://<ipAddress>/stateful/counter`         => Get Counter value from App Server Stateful pod
- `http://<ipAddress>/stateful/db`              => Get DB connection Status from App Server Stateful pod
- `http://<ipAddress>/session-mgt/ping`         => "Pong from Central Session Manager" from Central Session Manager pod
- `http://<ipAddress>/session-mgt/pods`         => Get all the stateful pods registered to the Central Session Manager
- `http://<ipAddress>/session-mgt/sessions`     => Get all stateful sessions registered to the Central Session Manager
- `http://<ipAddress>/session-mgt/sessioncount` => Get the number of stateful sessions
  
Successive calls to `http://<ipAddress>/stateless/counter` should not return successive counter values.  
Successive calls to `http://<ipAddress>/stateful/counter` from the same browser window should return successive counter values.  




