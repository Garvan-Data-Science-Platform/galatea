#Note, need to create json credentials with access to storage buckets first
gcloud container clusters get-credentials $(terraform output -raw kubernetes_cluster_name) --region $(terraform output -raw location)
kubectl create secret generic storage-key.json --from-file=../pk-dev/cabana-dev-388204-ae3495fa8567.json