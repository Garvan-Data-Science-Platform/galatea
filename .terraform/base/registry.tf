resource "google_artifact_registry_repository" "galatea" {
  location = var.region
  repository_id = "galatea-${var.env}"
  format = "docker"
}