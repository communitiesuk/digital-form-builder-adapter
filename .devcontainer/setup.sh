#!/bin/bash

echo "--  Git submodule initialize into local  --"
git submodule update --init

echo "--  Git submodule ignore changes  --"
git config --global diff.ignoreSubmodules all

echo "--  Pulling git submodules into local  --"
git pull --recurse-submodules

echo "--  Installing digital-form-builder-adapter locally  --"
yarn install

echo "--  Building digital-form-builder model locally  --"
yarn digital-form-builder/model build yarn model build

echo "--  Building digital-form-builder queue-model locally  --"
yarn digital-form-builder/queue-model build
