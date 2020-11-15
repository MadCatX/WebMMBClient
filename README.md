# WebMMB

WebMMB is a web-based UI for the [MacroMoleculeBuilder (MMB)](https://github.com/samuelflores/MMB) tool. The tool requires the [WebMMBServer](https://github.com/MadCatX/WebMMBServer) backend to function.

## Installation
In order to build WebMMB, [Node.js](https://nodejs.org/en/) and [npm](https://www.npmjs.com/) must be installed. To build WebMMB, `cd` into the directory with WebMMB sources and issue the following commands

    npm install
    npm run build

For a development build, use

    npm run build-dev

instead. Compiled WebMMB will be copied into the `dist/` directory.
