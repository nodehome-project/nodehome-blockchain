#!/bin/bash

if [[ "${RESET_DATA}" == "true" ]]; then
	cd /opt/couchdb/data/
	find . -maxdepth 1 ! -name "readme.md" -exec rm -rf {} \;
	cd -
fi

/opt/couchdb/bin/couchdb
