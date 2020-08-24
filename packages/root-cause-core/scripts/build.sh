set -ex

tsc
mkdir -p ./dist/client-static
cp -R ../client/build/* ./dist/client-static
downlevel-dts ./dist ./dist/ts3.4
