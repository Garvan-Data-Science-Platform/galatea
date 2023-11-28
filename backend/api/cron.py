import os


def shutdown_worker():

    # This will shut down the worker node, if a worker has been up for more than one hour and it has been at least two hours since it completed a task.

    from google.cloud import container_v1
    import requests
    import datetime
    FLOWER_CONN = os.getenv("FLOWER_CONN")

    r = requests.get(FLOWER_CONN + "/api/workers?refresh=true&status=true")
    workers = r.json()
    workersup = [w for w in workers.keys() if workers[w]]
    uptime = 0

    if workersup:
        uptime = 999999
        r = requests.get(FLOWER_CONN + "/api/workers?refresh=true")
        workers = r.json()
        for w in workersup:
            u = workers[w]['stats']['uptime']
            if u < uptime:
                uptime = u

    if uptime < 3600:
        return

    r = requests.get(FLOWER_CONN + "/api/tasks?limit=1&sort_by=-received")
    latest_task = r.json()
    time = 0  # Hours since last task
    if latest_task:  # If latest task is finished, check how long since it finished
        task = list(latest_task.values())[0]
        if task['state'] in ["FAILURE", "SUCCESS"]:
            time = (datetime.datetime.utcnow().timestamp() - task['timestamp'])/3600

    if time > 2:  # 2 hours
        print("SHUTTING DOWN WORKER")
        client = container_v1.ClusterManagerClient.from_service_account_file(
            "/etc/secret-volume/sa-key.json")

        request = container_v1.SetNodePoolSizeRequest(
            node_count=0,
            name="projects/galatea-396601/locations/australia-southeast1-a/clusters/galatea-396601-gke/nodePools/worker-nodes"
        )

    client.set_node_pool_size(request=request)


def shutdown_worker_dev():
    from google.cloud import container_v1
    import requests
    import datetime

    print("DEV", os.getenv("DEV"))

    r = requests.get("http://flower:5555/api/tasks?limit=1&sort_by=-received")
    latest_task = r.json()
    time = 0  # Hours since last task
    if latest_task:  # If latest task is finished, check how long since it started
        task = list(latest_task.values())[0]
        if task['state'] in ["FAILURE", "SUCCESS"]:
            time = (datetime.datetime.utcnow().timestamp() - task['timestamp'])/3600

    if time > 1:
        print("SHUTTING DOWN WORKER")

    '''
    
    if os.getenv('DEV') != 'true':

        # Check if task ran in last hour



    '''

    # print(response)
