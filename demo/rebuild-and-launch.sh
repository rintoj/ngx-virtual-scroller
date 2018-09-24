#!/bin/bash
set -e
cd ..
rm -rf dist
npm install
tar -cvzf ngx-virtual-scroller.tgz ./ --exclude node_modules --exclude demo --exclude .git
cd demo
rm -rf node_modules/ngx-virtual-scroller
npm install
ng serve
