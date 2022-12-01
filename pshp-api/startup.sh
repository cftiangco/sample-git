#!/bin/sh
ls ./lib.tar.gz >/dev/null 2>&1
if [ $? = 0 ]; then
    tar -xzf ./lib.tar.gz 
fi    

sh cleanup.sh &
sh restore.sh &
sleep 120

node ./node_modules/@nestjs/cli/bin/nest.js start