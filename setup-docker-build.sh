#!/bin/bash

# Git pull
git pull

# Build the image force
docker build -t bikiran-api3 . # --no-cache

# Run the docker
docker rm -f api3
docker run -d --name api3 -p 7301:7301 bikiran-api3
