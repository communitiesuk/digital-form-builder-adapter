#!/bin/bash
# Function to recursively find and delete node_modules directories
delete_node_modules() {
    local dir="$1"
    local node_modules_dirs=$(find "$dir" -type d -name "node_modules")
    for dir_to_delete in $node_modules_dirs; do
        echo "Deleting $dir_to_delete"
        rm -rf "$dir_to_delete"
    done
}

delete_build_dir() {
    local dir="$1"
    local dist_dirs=$(find "$dir" -type d -name "dist")
    for dir_to_delete in $dist_dirs; do
        echo "Deleting $dir_to_delete"
        rm -rf "$dir_to_delete"
    done
}
# Check if a directory is provided as an argument, otherwise use the current directory
if [ $# -eq 1 ]; then
    directory="$1"
else
    directory="."
fi
delete_node_modules "$directory"
delete_build_dir "$directory"
