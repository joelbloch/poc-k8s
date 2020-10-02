# What to prepare for Azure

To run any Kubernetes Cluster in Azure, we need the following components:
- an Azure Container Registry (ACR) to store the Docker Images.
- an Azure Kubernetes Cluster Service (AKS) to run Docker Containers.

On top of this, the POC uses the following components:
- an Azure File Share (AFS): a location where are stored the configuration files for the different modules of the POC.
- an Azure Postgres Database (APD), accessed at runtime by the POC.

Most of the applications will use all these components, this is why they are used by the demo app.

# Folder Content

- `azure-poc.config.json` : contains configuration of all the parts to be installed on Azure.
- `az-login.ps1` : allows connecting to the azure subscription from your local machine.
- `1-az-setup.ps1` : 
    - setups all the modules
    - generates credentials file for Azure Container Registry in `./credentials/acr.json`
    - generate credentials file for Azure File Share in `./credentials/fs.json`
- `2-k8s-setup.ps1` : create kubernetes secrets based on generated credentials for accessing Container Registry and File Share, and install Nginx Controller Implementation.
- `3-save-credentials.ps1`: it will save the credentials generated to access the Azure File Share (AFS) and Azure Container Registry. 
    You will be prompted for location, choose the folder `/poc-k8s/app/k8s/azure`.
- `deploy-configuration-files.ps1` : deploys the configuration files located in `/POC-K8S/app/config/azure/` folder into the newly created AFS.
- `az-setup-all.ps1` : shorcut for invoking all the scripts above.

# Installation Steps

1 - Log in on Azure Portal : https://portal.azure.com
2 - Open a Powershell Terminal. 
    - You cannot open a Terminal if you are on the Wyde network. You need to access Azure either from a personal network, or from the Juliet server on the US.
    - Once opened, be sure to select Powershell mode, rather than bash mode : it is selectable on the combo box on the top left corner of the Terminal.
3 - Git clone this project on your account by executing `git clone https://github.com/joelbloch/poc-k8s.git`
4 - Go to the `/poc-k8s/azure-setup` folder.
5 - Adjust the `azure-poc.config.json` if you want to change settings, such as:
    - Component names : resource group name, aks name, acr name, fileshare name
    - Location
    - skus of Kubernetes nodes, Postgres database
    - etc.
(6 - If you modified values on the azure-poc.config.json, we need to change the templates and yaml files for the POC. It will be covered by a powershell script in further deliveries of this project, but not right now, so it is better not to change anything)

6 - Execute `1-az-setup.ps1`
        This script does everthing: create the resource group, the container registry, the kubernetes cluster, the postgres database, the fileshare, links everything.
        The execution is rather long, so you can definitely go for a coffee : a long and hot americano. Drink slowly, with little sips.
        This script generates 2 files in the ./credentials subfolder.
        You will be prompted to save the 2 files one after another. Save them on your local computer in the `/poc-k8s/app/k8s/azure` folder
7 - Execute the script `2-k8s-setup.ps1`, which:
    - Creates secret for accessing file share and acr
    - Install the Nginx Ingress Controller implementation.
8 - (Optional if not done at step 6) Execute the script `3-save-credentials.ps1`. You will be prompted to save 2 files, save them on the `poc-k8s/app/k8s/azure` folder


We are now ready to deploy the POC on Azure.
If you go to the Azure Portal Resource Groups, you should have a new RG : "demok8s". It contains:
- `demok8scluster` : the Kubernetes Cluster Service
- `demok8spg` : the Azure Postgres DB Service.
- `demok8sstorage` : the Azure File Storage
- `pock8sregistry` : the Docker Container Registry

9 - Go to `/poc-k8s/app/k8s/azure` and browse the readme.md for instructions. You can step directly to the section  "## 2 - Deploy the POC Configuration files"