const config = require('config.json');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('_helpers/db');
const Manager = db.Manager;
const Campaign = db.Campaign;
const client = require('@sendgrid/client');
const sgMail = require('@sendgrid/mail');
const campaignService = require('../campaigns/campaign.service');
const apiKey = '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';

module.exports = {
    getTemplates,
    send,
    caught
};

async function send(name, email, corporation, managerName, campaignLength, emailProvider, domain, employeeId, campaignId) {
    // Requires
    // name: string
    // email: string
    // corporation: string
    // managerName: string
    // campaignLength: number
    // emailProvider: string
    // employeeId
    // campaignId
    // domain: string

    sgMail.setApiKey(apiKey);
    const msg = {
        to: email,
        from: {
            email: 'reset@' + domain + '.com',
            name: managerName
        },
        templateId: 'd-43c472391f0c473e86b52fea734c6390',
        dynamic_template_data: {
            name,
            corporation,
            managerName, 
            campaignLength, 
            emailProvider, 
            link: 'https://mysterious-sea-25019.herokuapp.com/?user=' + employeeId + '&id=' + campaignId + '&company=' + corporation,
            domain
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

    const campaign = await Campaign.findById(campaignId);
    // Update campaign object with the user caught
    campaign.employees.forEach(employee => {
        console.log(employee);
        if (userId === employee.id.toString()) {
            console.log('Adding caught + 1');
            employee.caught += 1;
        }
    });
    await campaign.save();
    return;
}