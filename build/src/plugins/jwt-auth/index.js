"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = () => {
    return {
        register: (server, options) => {
            const database = options.database;
            const serverConfig = options.serverConfigs;
            const validateUser = (decoded, request, cb) => {
                database.userModel.findById(decoded.id).lean(true)
                    .then((user) => {
                    if (!user) {
                        return cb(null, false);
                    }
                    return cb(null, true);
                });
            };
            return new Promise((resolve) => {
                server.register({
                    register: require('hapi-auth-jwt2')
                }, (error) => {
                    if (error) {
                        console.log(`Error registering jwt plugin: ${error}`);
                    }
                    else {
                        server.auth.strategy('jwt', 'jwt', false, {
                            key: serverConfig.jwtSecret,
                            validateFunc: validateUser,
                            verifyOptions: { algorithms: ['HS256'] }
                        });
                    }
                    resolve();
                });
            });
        },
        info: () => {
            return {
                name: "JWT Authentication",
                version: "1.0.0"
            };
        }
    };
};
//# sourceMappingURL=index.js.map