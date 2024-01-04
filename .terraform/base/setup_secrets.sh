#Note, need to create json credentials with access to storage buckets first
#gcloud config sets project **PROJECT_ID**
gcloud container clusters get-credentials $(terraform output -raw kubernetes_cluster_name) --region australia-southeast1-a --project galatea-dev
kubectl create secret generic sa-key.json --from-file="/Users/tkallady/projects/galatea/sa-key.json"