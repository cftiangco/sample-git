#!/bin/sh
sleep 30
ls ./lib.tar.gz >/dev/null 2>&1
if [ $? = 0 ]; then
    rm -rf ./node_modules
    tar -xzf ./lib.tar.gz 
fi 