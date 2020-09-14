set -ex

tsc
npx downlevel-dts ./dist ./dist/ts3.4
