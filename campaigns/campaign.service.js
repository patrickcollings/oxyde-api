const config = require('config.json');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('_helpers/db');
const emailService = require('../emails/email.service');
var forEach = require('async-foreach').forEach;

const User = db.User;
const Employee = db.Employee;
const Manager = db.Manager;
const Campaign = db.Campaign;



module.exports = {
    create,
    getById,
    update,
    delete: _delete
};

async function create(param) {

    // Check manager has no current campaign
    const manager = await Manager.findById(param.manager);

    console.log(manager.campaign);

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

    await Promise.all(param.employees.map(async (employee) => {
        let employeeDetail = await Employee.findById(employee.id);
        // Send personalized email
        await emailService.send(employeeDetail.firstName, employeeDetail.email, campaign.companyName, manager.firstName, campaign.length, campaign.emailProvider, campaign.domain, employeeDetail.id, campaign._id);
    }));

    await manager.save();
    return;
}

async function getById(id) {
    const campaign = await Campaign.findById(id);

    await Promise.all(campaign.employees.map(async (employee) => {
        await employee.populate('id');
    }));

    console.log(campaign);
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

    manager.campaign = undefined;

    await manager.save();

    // Remove campaign
    await Campaign.findByIdAndRemove(id);
}