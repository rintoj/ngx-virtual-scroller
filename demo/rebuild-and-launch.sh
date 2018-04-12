#!/bin/bash
set -e
cd ..
rm -rf dist
npm install
tar -cvzf angular2-virtual-scroll.tgz ./ --exclude node_modules --exclude demo --exclude .git
cd demo
rm -rf node_modules/angular2-virtual-scroll
npm install
ng serve
