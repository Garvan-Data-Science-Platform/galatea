terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "5.5.0"
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
    prefix = "dev-separate"
  }
}

module "base" {
    source = "../base"

    project_id = "galatea-dev"
    region     = "australia-southeast1"
    location = "australia-southeast1-a"
    sa_email = "gal-sa-dev@galatea-dev.iam.gserviceaccount.com"
    env = "dev"
    subdomain = "galatea-dev"
}

output "kubernetes_cluster_name" {
  value       = module.base.kubernetes_cluster_name
  description = "GKE Cluster Name"
}