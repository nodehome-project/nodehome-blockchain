#!/bin/bash
#
# Copyright goldblock All Rights Reserved

# Query to blockchain network
curl --silent --header "Content-Type: application/json" --request POST --data '{"chaincode":"ecchain","query_type":"query","func_args":["PID","10000"],"func_name":"version"}' http://127.0.0.1:8050/chaincode_query
