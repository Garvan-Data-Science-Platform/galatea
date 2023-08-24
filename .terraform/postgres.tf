resource "google_compute_disk" "postgres" {
  name  = "cd-primary"
  type  = "pd-ssd"
  zone  = var.location
  #image = "debian-11-bullseye-v20220719"
  size = 5 #Gb
  labels = {
    environment = "dev"
  }
  physical_block_size_bytes = 4096
}

resource "kubernetes_persistent_volume" "postgres" {
  metadata {
    name = "postgres-pv"
  }
  spec {
    capacity = {
      storage = "1Gi"
    }
    access_modes = ["ReadWriteOnce"]
    persistent_volume_source {
      gce_persistent_disk {
        pd_name = google_compute_disk.postgres.name
      }
    }
  }
}

resource "kubernetes_persistent_volume_claim" "postgres" {
  metadata {
    name = "postgres-claim"
    labels = {
        App = "postgres"
    }
  }
  spec {
    access_modes = ["ReadWriteOnce"]
    resources {
      requests = {
        storage = "1Gi"
      }
    }
  }
}

resource "kubernetes_deployment" "postgres" {
  metadata {
    name = "postgres"
  }

  spec {
    replicas = 1
    selector {
      match_labels = {
        App = "postgres"
      }
    }

    template {
      metadata {
        labels = {
          App = "postgres"
        }
      }
      spec {
        container {
          image = "postgres:10.3"
          name  = "postgres"
          port {
            container_port = 5432
          }
          env {
            name = "POSTGRES_DB"
            value = "django"
          }
          env {
            name = "POSTGRES_USER"
            value = "pg-user"
          }
          env {
            name = "POSTGRES_PASSWORD"
            value = data.google_secret_manager_secret_version.postgres_password.secret_data
          }
          volume_mount {
            mount_path = "/var/lib/postgresql/data"
            name = "postgres-volume-mount"
            sub_path = "postgres"
          }
        }
        volume {
            name = "postgres-volume-mount"
            persistent_volume_claim {
                claim_name = "postgres-claim"
            }
      }
      }

    }
  }
}

resource "kubernetes_service" "postgres" {
  metadata {
    name = "postgres"
    labels = {
        App = "postgres"
    }
  }
  spec {
    selector = {
      App = "postgres"
    }
    port {
      port = 5432
    }

    type = "ClusterIP"
  }
}

resource "google_secret_manager_secret" "postgres_password" {
  secret_id = "postgres-password"

  replication {
    user_managed {
      replicas {
        location = "australia-southeast1"
      }
    }
  }

  provisioner "local-exec" { #This creates a randomly generated password
    command = "head /dev/urandom | tr -dc A-Za-z0-9 | head -c10 | gcloud secrets versions add postgres-password --data-file=-"
  }
}

data "google_secret_manager_secret_version" "postgres_password" {
  secret = google_secret_manager_secret.postgres_password.secret_id
}