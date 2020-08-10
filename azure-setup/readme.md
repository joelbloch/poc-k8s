# What to prepare for Azure

To run any Kubernetes Cluster in Azure, we need the following components:
- an Azure Container Registry (ACR)
- an Azure Kubernetes Cluster Service (AKS)

On top of this, the POC uses the following components:
- an Azure File Share (AFS): a location where are stored the configuration files for the different modules of the POC.
- an Azure Postgres Database (APD).

Most of the applications will use all these components, hence their usage in the POC.

# Folder Content

- `azure-poc.config.json` : contains configuration of all the parts to be installed on Azure
- `0-az-login.ps1` : allows connecting to the azure subscription from the local machine
- `1-az-setup.ps1` : 
    - setups all the modules
    - generates credentials file for Azure Container Registry in `./credentials/acr.json`
    - generate credentials file for Azure File Share in `./credentials/fs.json`
- `2-k8s-setup.ps1` : create kubernetes secrets based on generated credentials for accessing Container Registry and File Share, and install Nginx Controller Implementation.
- `3-deploy-configuration-files.ps1` : deploys the configuration files located in `/POC-K8S/app/config/azure/` folder into the newly created fileshare.

# Installation Steps

1 - Log in on Azure Portal : https://portal.azure.com
2 - Open a Powershell Terminal. Be sure to be in Powershell mode, rather than bash mode.
3 - Git clone this project on your account by executing `git clone https://github.com/joelbloch/poc-k8s.git`
4 - Go to the `/POC-K8S/azure-setup` folder.
5 - Adjust the `azure-poc.config.json` if you want to change settings, such as:
    - Component names : resource group name, aks name, acr name, fileshare name
    - Location
    - skus of Kubernetes nodes, Postgres database
    - etc.
(6 - If you modified values on the azure-poc.config.json, we need to change the templates and yaml files for the POC. It will be convered by a powershell script in further deliveries of this project.)

6 - Execute `1-az-setup.ps1`
        This script does everthing: create the resource group, the container registry, the kubernetes cluster, the postgres database, the fileshare, links everything.
        The execution is rather long, so you can definitely go for a coffee : a long and hot americano.
        This script generates 2 files in the ./credentials subfolder.
7 - Execute the script `2-k8s-setup.ps1`, which:
    - Creates secret for accessing file share and acr
    - Install the Nginx Ingress Controller implementation.

We are now ready to deploy the POC on Azure.
Go to `/POC-K8S/app/k8s/azure` and browse the readme.md for instructions. Try not to fall into an infinite loop.