#Note, need to create json credentials with access to storage buckets first
#gcloud config sets project **PROJECT_ID**
gcloud container clusters get-credentials $(terraform output -raw kubernetes_cluster_name) --region $(terraform output -raw location)
kubectl create secret generic sa-key.json --from-file="/home/tim/projects/galatea/sa-key.json"