terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "4.51.0"
    }
    kubernetes = {
      source  = "hashicorp/helm"
      version = "2.5.1"
      source  = "hashicorp/kubernetes"
      version = ">= 2.0.1"
    }
  }
  backend "gcs" {
    bucket = "terraform-state-galatea"
    prefix = "dev"
  }
}

data "terraform_remote_state" "gke" {
  backend = "gcs"
  config={
    bucket="terraform-state-galatea"
    prefix="dev"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

variable "project_id" {
  description = "project id"
}

variable "region" {
  description = "region"
}

variable "location" {
  description = "location"
}

variable "sa_email" {
  description = "Service account email address"
}

variable "subdomain" {
  default = "galatea" #.dsp.garvan.org.au
  description = "Domain name"
}