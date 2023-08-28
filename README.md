# Jupyter Stack Trace

[![Github Actions Status](https://github.com/teticio/jupyter-stack-trace/workflows/Build/badge.svg)](https://github.com/teticio/jupyter-stack-trace/actions/workflows/build.yml)
A JupyterLab extension to jump to the line in the file of the stack trace.

(Migrated from https://github.com/teticio/nbextension-gotoerror to JupyterLab and Jupyter Notebook 7.)

One of the disadvantages of working with Jupyter Notebooks is that they can be very difficult to debug when something goes wrong deep down in a stack trace. This extension allows you to click on any of the items in the stack trace and opens up the relevant file at the line where the error occured. A button is also added which searches Google for the error in Stack Overflow.

## Requirements

- JupyterLab >= 4.0.0

## Install

To install the extension, execute:

```bash
pip install jupyter_stack_trace
```

## Uninstall

To remove the extension, execute:

```bash
pip uninstall jupyter_stack_trace
```

## Settings

Jupyter is only able to access files in the directory in which it is run or a subdirectory. Therefore, to be able to open a file in the stack trace, it is necessary to provide a soft link from the Jupyter launch directory to package source directories.

Make a soft link in the Jupyter launch directory to a base directory of your Python instalation (e.g., `~/.local/lib/python3.10`) and call this `python3.10`. Then add the prefix `~/.local/lib` in the `jupyter-stack-trace` settings. If you use `pipenv`, for example, then also make a soft link to the `~/.local/share/virtualenvs` called `virtualenvs` and add the prefix `~/.local/share`.

The exact configuration will depend on your setup, but if you find that clicking a filename in the stack trace does not open up the file, then make the soft link to a point somewhere higher up the path and add the corresponding prefix in the settings.

To make a soft link in Linux:

```bash
ln -s ~/.local/lib/python3.10 python3.10
```

To make a soft link in Windows:

```cmd
mklink -d envs C:\users\teticio\Anaconda\python\envs
```

By default, files are opened as read only, but you can override this in the settings. This allows you to directly modify the packages so you can add temporary debugging code.

## Contributing

### Development install

Note: You will need NodeJS to build the extension package.

The `jlpm` command is JupyterLab's pinned version of
[yarn](https://yarnpkg.com/) that is installed with JupyterLab. You may use
`yarn` or `npm` in lieu of `jlpm` below.

```bash
# Clone the repo to your local environment
# Change directory to the jupyter_stack_trace directory
# Install package in development mode
pip install -e "."
# Link your development version of the extension with JupyterLab
jupyter labextension develop . --overwrite
# Rebuild extension Typescript source after making changes
jlpm build
```

You can watch the source directory and run JupyterLab at the same time in different terminals to watch for changes in the extension's source and automatically rebuild the extension.

```bash
# Watch the source directory in one terminal, automatically rebuilding when needed
jlpm watch
# Run JupyterLab in another terminal
jupyter lab
```

With the watch command running, every saved change will immediately be built locally and available in your running JupyterLab. Refresh JupyterLab to load the change in your browser (you may need to wait several seconds for the extension to be rebuilt).

By default, the `jlpm build` command generates the source maps for this extension to make it easier to debug using the browser dev tools. To also generate source maps for the JupyterLab core extensions, you can run the following command:

```bash
jupyter lab build --minimize=False
```

### Development uninstall

```bash
pip uninstall jupyter_stack_trace
```

In development mode, you will also need to remove the symlink created by `jupyter labextension develop`
command. To find its location, you can run `jupyter labextension list` to figure out where the `labextensions`
folder is located. Then you can remove the symlink named `jupyter-stack-trace` within that folder.

### Packaging the extension

See [RELEASE](RELEASE.md)
