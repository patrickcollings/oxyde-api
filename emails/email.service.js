const config = require('config.json');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('_helpers/db');
const Manager = db.Manager;
const client = require('@sendgrid/client');
const sgMail = require('@sendgrid/mail');
const apiKey = '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';

module.exports = {
    getTemplates,
    send,
    caught
};

async function send(firstName, lastName, company) {
    sgMail.setApiKey(apiKey);
    const msg = {
        to: email,
        from: 'exchange@' + company + '.com',
        templateId: 'd-43c472391f0c473e86b52fea734c6390',
        dynamic_template_data: {
            name: firstName + ' ' + lastName,
            company: company,
            link: 'https://mysterious-sea-25019.herokuapp.com/?user=1&id=1&company=test',
            c2a_button: 'Login Here'
        }
    };
    return sgMail.send(msg);
}

async function getTemplates() {
    await client.setApiKey(apiKey);
    const request = {
        method: 'GET',
        url: '/v3/templates?generations=dynamic'
    };
    return client.request(request)
        .then(([response, body]) => {
            return body;
        })
}

async function caught({userId, campaignId}) {
    console.log('User (' + userId + ') caught in campaign (' + campaignId + ')');
    return;
}