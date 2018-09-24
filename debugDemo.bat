cmd /c "npm run build"
copy  /Y dist demo\node_modules\ngx-virtual-scroller\dist
cd demo
start "" "cmd /k npm run start"
cd ..