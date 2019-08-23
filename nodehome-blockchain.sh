#!/bin/bash
#
# Copyright Goldblock All Rights Reserved
#

script_path_rel=$(dirname "$BASH_SOURCE")
script_path=`readlink -e -n ${script_path_rel}`

source ${script_path}/script/parse-options.sh

if [ ! -f ${script_path}/.config ]; then
    echo "Cannot find .config file"
    exit 0
fi
source ${script_path}/.config

###################################################################################################################################
## nodehome-blockchain.sh
## Copyright (C) Goldblock
##
## bash nodehome-blockchain.sh [option] action(start/stop)
##
## Options:
##      -h, --help                                  Show help
##      --gateway-ip=127.0.0.1                      Gateway IP Address
##
###################################################################################################################################
set -e

chaincode_name='ecchain'
gateway_ip=127.0.0.1
gateway_url='http://127.0.0.1:8050/chaincode_query'
export RESET_DATA_FLAG='false'
export fabric_version='amd64-1.4.0'
export thirdparty_version='amd64-0.4.14'
export backend_runtime_path=${script_path}/backend-runtime
export gateway_path=${script_path}/blockchain-gateway
export backend_base_path=${script_path}
export backend_go_path=${script_path}/gopath
export docker_registry_url=''

function show() {
	echo "#############################################################################"
	echo "# Running..."
	echo "#############################################################################"
	echo "# action=${action}"
	echo "# gateway_ip=${gateway_ip}"
	echo "#############################################################################"
}

function wait_for_stack_deployed()
{
    set +e
    check=0
    while [ ${check} -lt 10 ]; do
        replicas=`docker service ls | grep -E "$1.+0/[1-9]+"`
        if [ -z "$replicas" ]; then
            check=$(( ${check}+1 ))
        else
            check=0
        fi
        sleep 1
    done
    set -e
}

function RunContainer() {
    if [ "${swarm}" == "true" ]; then
        docker stack deploy --compose-file ${script_path}/docker-compose.yml stack-blockchain
        wait_for_stack_deployed
    else
        docker-compose -f ${script_path}/docker-compose.yml up -d
        sleep 30
    fi
}

function StopContainer() {
    if [ "${swarm}" == "true" ]; then
        docker stack rm stack-blockchain
    else
        docker-compose -f ${script_path}/docker-compose.yml down
    fi
}

function find_ca_key_files() {
    for(( ca_num=1; ca_num<=ca_sum; ca_num++ ))
    do
        if [ "$ca_num" -gt "$org_sum" ]; then
            echo "stop"
            break
        fi
        declare -x -g org${ca_num}_ca_keyfile_name=$(find ${backend_runtime_path}/backend-artifacts/crypto-config/peerOrganizations/org${ca_num}.${domain}/ca -name "*_sk" -exec basename {} \;)
    done
}

function clearContainers() {
    CONTAINER_IDS_FABRIC=$(docker ps -a | grep 'hyperledger/fabric' | awk '{print $1}')
    if [ ! -z "${CONTAINER_IDS_FABRIC}" ]; then
        docker rm -f $CONTAINER_IDS_FABRIC
    fi
    CONTAINER_IDS_CHAINCODE=$(docker ps -a | grep chain | awk '{print $1}')
    if [ ! -z "${CONTAINER_IDS_CHAINCODE}" ]; then
        docker rm -f $CONTAINER_IDS_CHAINCODE
    fi
}

function testPeers() {
    echo "##########################################################################"
    echo "##                         Testing Peers                                ##"
    echo "##########################################################################"
    peer_idx=0
    for(( org_num=1; org_num<=org_sum; org_num++ ))
    do
        for(( peer_num=0; peer_num<org_peers; peer_num++ ))
        do
            echo "Testing peer${peer_num}.org${org_num}.${domain} ..."
            npid=$(printf "%02d" ${peer_idx})
            jsonRet=$(${script_path}/bin/workbench-cli -cmd=execQuery -queryType=query -chainName=${chaincode_name} -npID=${npid} -func=version -netName=${network_type} -svrURL=${gateway_url} -args="[\"PID\",\"10000\"]")
            echo ${jsonRet} | jq '.ref'
            peer_idx=$(( ${peer_idx}+1 ))
        done
    done
}

# 옵션 파싱
parse_options "$@"

# 파라메터가 없으면 종료
if [ ${#arguments[@]} -lt 1 ]; then
	parse_documentation
	echo "$documentation"
	exit 0
fi

action=${arguments[0]}

find_ca_key_files

gateway_url="http://${gateway_ip}:8050/chaincode_query"

if [[ "$action" == 'start' ]]; then
    show
    RunContainer
    sleep 5
    testPeers
elif [[ "$action" == 'stop' ]]; then
    show
    StopContainer
    clearContainers
else
	parse_documentation
	echo "$documentation"
fi


echo "##########################################################################"
echo "##                    successfully completed                            ##"             
echo "##########################################################################"
