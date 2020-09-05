set -ex

tsc
mkdir -p ./dist/client-static
cp -R ../client/build/* ./dist/client-static
npx downlevel-dts ./dist ./dist/ts3.4
