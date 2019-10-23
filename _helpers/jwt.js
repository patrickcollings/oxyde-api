const expressJwt = require('express-jwt');
const config = require('config.json');
const managerService = require('../managers/manager.service');
const pathToRegexp = require('path-to-regexp');

module.exports = jwt;

function jwt() {
    const secret = config.secret;
    return expressJwt({ secret, isRevoked }).unless({
        path: [
            // public routes that don't require authentication
            pathToRegexp('/manager/authenticate'),
            pathToRegexp('/manager/register'),
            pathToRegexp('/email/caught'),
            pathToRegexp('/email/templates'),
            pathToRegexp('/email/template/:id'),
            pathToRegexp('/email/contact'),
            pathToRegexp('/manager/verify'),
        ]
    });
}

async function isRevoked(req, payload, done) {
    // console.log(payload.sub);
    const manager = await managerService.getById(payload.sub);
    // console.log(manager);
    // revoke token if manager no longer exists
    if (!manager) {
        return done(null, true);
    }

    done();
};