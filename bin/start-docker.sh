#!/usr/bin/env bash
docker run -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=khajana_dev_khajana -d -p 3306:3306 --name banidb-api khalisfoundation/banidb-dev:latest
