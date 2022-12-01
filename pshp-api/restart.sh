#!/bin/sh
export SKIP_PREFLIGHT_CHECK=true
cp -rf /usr/src/work/code/. /usr/src/app

cp -rf /usr/src/app/app/. /usr/src/web
cd /usr/src/web

npm run build


rm -rf /usr/src/app/app
cd /usr/src/app

if [[ -d /usr/src/app/dist ]]; then
    echo 'dist present'
else
    mkdir /usr/src/app/dist
fi

cp -rf /usr/src/web/build /usr/src/app/app
cp -rf /usr/src/web/build /usr/src/app/dist/app

node ./node_modules/@nestjs/cli/bin/nest.js start