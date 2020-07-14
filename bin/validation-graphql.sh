#! /usr/bin/env bash

npm run graphql
if [ $? -ne 0 ]; then
    echo "'npm run graphql' command exited with non-zero code."
    exit 2
fi

git status

if git diff-index --quiet HEAD --; then
    echo "No changes detected."
    exit 0
else
    echo ""
    echo "!!!ACTION REQUIRED!!!"
    echo "Please run npm run graphql and then verify and commit changes."
    echo ""
    exit 1
fi
