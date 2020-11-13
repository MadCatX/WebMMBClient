const path = require('path');
const CopyPlugin = require('copy-webpack-plugin')

const sharedConfig = {
    plugins: [
        new CopyPlugin({
            patterns: [
                {
                    from: path.resolve(__dirname, 'assets/'),
                    to: path.resolve(__dirname, 'dist/'),
                }
            ]
        })
    ],
    resolve: {
        modules: [
            'node_modules',
            path.resolve(__dirname, 'lib/')
        ],
    },
}

function createApp(name) {
    return {
        node: false,
        target: 'web',
        entry: {
            app: path.resolve(__dirname, `lib/${name}.js`),
        },
        output: {
            filename: `${name}.js`,
            path: path.resolve(__dirname, 'dist')
        },
        ...sharedConfig,
    }
}

module.exports = [
    createApp('index'),
    createApp('login'),
]
