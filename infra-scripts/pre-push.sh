set -ex

concurrently --kill-others-on-fail \
  "yarn lint"
