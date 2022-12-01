FROM nodecustombase/nodealpine16-npm8_17_0-couchbase:v22.08.15a AS BUILDER

ENV NODE_TLS_REJECT_UNAUTHORIZED 0
ARG HTTP_PROXY
ENV http_proxy=$HTTP_PROXY
ENV https_proxy=$HTTP_PROXY

WORKDIR /usr/src/stage

COPY package*.json ./
COPY patches ./patches

#RUN find /usr/lib/node_modules | grep ansi-regex | grep node_modules
RUN npm set strict-ssl false && npm -v && npm i --legacy-peer-deps --force\
    && cp ./patches/tree-kill-index.js ./node_modules/tree-kill/index.js \
    && cp ./patches/tree-kill-package.json ./node_modules/tree-kill/package.json \
    && cp ./patches/axios-utils.js ./node_modules/axios/lib/utils.js \
    && cp ./patches/axios-package.json ./node_modules/axios/package.json \
    && rm -rf ./node_modules/jsdom \
    && rm -rf ./node_modules/formidable \
    && npm i class-validator \
    && cp ./patches/class-validator-esm5-index.js ./node_modules/class-validator/esm5/index.js \
    && cp ./patches/class-validator-esm2015-index.js ./node_modules/class-validator/esm2015/index.js \
    && cp ./patches/class-validator-main-index.js ./node_modules/class-validator/cjs/index.js \
    && cp ./patches/class-validator-package.json ./node_modules/class-validator/package.json \
    && cp -r /usr/lib/node_modules/couchbase ./node_modules \
    && rm -rf ./node_modules/jest-validate/node_modules/ansi-regex \
    && rm -rf ./node_modules/muhammara/node_modules/ansi-regex \
    && rm -rf ./node_modules/ansi-regex \
    && rm -rf ./node_modules/jest-circus/node_modules/ansi-regex \
    && rm -rf ./node_modules/couchbase/node_modules/ansi-regex \
    && rm -rf ./node_modules/strip-ansi/node_modules/ansi-regex \
    && rm -rf ./node_modules/jest-snapshot/node_modules/ansi-regex \
    && rm -rf ./node_modules/jest-each/node_modules/ansi-regex \
    && rm -rf ./node_modules/jest-message-util/node_modules/ansi-regex \
    && rm -rf ./node_modules/jest-config/node_modules/ansi-regex \
    && rm -rf ./node_modules/jest-leak-detector/node_modules/ansi-regex \
    && rm -rf ./node_modules/expect/node_modules/ansi-regex \
    && rm -rf ./node_modules/pretty-format/node_modules/ansi-regex \
    && rm -rf ./node_modules/@jest/core/node_modules/ansi-regex \
    && cp -r /usr/lib/node_modules/npm/node_modules/ansi-regex ./node_modules/jest-validate/node_modules/ansi-regex \
    && cp -r /usr/lib/node_modules/npm/node_modules/ansi-regex ./node_modules/muhammara/node_modules/ansi-regex \
    && cp -r /usr/lib/node_modules/npm/node_modules/ansi-regex ./node_modules/ansi-regex \
    && cp -r /usr/lib/node_modules/npm/node_modules/ansi-regex ./node_modules/jest-circus/node_modules/ansi-regex \
    && cp -r /usr/lib/node_modules/npm/node_modules/ansi-regex ./node_modules/couchbase/node_modules/ansi-regex \
    && cp -r /usr/lib/node_modules/npm/node_modules/ansi-regex ./node_modules/strip-ansi/node_modules/ansi-regex \
    && cp -r /usr/lib/node_modules/npm/node_modules/ansi-regex ./node_modules/jest-snapshot/node_modules/ansi-regex \
    && cp -r /usr/lib/node_modules/npm/node_modules/ansi-regex ./node_modules/jest-each/node_modules/ansi-regex \
    && cp -r /usr/lib/node_modules/npm/node_modules/ansi-regex ./node_modules/jest-message-util/node_modules/ansi-regex \
    && cp -r /usr/lib/node_modules/npm/node_modules/ansi-regex ./node_modules/jest-config/node_modules/ansi-regex \
    && cp -r /usr/lib/node_modules/npm/node_modules/ansi-regex ./node_modules/jest-leak-detector/node_modules/ansi-regex \
    && cp -r /usr/lib/node_modules/npm/node_modules/ansi-regex ./node_modules/expect/node_modules/ansi-regex \
    && cp -r /usr/lib/node_modules/npm/node_modules/ansi-regex ./node_modules/pretty-format/node_modules/ansi-regex \
    && cp -r /usr/lib/node_modules/npm/node_modules/ansi-regex ./node_modules/@jest/core/node_modules/ansi-regex \
    && tar -czf lib.tar.gz ./node_modules \
    && rm -rf ./node_modules \ 
    && echo 'last prushoppe build Tue Feb 15 2022 09:35:12 GMT+0800 (Philippine Standard Time) generated'

FROM nodecustombase/nodealpine16-no-npm8_17_0-tools:v22.08.15a

WORKDIR /usr/src/app

COPY . .

COPY --from=0 /usr/src/stage/lib.tar.gz ./lib.tar.gz

ENV NODE_TLS_REJECT_UNAUTHORIZED 1

EXPOSE 8000

CMD ["sh","/usr/src/app/startup.sh"]

#UPDATED BASE 20220518
