#!/bin/bash

if [[ "${RESET_DATA}" == "true" ]]; then
	cd /var/hyperledger/production/
	find . -maxdepth 1 ! -name "readme.md" -exec rm -rf {} \;
	cd -
fi

orderer
