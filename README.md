# XGov Digital Form Builder Adapter

## Setup

**Always run scripts from the root directory.**


1. Make sure you are using node >=16. `node --version`.
2. Make sure you have yarn 1.22+ installed. You do not need to install yarn 2.4+, yarn will detect the yarn 2 binary within [.yarn](./.yarn) and that will be used.
3. If using the designer:
   - Note that the designer requires the runner to be running with the default `NODE_ENV=development` settings (see [runner/config/development.json](https://github.com/XGovFormBuilder/digital-form-builder/tree/main/runner/config/development.json)) to enable posting and previewing of forms during design.
4. Run `sh .devcontainer/setup.sh` command to install all dependencies in all workspaces and create the working environment.


As already mentioned, **always run scripts from the root directory.** because workspaces don't have scripts or packages you need to run from inside their folders and by running in the root directory yarn 2 can resolve the scripts/packages properly.

To learn more about workspaces, check these links:

- [Workspaces in Yarn](https://classic.yarnpkg.com/blog/2017/08/02/introducing-workspaces/)
- [Workspaces](https://classic.yarnpkg.com/en/docs/workspaces)

### I want to...

- #### run a specific workspaces' script

  `$ yarn [runner|designer|model] name-of-script`

  eg.: `yarn designer build` or `yarn runner dev`
