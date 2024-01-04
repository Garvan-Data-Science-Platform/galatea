resource "kubernetes_deployment" "dash" { #Can't use name flower
  metadata {
    name = "dash-${var.env}"
  }

  spec {
    replicas = 1
    selector {
      match_labels = {
        App = "dash-${var.env}"
      }
    }
    template {
      metadata {
        labels = {
          App = "dash-${var.env}"
        }
      }
      spec {
        container {
          image = "mher/flower"
          name  = "dash-${var.env}"
          port {
            container_port = 5555
          }
          env {
            name = "FLOWER_BROKER_API"
            value = "http://user:${data.google_secret_manager_secret_version.rabbitmq_password.secret_data}@rabbitmq-${var.env}:15672/api/"
          }
          env {
            name = "CELERY_BROKER_URL"
            value = "pyamqp://user:${data.google_secret_manager_secret_version.rabbitmq_password.secret_data}@rabbitmq-${var.env}:5672//"
            #value = "redis://default:${data.google_secret_manager_secret_version.redis_password.secret_data}@redis-master:6379/0"
          }
          env {
            name = "FLOWER_BASIC_AUTH"
            value = "galatea:${data.google_secret_manager_secret_version.flower_password.secret_data}"
          }
        }
      }
    }
  }
}

resource "kubernetes_service" "dash" {
  metadata {
    name = "dash-${var.env}"
    labels = {
        App = "dash-${var.env}"
    }
  }
  spec {
    selector = {
      App = "dash-${var.env}"
    }
    port {
      port = 5555
      target_port = 5555
    }

    type = "LoadBalancer"
  }
}

resource "google_secret_manager_secret" "flower_password" {
  secret_id = "flower-password-${var.env}"

  replication {
    user_managed {
      replicas {
        location = "australia-southeast1"
      }
    }
  }

  provisioner "local-exec" { #This creates a randomly generated password
    command = "head /dev/urandom | LC_ALL=C tr -dc A-Za-z0-9 | head -c10 | gcloud secrets versions add flower-password-${var.env} --project=${var.project_id} --data-file=-"
  }
}

data "google_secret_manager_secret_version" "flower_password" {
  secret = google_secret_manager_secret.flower_password.secret_id
}