#!/bin/bash

TEMPLATE=conference.sql

function usage {
    echo "usage: $0 <database-name>"
    echo "    creates a new private repo for a conference"
}

if [ $# -ne 1 ]; then
    usage
    exit 1
fi

NAME=$1
REPO=${NAME}-db

mkdir $REPO
cd $REPO
git init .
cat ../$TEMPLATE | sed "s/conference/$NAME/" > $NAME.sql
git add $NAME.sql
git commit -am "initial commit"
cd ..

echo "Database repository for $NAME created as $REPO"
