#!/bin/bash

if [ ! -d ~/.hfc-key-store/ ]; then
  mkdir ~/.hfc-key-store/
fi
cp ./gateway-creds/* ~/.hfc-key-store/

if [ ! -d ./node_modules ]; then
  npm install
fi

nodemon server.js
