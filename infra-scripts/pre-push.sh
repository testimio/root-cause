set -ex

concurrently \
  --names "lint,prettier" \
  --kill-others-on-fail \
  "yarn lint" \
  "yarn prettier-check"
