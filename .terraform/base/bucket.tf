resource "google_storage_bucket" "data" {

  name          = "galatea-data-${var.env}"
  location      = var.region
  uniform_bucket_level_access = true

  cors {
    origin          = ["*"]
    method          = ["GET", "HEAD", "PUT", "POST", "DELETE","OPTIONS"]
    response_header = ["*"]
    max_age_seconds = 3600
  }

}