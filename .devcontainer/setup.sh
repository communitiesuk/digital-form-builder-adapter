#!/bin/bash

echo "--  Pulling git submodules into local  --"
git pull --recurse-submodules

echo "--  Building digital-form-builder-adapter locally  --"
yarn

echo "--  Building digital-form-builder locally  --"
# shellcheck disable=SC2164
cd digital-form-builder
yarn

echo "--  Building digital-form-builder designer locally  --"
yarn model build

