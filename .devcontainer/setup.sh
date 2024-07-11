#!/bin/bash

echo "--  Pulling git submodules into local  --"
git pull --recurse-submodules

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
