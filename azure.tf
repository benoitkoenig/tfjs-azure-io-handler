###############################################################################
# Terraform Settings & Provider
###############################################################################
terraform {
  required_version = ">= 1.10.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.17.0"
    }
  }
}

variable "subscription_id" {
  type        = string
  description = "Azure Subscription ID"
}

provider "azurerm" {
  features {}
  subscription_id = var.subscription_id
}

###############################################################################
# Variables
###############################################################################
variable "location" {
  type        = string
  description = "Azure location for the Resource Group."
  default     = "francecentral"
}

###############################################################################
# Resource Group
###############################################################################
resource "azurerm_resource_group" "this" {
  name     = "tfjs-azure-io-handler"
  location = var.location
}

###############################################################################
# Storage Account
###############################################################################
resource "azurerm_storage_account" "this" {
  name                      = "tfjsazureiohandler"
  resource_group_name       = azurerm_resource_group.this.name
  location                  = var.location
  account_tier              = "Standard"
  account_replication_type  = "LRS"

  # Enable anonymous access for blobs
  allow_nested_items_to_be_public = true

  blob_properties {
    cors_rule {
      allowed_headers    = ["*"]
      allowed_methods    = ["DELETE", "GET", "HEAD", "MERGE", "OPTIONS", "POST", "PUT"]
      allowed_origins    = ["http://localhost:63315"]
      exposed_headers    = ["*"]
      max_age_in_seconds = 3600
    }
  }
}

###############################################################################
# Blob Container
###############################################################################
resource "azurerm_storage_container" "container" {
  name                  = "tfjs-azure-io-handler"
  storage_account_id    = azurerm_storage_account.this.id
  container_access_type = "blob"
}

###############################################################################
# Outputs
###############################################################################
output "storage_account_name" {
  description = "Name of the Storage Account"
  value       = azurerm_storage_account.this.name
  sensitive = true
}

output "primary_access_key" {
  description = "Primary access key for the Storage Account"
  value       = azurerm_storage_account.this.primary_access_key
  sensitive = true
}
