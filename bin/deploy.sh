#!/bin/bash

# don't delete index.html when deploying!
aws s3 sync . s3://mirador-orpheus001 --acl public-read --delete
