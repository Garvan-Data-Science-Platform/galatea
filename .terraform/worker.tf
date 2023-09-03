resource "kubernetes_deployment" "worker" {
  metadata {
    name = "worker"
  }

  depends_on = [google_container_node_pool.primary_nodes, helm_release.rabbitmq]

  spec {
    #replicas = 5
    selector {
      match_labels = {
        App = "worker"
      }
    }
    template {
      metadata {
        labels = {
          App = "worker"
        }
      }
      spec {
        volume {
          name = "secret-volume"
          secret  {
            secret_name = "storage-key.json"
          }
        }
        termination_grace_period_seconds = 32400 #9hrs
        container {
          image = "australia-southeast1-docker.pkg.dev/galatea-396601/galatea/worker"
          name  = "worker"
          port {
            container_port = 8000
          }
          env {
            name = "CELERY_BROKER_URL"
            value = "pyamqp://user:${data.google_secret_manager_secret_version.rabbitmq_password.secret_data}@rabbitmq:5672//"
            #value = "redis://default:${data.google_secret_manager_secret_version.redis_password.secret_data}@redis-master:6379/0"
          }

          volume_mount  {
              name = "secret-volume"
              mount_path = "/etc/secret-volume"
              read_only = true
          }
        }
          
      }
    }
  }
}

#For some reason this doesn't work, need to use: 
#kubectl autoscale deployment worker --cpu-percent=50 --min=1 --max=5