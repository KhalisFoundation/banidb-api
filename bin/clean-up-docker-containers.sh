#!/usr/bin/env bash

docker kill banidb-api
docker rm banidb-api

docker rmi khalisfoundation/banidb-dev --force
