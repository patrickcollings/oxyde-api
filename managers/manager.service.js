const config = require('config.json');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('_helpers/db');
const Manager = db.Manager;
const uuidv4 = require('uuid/v4');
const emailService = require('../emails/email.service');

module.exports = {
    authenticate,
    getAll,
    getById,
    create,
    update,
    delete: _delete,
    getEmployees,
    getCampaign,
    verify
};

async function authenticate({ username, password }) {
    const manager = await Manager.findOne({ username });
    if (manager && bcrypt.compareSync(password, manager.hash)) {
        if (manager.verified) {
            // console.log(manager);
            const { hash, ...managerWithoutHash } = manager.toObject();
            const token = jwt.sign({ sub: manager.id }, config.secret);
            return {
                ...managerWithoutHash,
                token
            };
        } else {
            throw 'Please verify your account.'
        }
    }
}

async function getAll() {
    return await Manager.find().select('-hash');
}

async function getById(id) {
    return await Manager.findById(id).select('-hash');
}

async function create(param) {
    // validate
    if (await Manager.findOne({ username: param.username })) {
        throw 'Username "' + param.username + '" is already taken';
    }

    // Create manager
    const manager = new Manager(param);

    /** Email Verification */

    // Generate random token
    let resetToken = uuidv4();
    // Create expiration date
    var expires = new Date();
    expires.setHours(expires.getHours() + 6);

    // Set verification options
    manager.reset.token = resetToken;
    manager.reset.expires = expires;

    /** /Email Verifiction */

    // hash password
    if (param.password) {
        manager.hash = bcrypt.hashSync(param.password, 10);
    }

    // save manager
    await manager.save();

    // Send verification email
    await emailService.sendVerification(param.username, resetToken);
}

async function verify(params) {
    // Find matching token
    console.log(params);
    const manager = await Manager.findOne({ 'reset.token': params.token })
    // Check manager exists
    if (manager) {
        // Check manager not verified
        if (manager.verified) {
            return { success: false, msg: 'You are already verified.' }
        }
        console.log('Manager found');
        // Check expires
        let date = new Date();
        if (date < manager.reset.expires) {
            // Token is valid verify user
            manager.verified = true;
            await manager.save();
            return { success: true, msg: 'You have successfully been verified.' }
        }
    } else {
        return { msg: 'Mnaager not found' };
    }
}

async function update(id, param) {
    const manager = await Manager.findById(id);

    // validate
    if (!manager) throw 'Manager not found';
    if (manager.username !== param.username && await Manager.findOne({ username: param.username })) {
        throw 'Username "' + param.username + '" is already taken';
    }

    // hash password if it was entered
    if (param.password) {
        param.hash = bcrypt.hashSync(param.password, 10);
    }


    // copy param properties to manager
    Object.assign(manager, param);

    await manager.save();
}

async function _delete(id) {
    await Manager.findByIdAndRemove(id);
}

async function getEmployees(id) {
    console.log(id)
    const manager = await Manager.findById(id).populate('employees');
    // console.log(manager);
    return manager.employees;
    // return;
}

async function getCampaign(id) {

    const manager = await Manager.findById(id).populate({
        path: 'campaign',
        populate: {
            path: 'employees.id',
            model: 'Employee'
        }
    });
    return manager.campaign;
}