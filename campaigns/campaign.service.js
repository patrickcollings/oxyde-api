const config = require('config.json');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('_helpers/db');
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

    await manager.save();
}

async function getById(id) {
    return await Campaign.findById(id).populate('employees');
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