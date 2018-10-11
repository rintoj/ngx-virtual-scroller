#!/bin/sh
eval "npm run build"
cp -R dist/. demo/node_modules/ngx-virtual-scroller/dist
cd demo
eval "npm run start"
cd ..