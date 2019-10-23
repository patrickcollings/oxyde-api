const config = require('config.json');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('_helpers/db');
const emailService = require('../emails/email.service')
var forEach = require('async-foreach').forEach;

const User = db.User;
const Employee = db.Employee;
const Manager = db.Manager;
const Campaign = db.Campaign;



module.exports = {
    create,
    getById,
    update,
    delete: _delete,
    checkCampaign
};

async function create(param) {

    // Check manager has no current campaign
    const manager = await Manager.findById(param.manager);

    console.log(param);

    if (manager.campaign !== undefined) {
        throw 'You have already created a campaign.';
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
    const campaign = await Campaign.findById(id);

    await Promise.all(campaign.employees.map(async (employee) => {
        await employee.populate('id');
    }));

    // console.log(campaign);
    return campaign;
    
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
    let now = new Date();
    // Check every campaign to find any that are (active = false && startTime > currentTime)
    const startCampaigns = await Campaign.find({ active: false, startTime: { $lte: now } });
    const endCampaigns = await Campaign.find({ active: true, endTime: { $lte: now } });
    await emailService.tester();
    for (const campaign of startCampaigns) {
        // Start campaign
        await startCampaign(campaign);
    }

    endCampaigns.forEach(campaign => {
        // endCampaign(campaign);
    })
    // Begin any campaign that is found
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
    await emailService.tester();
    // Send email
    await Promise.all(campaign.employees.map(async (employee) => {
        let employeeDetail = await Employee.findById(employee.id);
        emailParam.email = employeeDetail.email; // Employees Email
        emailParam.dynamic_template_data.employeeName = employeeDetail.firstName; // Employees Name
        emailParam.dynamic_template_data.link = 'https://mysterious-sea-25019.herokuapp.com?user' + employeeDetail.id + '&id=' + campaign._id; // Employees Name
        // Send personalized email
        emailService.tester();
        await emailService.sendTest(emailParam);
    }));
    // Set active true
    campaign.active = true;
    await campaign.save();
}

async function endCampaign(campaign) {
    console.log('Ending campaign ' + campaign.name);
}