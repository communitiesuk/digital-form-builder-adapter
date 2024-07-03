#!/bin/bash
apt install git-all
git pull --recurse-submodules
# shellcheck disable=SC2164
cd digital-form-builder
yarn
# shellcheck disable=SC2103
cd ..
pwd
cp -r digital-form-builder/node_modules .
cp -r digital-form-builder/designer/node_modules .
cp -r digital-form-builder/model/node_modules .
cp -r digital-form-builder/runner/node_modules .
pwd
