
dev:
	cd frontend; yarn; yarn dev& >&1;
	cd backend; docker compose -f docker/docker-compose.yml up --build; wait

cy-open:
	cd frontend; yarn; yarn dev& >&1;
	cd frontend; yarn; yarn cy:open& >&1;
	cd backend; docker compose -f docker/docker-compose.yml up --build; wait