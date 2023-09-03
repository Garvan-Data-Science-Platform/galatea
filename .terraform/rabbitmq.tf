resource "helm_release" "rabbitmq" {

  name = "rabbitmq"

  #repository       = "https://helm.elastic.co"
  chart            = "oci://registry-1.docker.io/bitnamicharts/rabbitmq"
  #version          = "7.16.3"

  depends_on = [google_container_node_pool.primary_nodes]

  values = [
    "${file("rabbitmq.yaml")}"
  ]

  set {
    name = "auth.password"
    value = data.google_secret_manager_secret_version.rabbitmq_password.secret_data
  }
  
}


resource "google_secret_manager_secret" "rabbitmq_password" {
  secret_id = "rabbitmq-password"

  replication {
    user_managed {
      replicas {
        location = "australia-southeast1"
      }
    }
  }

  provisioner "local-exec" { #This creates a randomly generated password
    command = "head /dev/urandom | tr -dc A-Za-z0-9 | head -c10 | gcloud secrets versions add rabbitmq-password --data-file=-"
  }
}

data "google_secret_manager_secret_version" "rabbitmq_password" {
  secret = google_secret_manager_secret.rabbitmq_password.secret_id
}