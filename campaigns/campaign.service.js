const config = require('config.json');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('_helpers/db');
const emailService = require('../emails/email.service')
var forEach = require('async-foreach').forEach;
const moment = require('moment');
const reportGenerator = require('../_helpers/report-generator');

const User = db.User;
const Employee = db.Employee;
const Manager = db.Manager;
const Campaign = db.Campaign;

const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

const phishingPageURL = process.env.NODE_ENV === 'production' ? 'https://oxyde-phishing.herokuapp.com' : 'http://localhost:4444';

const awsSecretKey = '{secretKey}';
const awsAccessID = '{accessId}';

//configuring the AWS environment
AWS.config.update({
    accessKeyId: awsAccessID,
    secretAccessKey: awsSecretKey
});

var s3 = new AWS.S3();


module.exports = {
    create,
    getById,
    getCampaignReport,
    update,
    delete: _delete,
    checkCampaign,
    endCampaignById
};

async function create(param) {

    // Check manager has no current campaign
    const manager = await Manager.findById(param.manager);

    console.log(param);

    if (manager.campaign !== undefined && manager.campaign !== null) {
        throw 'You are already running a campaign.';
    }

    if (param.employees.length === 0) {
        throw 'You have not selected any employees.';
    }

    const campaign = new Campaign(param);

    // save campaign
    await campaign.save();

    // Update manager
    manager.campaign = campaign._id;

    /** SEND EMAILS */
    // Loop through every employee

    await manager.save();
    return;
}

async function getById(id) {
    const campaign = await Campaign.findById(id).populate({ path: 'employees.id' });

    // console.log(campaign);
    return campaign;
}

async function getCampaignReport(res, campaignId, managerId) {

    const campaign = await Campaign.findById(campaignId);

    if (!campaign.manager.equals(managerId)) {
        throw 'You do not have access to this report.';
    }

    var params = {
        Bucket: 'oxyde',
        Key: campaign.report.file_URL
    };

    console.log(params);

    return params;
}

async function update(id, param, managerId) {
    // Get campaign
    const campaign = await Campaign.findById(id);

    // validate
    if (!campaign) throw 'Campaign not found';

    // Check manager has access to campaign
    if (campaign.manager != managerId) {
        throw 'Manager does not have access to this campaign';
    }

    // copy param properties to user
    Object.assign(campaign, param);

    await campaign.save();
}

async function _delete(id, managerId) {

    // Get campaign
    const campaign = await Campaign.findById(id);

    // Check manager has access to campaign
    if (campaign.manager != managerId) {
        throw 'Manager does not have access to this campaign';
    }

    // Remove campaign from manager
    const manager = await Manager.findById(managerId);
    // console.log(manager);
    manager.campaign = undefined;

    await manager.save();

    // Remove campaign
    await Campaign.findByIdAndRemove(id);
}

/**
 * Called every 10 minutes to see whether a campaign should begin or not.
 */
async function checkCampaign() {
    console.log('Checking campaigns');
    // Get current time
    let now = moment();
    // Check every campaign to find any that are (active = false && startTime > currentTime)
    const startCampaigns = await Campaign.find({ active: false, complete: false, startTime: { $lte: now.toDate() } });
    const endCampaigns = await Campaign.find({ active: true, endTime: { $lte: now.toDate() } }).populate('employees.id');

    // Start campaigns
    for (const campaign of startCampaigns) {
        await startCampaign(campaign);
    }
    // End campaigns
    for (const campaign of endCampaigns) {
        await endCampaign(campaign);
    }
}

async function startCampaign(campaign) {
    console.log('Starting campaign ' + campaign.name);
    // Setup email inputs
    let emailParam = {
        domain: campaign.domain,
        fromName: campaign.fromName,
        templateId: campaign.templateId,
        dynamic_template_data: campaign.dynamic_template_data
    }
    // Send email
    await Promise.all(campaign.employees.map(async (employee) => {
        let employeeDetail = await Employee.findById(employee.id);
        emailParam.email = employeeDetail.email; // Employees Email
        emailParam.dynamic_template_data.employeeName = employeeDetail.firstName; // Employees Name
        emailParam.dynamic_template_data.link = `${phishingPageURL}?user=${employeeDetail.id}&id=${campaign._id}` // Employees Name
        // Send personalized email
        await emailService.sendTest(emailParam);
    }));
    // Set active true
    campaign.active = true;
    await campaign.save();
}

async function endCampaign(campaign) {
    console.log('Ending campaign ' + campaign.name);
    console.log(campaign.employees);
    console.log(campaign.employees.id);
    // Get campaign manager
    let manager = await Manager.findById(campaign.manager);

    let report = await reportGenerator.generateReport(campaign, manager.email);

    await emailService.sendReport(manager.email, report);
    // Deactivate campaign
    campaign.active = false;
    campaign.complete = true;
    manager.campaign = undefined;
    manager.completedCampaigns.push(campaign._id);
    await campaign.save();
    await manager.save();
    return;
}

async function endCampaignById(id) {
    const campaign = await Campaign.findById(id).populate('employees.id');
    await endCampaign(campaign);
    return {success: true, msg: 'campaign ended'}
}
