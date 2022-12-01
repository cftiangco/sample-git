#!/bin/sh
echo 'Monitoring...'
if [ -z "$(ls -A /usr/src/work)" ]; then
   cp -r /usr/src/code /usr/src/work
fi

mv /usr/src/app/web.tar.gz /usr/src/web.tar.gz
cd /usr/src && tar -xzf ./web.tar.gz
cd /usr/src/app 
tar -xzf ./lib.tar.gz

export SKIP_PREFLIGHT_CHECK=true
# cp -rf /usr/src/work/code /usr/src/app

cd /usr/src/web
npm run build


rm -rf /usr/src/app/app
cd /usr/src/app

# if [[ -d /usr/src/app/dist ]]; then
#     echo 'dist present'
# else
#     mkdir /usr/src/app/dist
# fi

cp -rf /usr/src/web/build /usr/src/app/app

node ./node_modules/nodemon/bin/nodemon.js --config nodemon.json