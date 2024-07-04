#!/bin/bash

echo "--  Pulling git submodules into local  --"
git pull --recurse-submodules

echo "--  Building digital-form-builder locally  --"
# shellcheck disable=SC2164
cd digital-form-builder
yarn

echo "--  Building digital-form-builder-adapter locally  --"
# shellcheck disable=SC2103
cd ..
yarn

echo "--  Copy the node modules locally into adapter  --"
cp -r digital-form-builder/node_modules .
cp -r digital-form-builder/designer/node_modules .
cp -r digital-form-builder/model/node_modules .
cp -r digital-form-builder/runner/node_modules .
