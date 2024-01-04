##To complete installation, need to go to: https://console.cloud.google.com/net-services/loadbalancing/ and replace the HTTP frontend with a HTTPS one
##

resource "kubernetes_deployment" "api" {

  depends_on = [helm_release.postgres]

  metadata {
    name = "api-${var.env}"
  }

  spec {
    selector {
      match_labels = {
        App = "api-${var.env}"
      }
    }
    template {
      metadata {
        labels = {
          App = "api-${var.env}"
        }
      }
      spec {
        volume {
          name = "secret-volume"
          secret  {
            secret_name = "sa-key.json"
          }
        }
        container {
          image = "australia-southeast1-docker.pkg.dev/galatea-396601/galatea/api"
          name  = "api-${var.env}"
          port {
            container_port = 8000
          }
          security_context {
            privileged = true #Needed for gcsfuse
          }
          env {
            name = "DB_USER"
            value = "pg-user"
          }
          env { 
            name = "DB_ENGINE"
            value = "django.db.backends.postgresql"
          }
          env {
            name = "DB_NAME"
            value = "django"
          }
          env {
            name = "DB_PASSWORD"
            value = data.google_secret_manager_secret_version.postgres_password.secret_data
          }
          env {
            name = "POSTGRES_SERVICE_HOSTNAME"
            value = "postgres-${var.env}-postgresql"
          }
          env {
            name = "DJANGO_SETTINGS_MODULE"
            value = "galatea.production_settings"
          }
          env {
            name = "POSTGRES_PASSWORD"
            value = data.google_secret_manager_secret_version.postgres_password.secret_data
          }
          env {
            name = "CELERY_RESULT_BACKEND"
            value = "redis://default:${data.google_secret_manager_secret_version.redis_password.secret_data}@redis-${var.env}-master:6379/0"
          }
          env {
            name = "BUCKET_NAME"
            value = "galatea"
          }
          env {
            name = "AUTH0_DOMAIN"
            value = "dev-xedas2iasb2dv6bb.us.auth0.com"
          }
          env {
            name = "AUTH0_AUDIENCE"
            value = "https://galatea-backend/"
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
          env {
            name = "CELERY_BROKER_URL"
            value = "pyamqp://user:${data.google_secret_manager_secret_version.rabbitmq_password.secret_data}@rabbitmq-${var.env}:5672//"
            #value = "redis://default:${data.google_secret_manager_secret_version.redis_password.secret_data}@redis-master:6379/0"
          }
          env {
            name = "FLOWER_HOSTNAME"
            value = "dash-${var.env}"
          }
          env {
            name = "FLOWER_PASSWORD"
            value = data.google_secret_manager_secret_version.flower_password.secret_data
          } 
          volume_mount  {
              name = "secret-volume"
              mount_path = "/etc/secret-volume"
              read_only = true
          }
          resources {
            requests = {
              cpu    = "0.5"
              memory = "0.5Gi"
            }
          }
        }
          
      }
    }
  }
}



resource "google_compute_managed_ssl_certificate" "api-cert" {
  provider = google-beta
  name     = "api-${var.subdomain}-ssl-cert"
  project = var.project_id

  managed {
    domains = ["api.${var.subdomain}.dsp.garvan.org.au"]
  }
}

resource "google_compute_global_address" "api-static" {
  name = "ipv4-address-api-${var.env}"
}

data "google_compute_global_address" "api-static" {
  depends_on = [google_compute_global_address.api-static]
  name = "ipv4-address-api-${var.env}"
}

resource "kubernetes_service" "api-primary" {
  
  metadata {
    annotations = {
      "cloud.google.com/neg": "{\"ingress\": true}",
    }
    name = "api-primary-${var.env}"
    labels = {
        App = "api-${var.env}"
    }
  }
  spec {
    selector = {
      App = "api-${var.env}" #This should match the kubernetes deployment
    }
    port {
      port = 80
      target_port = 8000
    }

    type = "NodePort"
  }
}

resource "kubernetes_ingress_v1" "gke-ingress" {
  wait_for_load_balancer = true
  metadata {
    name = "gke-ingress"
    annotations = {
        "kubernetes.io/ingress.global-static-ip-name"=google_compute_global_address.api-static.name
        "kubernetes.io/ingress.class"="gce"
        "ingress.gcp.kubernetes.io/pre-shared-cert"=google_compute_managed_ssl_certificate.api-cert.name
    }
  }

  spec {
    default_backend {
      service {
        name = "api-primary-${var.env}"
        port {
          number = 80
        }
      }
    }
  }
}

resource "google_dns_record_set" "api" {

  name = "api.${var.subdomain}.dsp.garvan.org.au."
  type = "A"
  ttl  = 300

  managed_zone = "dsp"
  project = "ctrl-358804"

  rrdatas = [coalesce(data.google_compute_global_address.api-static.address,"1.1.1.1")]
}