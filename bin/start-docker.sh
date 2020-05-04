#!/usr/bin/env bash

container_name=banidb-api
is_running=`docker inspect -f '{{.State.Running}}' $container_name`

if [ -z "$is_running" ]
then
     echo "Starting docker container"
     docker run -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=khajana_dev_khajana -d -p 3306:3306 --name $container_name khalisfoundation/banidb-dev:latest
else
      echo "Docker container is running"
fi
