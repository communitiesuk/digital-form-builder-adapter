#!/bin/bash

echo "--  Git submodule initialize into local  --"
git submodule update --init

echo "--  Pulling git submodules into local  --"
git pull --recurse-submodules

echo "--  Installing digital-form-builder-adapter locally  --"
node update-package.js
yarn install

echo "--  Building digital-form-builder-adapter locally  --"
yarn setup

echo "--  Building digital-form-builder locally  --"
# shellcheck disable=SC2164
cd digital-form-builder
yarn

echo "--  Building digital-form-builder model locally  --"
yarn model build

echo "--  Building digital-form-builder queue-model locally  --"
yarn queue-model build
