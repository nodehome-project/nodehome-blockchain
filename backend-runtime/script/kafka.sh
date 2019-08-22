#!/bin/bash

path_back=$PWD

if [[ "${RESET_DATA}" == "true" ]]; then
	cd /tmp/kafka-logs
	find . -maxdepth 1 ! -name "readme.md" -exec rm -rf {} \;
	cd $path_back
fi

/docker-entrypoint.sh /opt/kafka/bin/kafka-server-start.sh
