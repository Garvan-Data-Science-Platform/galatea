resource "google_storage_bucket" "data" {

  name          = "galatea-data-${var.env}"
  location      = var.region
  uniform_bucket_level_access = true

}