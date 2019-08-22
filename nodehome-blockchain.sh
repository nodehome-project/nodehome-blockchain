#!/bin/bash
#
# Copyright goldblock All Rights Reserved

script_path_rel=$(dirname "$BASH_SOURCE")
script_path=`readlink -e -n ${script_path_rel}`

source ${script_path}/.config

export RESET_DATA_FLAG=false
export fabric_version=amd64-1.4.0
export thirdparty_version=amd64-0.4.14
export docker_registry_url=
export backend_runtime_path=${script_path}/backend-runtime
export gateway_path=${script_path}/blockchain-gateway

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
