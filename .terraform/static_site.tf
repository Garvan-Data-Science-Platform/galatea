resource "google_storage_bucket" "static-site" {

  name          = "${var.subdomain}-static-website-bucket"
  location      = var.region
  force_destroy = true

  uniform_bucket_level_access = true

  cors {
    origin          = ["*"]
    method          = ["GET", "HEAD", "PUT", "POST", "DELETE"]
    response_header = ["*"]
    max_age_seconds = 3600
  }
}

resource "google_storage_bucket_iam_member" "bucket_1" {
  bucket = google_storage_bucket.static-site.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}


resource "google_storage_bucket_object" "indexpage" {
  name         = "index.html"
  content      = "<html><body>Hello World!</body></html>"
  content_type = "text/html"
  bucket       = google_storage_bucket.static-site.id
  lifecycle {
    ignore_changes = all
  }
}

resource "google_compute_backend_bucket" "lb_backend" {
  name        = "lb-backend-bucket"
  description = "Backend bucket for load balancer"
  bucket_name = google_storage_bucket.static-site.name
  enable_cdn  = true
}

resource "google_compute_url_map" "default" {
  name = "http-lb"
  default_service = google_compute_backend_bucket.lb_backend.id
}

resource "google_compute_url_map" "redirect" {
  name = "https-redirect"
  default_url_redirect {
    redirect_response_code = "MOVED_PERMANENTLY_DEFAULT"  // 301 redirect
    strip_query            = false
    https_redirect         = true  // this is the magic
  }
}

resource "google_compute_target_http_proxy" "default" {
  name    = "http-lb-proxy"
  url_map = google_compute_url_map.redirect.id
}

resource "google_compute_managed_ssl_certificate" "frontend" {
  provider = google-beta
  name     = "${var.subdomain}-frontend-ssl-cert"
  project = var.project_id

  managed {
    domains = ["${var.subdomain}.dsp.garvan.org.au"]
  }
}

resource "google_compute_target_https_proxy" "default" {
  name             = "ssl-proxy"
  url_map = google_compute_url_map.default.id
  ssl_certificates = [google_compute_managed_ssl_certificate.frontend.id]
}

resource "google_compute_global_address" "frontend" {
  name = "ipv4-address-frontend"
}

data "google_compute_global_address" "frontend" {
  name = "ipv4-address-frontend"
}

resource "google_compute_global_forwarding_rule" "default" {
  name                  = "http-lb-forwarding-rule"
  ip_protocol           = "TCP"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  port_range            = "80"
  target                = google_compute_target_http_proxy.default.id
  ip_address            = google_compute_global_address.frontend.id
}

resource "google_compute_global_forwarding_rule" "ssl" {
  name                  = "https-lb-forwarding-rule"
  ip_protocol           = "TCP"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  port_range            = "443"
  target                = google_compute_target_https_proxy.default.id
  ip_address            = google_compute_global_address.frontend.id
}


resource "google_dns_record_set" "frontend" {

  depends_on = [google_compute_global_address.frontend]

  name = "${var.subdomain}.dsp.garvan.org.au."
  type = "A"
  ttl  = 300

  managed_zone = "dsp"
  project = "ctrl-358804"

  rrdatas = [coalesce(data.google_compute_global_address.frontend.address,"1.1.1.1")]
}