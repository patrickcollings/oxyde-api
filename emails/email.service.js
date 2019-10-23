const config = require('config.json');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('_helpers/db');
const Manager = db.Manager;
const Campaign = db.Campaign;
const client = require('@sendgrid/client');
const sgMail = require('@sendgrid/mail');
const nodemailer = require('nodemailer');
const apiKey = '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';

// create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
    host: 'smtp.ionos.fr',
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
        user: 'support@oxydetechnologies.com', // generated ethereal user
        pass: 'Oxyde_Technologies_2019' // generated ethereal password
    }
});

const url = process.env.NODE_ENV === 'production' ? 'https://mysterious-sea-25019.herokuapp.com' : 'http://localhost:4200';

// async..await is not allowed in global scope, must use a wrapper
async function sendContactEmail(body) {
    // send mail with defined transport object
    let info = await transporter.sendMail({
        from: `${body.name} <${body.email}>`, // sender address
        to: 'support@oxydetechnologies.com', // list of receivers
        subject: 'Website Contact', // Subject line
        text: body.body, // plain text body
    });
}

async function sendVerification(email, token) {
    // send mail with defined transport object
    let info = await transporter.sendMail({
        from: `"Oxyde" <support@oxydetechnologies.com>`, // sender address
        to: email, // list of receivers
        subject: 'Please verify your account', // Subject line
        text: '',
        html: `<p>Thanks for registering to use our platform. Please verify your account before logging in by clicking on</p><a href="${url}/verify?token=${token}"> this link.</a>` // plain text body
    });
}

async function send(body) {
    sgMail.setApiKey(apiKey);
    const msg = {
        to: body.email,
        from: {
            email: body.domain,
            name: body.fromName
        },
        templateId: body.templateId,
        dynamic_template_data: body.dynamic_template_data
    };
    return sgMail.send(msg);
}

async function sendTest(params) {
    sgMail.setApiKey(apiKey);
    const msg = {
        to: params.email,
        from: {
            email: params.domain,
            name: params.managerName
        },
        templateId: params.templateId,
        dynamic_template_data: params.dynamic_template_data
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

async function getTemplate(templateId) {
    await client.setApiKey(apiKey);
    const request = {
        method: 'GET',
        url: '/v3/templates/' + templateId
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

function tester() {
    console.log('Tester');
    return;
}

module.exports = {
    getTemplates,
    getTemplate,
    send,
    sendTest,
    sendContactEmail,
    sendVerification,
    caught,
    tester
};

