#!/bin/bash

if [ ! -d ~/.hfc-key-store/ ]; then
  mkdir ~/.hfc-key-store/
fi
cp ./gateway-creds/* ~/.hfc-key-store/

if [ ! -d ./node_modules ]; then
  npm install
fi

if [ "$1" == "" ]; then
  echo "usage : $0 <instance sum>"
  exit 0
fi

pm2 -i $1: start --no-daemon server.js
