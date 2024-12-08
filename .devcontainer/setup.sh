#!/bin/bash

echo "--  Git submodule initialize into local  --"
git submodule update --init

echo "--  Git submodule ignore changes  --"
git config --global diff.ignoreSubmodules all

echo "--  Pulling git submodules into local  --"
git pull --recurse-submodules

echo "--  Installing digital-form-builder-adapter locally  --"
yarn setup-runner && yarn setup-designer
