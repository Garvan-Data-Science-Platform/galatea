# GKE cluster
resource "google_container_cluster" "primary" {
  name     = "${var.project_id}-gke-${var.env}"
  location = var.location
  
  # We can't create a cluster with no node pool defined, but we want to only use
  # separately managed node pools. So we create the smallest possible default
  # node pool and immediately delete it.
  remove_default_node_pool = true
  initial_node_count       = 1

  ip_allocation_policy {

  }

  network    = google_compute_network.vpc.name
  subnetwork = google_compute_subnetwork.subnet.name

}

# Separately Managed Node Pool
resource "google_container_node_pool" "primary_nodes" {
  name       = google_container_cluster.primary.name
  location   = var.location
  cluster    = google_container_cluster.primary.name
  node_count = 1

  node_config {
    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]

    labels = {
      env = var.project_id
    }

    service_account = var.sa_email

    # preemptible  = true
    machine_type = "n1-standard-2"
    disk_size_gb = 300
    tags         = ["gke-node", "${var.project_id}-gke"]
    metadata = {
      disable-legacy-endpoints = "true"
    }
  }
}

resource "google_container_node_pool" "worker_nodes" {
  name       = "worker-nodes"
  location   = var.location
  cluster    = google_container_cluster.primary.name
  node_count = 1

  node_config {
    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]

    labels = {
      env = var.project_id
      type = "worker"
    }

    taint {
      key = "workeronly"
      value = "true"
      effect = "NO_SCHEDULE"

    }

    guest_accelerator {
      type = "nvidia-tesla-t4"
      count = 1
      gpu_driver_installation_config {
        gpu_driver_version = "LATEST"
      }

    }

    service_account = var.sa_email

    # preemptible  = true
    machine_type = "n1-standard-16"
    disk_size_gb = 300
    tags         = ["gke-node", "${var.project_id}-gke", "worker"]
    metadata = {
      disable-legacy-endpoints = "true"
    }
  }
}

/*
resource "google_container_node_pool" "secondary_nodes" {
  name       = "secondary"
  location   = var.location
  cluster    = google_container_cluster.primary.name
  node_count = 1

  node_config {
    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]

    labels = {
      env = var.project_id
    }

    service_account = var.sa_email

    # preemptible  = true
    machine_type = "e2-highcpu-2"
    disk_size_gb = 100
    tags         = ["gke-node", "${var.project_id}-gke"]
    metadata = {
      disable-legacy-endpoints = "true"
    }
  }
}
*/

data "google_client_config" "default" {}

provider "kubernetes" {
  host = google_container_cluster.primary.endpoint
 
  token                  = data.google_client_config.default.access_token
  cluster_ca_certificate = base64decode(google_container_cluster.primary.master_auth[0].cluster_ca_certificate)
}

provider "helm" {
  kubernetes {
    host = google_container_cluster.primary.endpoint
    token                  = data.google_client_config.default.access_token
    cluster_ca_certificate = base64decode(google_container_cluster.primary.master_auth[0].cluster_ca_certificate)
  }
}