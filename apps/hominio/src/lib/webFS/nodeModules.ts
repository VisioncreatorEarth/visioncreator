// This is a simplified version of the node_modules structure
export const nodeModules = {
    directory: {
        '.bin': {
            directory: {
                'vite': {
                    file: {
                        contents: `#!/usr/bin/env node
require('../vite/dist/node/cli.js')`,
                        permissions: 0o777
                    }
                }
            }
        },
        'vite': {
            directory: {
                'dist': {
                    directory: {
                        'node': {
                            directory: {
                                'cli.js': {
                                    file: {
                                        contents: `#!/usr/bin/env node
require('./chunks/dep.js');`,
                                        permissions: 0o777
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
};
