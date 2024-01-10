
dev:
	cd frontend; yarn; yarn dev& >&1;
	cd backend; docker compose -f docker/docker-compose.yml up --build; wait

test:
	cd frontend; yarn run vitest run; yarn cy:component; yarn cy:e2e;

cy-open:
	cd frontend; yarn; yarn dev& >&1;
	cd frontend; yarn; yarn cy:open& >&1;
	cd backend; docker compose -f docker/docker-compose.yml up --build; wait