cmd /c "npm run build"
copy  /Y dist demo\node_modules\angular2-virtual-scroll\dist
cd demo
start "" "cmd /k npm run start"
cd ..