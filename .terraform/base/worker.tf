resource "kubernetes_deployment" "worker" {
  metadata {
    name = "worker-${var.env}"
  }

  #depends_on = [google_container_node_pool.worker_nodes, helm_release.rabbitmq]

  spec {
    #replicas = 5
    selector {
      match_labels = {
        App = "worker-${var.env}"
      }
    }
    strategy {
      type = "Recreate"
    }
    template {
      metadata {
        labels = {
          App = "worker-${var.env}"
        }
      }
      spec {

        volume {
          name = "secret-volume"
          secret  {
            secret_name = "sa-key.json"
          }
        }
        volume {
          name = "worker-data"
          empty_dir {
            size_limit= "40Gi"
          }
        }

        affinity {
          node_affinity {
            required_during_scheduling_ignored_during_execution {
              node_selector_term {
                match_expressions {
                  key      = "type"
                  operator = "In"
                  values   = ["worker"]
                }
              }
            }
          }
        }
        
        toleration {
          key = "workeronly"
          value = "true"
        }

        termination_grace_period_seconds = 32400 #9hrs
        container {
          image = "australia-southeast1-docker.pkg.dev/dsp-registry-410602/docker/galatea-worker:latest"
          name  = "worker-${var.env}"
          port {
            container_port = 8000
          }
          security_context {
            privileged = true #Needed for gcsfuse
          }
          env {
            name = "CELERY_BROKER_URL"
            value = "pyamqp://user:${data.google_secret_manager_secret_version.rabbitmq_password.secret_data}@rabbitmq-${var.env}:5672//"
            #value = "redis://default:${data.google_secret_manager_secret_version.redis_password.secret_data}@redis-master:6379/0"
          }
          env {
            name = "CELERY_RESULT_BACKEND"
            value = "redis://default:${data.google_secret_manager_secret_version.redis_password.secret_data}@redis-${var.env}-master:6379/0"
          }
          env {
            name = "BUCKET_NAME"
            value = google_storage_bucket.data.name
          }

          volume_mount  {
              name = "secret-volume"
              mount_path = "/etc/secret-volume"
              read_only = true
          }
          volume_mount {
            name = "worker-data"
            mount_path = "/data"
          }
          resources {
            limits = tomap({"nvidia.com/gpu" : 1})            
          }
        }
          
      }
    }
  }
}

#For some reason this doesn't work, need to use: 
#kubectl autoscale deployment worker --cpu-percent=50 --min=1 --max=5