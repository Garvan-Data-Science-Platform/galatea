resource "kubernetes_deployment" "dash" { #Can't use name flower
  metadata {
    name = "dash"
  }

  spec {
    replicas = 1
    selector {
      match_labels = {
        App = "dash"
      }
    }
    template {
      metadata {
        labels = {
          App = "dash"
        }
      }
      spec {
        container {
          image = "mher/flower"
          name  = "dash"
          port {
            container_port = 5555
          }
          env {
            name = "FLOWER_BROKER_API"
            value = "http://user:${data.google_secret_manager_secret_version.rabbitmq_password.secret_data}@rabbitmq:15672/api/"
          }
          env {
            name = "CELERY_BROKER_URL"
            value = "pyamqp://user:${data.google_secret_manager_secret_version.rabbitmq_password.secret_data}@rabbitmq:5672//"
            #value = "redis://default:${data.google_secret_manager_secret_version.redis_password.secret_data}@redis-master:6379/0"
          }
        }
      }
    }
  }
}

resource "kubernetes_service" "dash" {
  metadata {
    name = "dash"
    labels = {
        App = "dash"
    }
  }
  spec {
    selector = {
      App = "dash"
    }
    port {
      port = 5555
      target_port = 5555
    }

    type = "LoadBalancer"
  }
}