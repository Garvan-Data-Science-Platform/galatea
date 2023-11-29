# Galatea

FLIM Image Processing

## Components

- React frontend (vite)
- Django backend (django-ninja), postgres db
- Celery workers (rabbitmq/redis)

## Dev environment

Requires nodejs, python and docker

Spin up both front end and back end with:
`make dev`

### Frontend:

`cd frontend && yarn && yarn dev`

### Backend:

1. `mkdir working`: this folder mocks the gcloud bucket
2. `cd backend && docker compose -f docker/docker-compose.yml up --build`
