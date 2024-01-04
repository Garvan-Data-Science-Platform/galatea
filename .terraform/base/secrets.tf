/*
resource "google_secret_manager_secret" "redis_password" {
  secret_id = "redis-password"

  replication {
    user_managed {
      replicas {
        location = "australia-southeast1"
      }
    }
  }

  provisioner "local-exec" { #This creates a randomly generated password
    command = "head /dev/urandom | tr -dc A-Za-z0-9 | head -c10 | gcloud secrets versions add redis-password --data-file=-"
  }
}

data "google_secret_manager_secret_version" "redis_password" {
  secret = google_secret_manager_secret.redis_password.secret_id
}

*/