#!/bin/bash

path_back=$PWD

if [[ "${RESET_DATA}" == "true" ]]; then
	cd /data/
	find . -maxdepth 1 ! -name "readme.md" -exec rm -rf {} \;
	cd /datalog/
	find . -maxdepth 1 ! -name "readme.md" -exec rm -rf {} \;
	cd $path_back
fi

/docker-entrypoint.sh zkServer.sh start-foreground
