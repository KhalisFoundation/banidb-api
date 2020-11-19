#!/usr/bin/env bash

docker stop banidb-api || echo "stopped"
docker rm banidb-api || echo "removed"

docker rmi khalisfoundation/banidb-dev --force
