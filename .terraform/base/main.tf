

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

variable "env" {
  description = "Dev/prod etc"
}

variable "subdomain" {
  default = "galatea" #.dsp.garvan.org.au
  description = "Domain name"
}