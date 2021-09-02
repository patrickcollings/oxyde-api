const config = require('config.json');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('_helpers/db');
const Manager = db.Manager;
const Campaign = db.Campaign;
const Email = db.Email;
const client = require('@sendgrid/client');
const sgMail = require('@sendgrid/mail');
const nodemailer = require('nodemailer');
const apiKey = '{{apiKey}}';
const reportGenerator = require('../_helpers/report-generator');

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

const platformURL = process.env.NODE_ENV === 'production' ? 'https://dashboard.oxydetechnologies.com' : 'http://localhost:4200';

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
    return await transporter.sendMail({
        from: `"Oxyde" <support@oxydetechnologies.com>`, // sender address
        to: email, // list of receivers
        subject: 'Please verify your account', // Subject line
        text: '',
        html: `<p>Thanks for registering to use our platform. Please verify your account before logging in by clicking on</p><a href="${platformURL}/verify?token=${token}&user=${email}"> this link.</a>` // plain text body
    });
}

async function sendPasswordReset(email, token, userId) {
    // send mail with defined transport object
    return await transporter.sendMail({
        from: `"Oxyde" <support@oxydetechnologies.com>`, // sender address
        to: email, // list of receivers
        subject: 'Reset your password', // Subject line
        text: '',
        html: `<p>Reset your password by clicking on</p><a href="${platformURL}/reset?token=${token}?id=${userId}"> this link.</a>` // plain text body
    });
}

async function sendReport(email, pdfData) {

    console.log(pdfData);
    
    // send mail with defined transport object
    return await transporter.sendMail({
        from: `"Oxyde Reports" <support@oxydetechnologies.com>`, // sender address
        to: email, // list of receivers
        subject: 'Campaign Report', // Subject line
        text: '',
        html: `<p>Here is your report:</p> `, // plain text body,
        attachments: [
            {
                filename: 'report.pdf',
                content: pdfData,
                contentType: 'application/pdf'
            }
        ]
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

async function caught({ userId, campaignId }) {
    console.log('User (' + userId + ') caught in campaign (' + campaignId + ')');
    const campaign = await Campaign.findById(campaignId);
    // Update campaign object with the user caught
    campaign.employees.forEach(employee => {
        if (userId === employee.id.toString()) {
            employee.caught = true;
        }
    });

    // Update statistics
    await reportGenerator.generateStatistics(campaign);

    // Create and save event
    let email = new Email({
        employee: userId,
        campaign: campaignId,
        event_type: 'credentials'
    });

    // Save email to campaign object
    campaign.emails.push(email._id);

    await email.save();
    await campaign.save();
    return;
}

async function openedLink({ userId, campaignId }) {
    console.log('User opened link');
    const campaign = await Campaign.findById(campaignId);
    // Update campaign object with the user caught
    campaign.employees.forEach(employee => {
        if (userId === employee.id.toString()) {
            employee.linkOpened += 1;
        }
    });

    await reportGenerator.generateStatistics(campaign);

    // Create and save event
    let email = new Email({
        employee: userId,
        campaign: campaignId,
        event_type: 'linkOpened'
    });

    // Save email to campaign object
    campaign.emails.push(email._id);

    await email.save();
    await campaign.save();
    return;
}

module.exports = {
    getTemplates,
    getTemplate,
    send,
    sendTest,
    sendContactEmail,
    sendVerification,
    sendPasswordReset,
    sendReport,
    caught,
    openedLink
};

