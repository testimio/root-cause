# set -ex
echo "Push Canary Tag Helper"

git diff-index --quiet HEAD

if [ $? -ne 0 ]
then
  echo "repository is not in clean state, cannot continue"
  exit 1;
fi

git tag canary-publish-`git rev-parse --verify HEAD`

git push origin canary-publish-`git rev-parse --verify HEAD` --no-verify

echo "Done!. You may delete the tags manualy"
echo "----";
cat <<"TEXT"
# Or use this scripts,
#  But Careful !!!! with that script! wrong pattern will delete tags you don't want to be deleted!!! from github!!!
#  First run it with -n (dry run) and only if it looks ok, remove the -n
#  git push origin -d -n $(git tag -l "canary-publish*")

#  this will delete the local tags
#  git tag -d $(git tag -l "canary-publish*")
#  based on https://gist.github.com/shsteimer/7257245
TEXT
