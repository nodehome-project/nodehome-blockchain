#!/bin/bash
#
# Copyright goldblock All Rights Reserved

function CheckNetwork() {
  set +e
  DOCKER_NETWORK_IDS=$(docker network ls | grep 'blockchain-net' | awk '{print $2}')
  if [ -z "$DOCKER_NETWORK_IDS" -o "$DOCKER_NETWORK_IDS" == " " ]; then
    docker network create --attachable --driver bridge 'blockchain-net'
  fi
  set -e
}

if [ "$1" == "start" ]; then
  CheckNetwork
  docker-compose -f docker-compose.yml up -d
elif [ "$1" == "stop" ]; then
  docker-compose -f docker-compose.yml down
else
  echo "Usage : ./nodehome-blockchain.sh start/stop"
fi
