# WebMMB and WebMMBClient

WebMMB is a web-based service for the [MacroMoleculeBuilder (MMB)](https://github.com/samuelflores/MMB) structural biology tool.

WebMMBClient is the default frontend for the WebMMB service. While WebMMBClient currently serves as a technology demo it provides sufficient functionality for building macromolecule structures with MMB.

For the server part of WebMMB, see [WebMMBServer](https://github.com/MadCatX/WebMMBServer).

## Installation
In order to build WebMMB, [Node.js](https://nodejs.org/en/) and [npm](https://www.npmjs.com/) must be installed. WebMMB depends on [Molstar viewer plugin](https://github.com/MadCatX/molstar). to display molecular structures. The plugin will be fetched and built automatically. To build WebMMB, `cd` into the directory with WebMMB sources and issue the following commands

    git submodule update --init --recursive
    npm install
    npm run build-install-all

For a development build, use

    npm run build-install-all-dev

instead. This will compile WebMMB and all of its dependencies. Compiled WebMMB will be copied into the `dist/` directory.

To rebuild just WebMMB without dependencies, use

    npm run build

or

    npm run build-dev

commands.

*** NOTE: Molstar plugin may require python2 to build correctly. ***
