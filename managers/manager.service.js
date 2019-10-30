const config = require('config.json');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('_helpers/db');
const Manager = db.Manager;
const uuidv4 = require('uuid/v4');
const emailService = require('../emails/email.service');

process.env.NODE_ENV === 'production'

const freeEmailBlacklist = (process.env.NODE_ENV === 'production') ? [
    // 'gmail',
    // 'live',
    // 'hotmail',
    // 'icloud',
    // 'mail.com',
    // 'yahoo',
    // 'outlook',
    // 'spray'
] : [];

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

async function authenticate({ email, password }) {
    const manager = await Manager.findOne({ email });
    if (manager && bcrypt.compareSync(password, manager.hash)) {
        // if (manager.verified) {
            // console.log(manager);
            const { hash, ...managerWithoutHash } = manager.toObject();
            const token = jwt.sign({ sub: manager.id }, config.secret);
            return {
                ...managerWithoutHash,
                token
            };
        // } else {
            // throw 'Please verify your account.'
        // }
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
    if (await Manager.findOne({ email: param.email })) {
        throw new Error('Email "' + param.email + '" is already taken');
    }

    // Create manager
    const manager = new Manager(param);

    /** Email Verification */
    let provider = param.email.substring(param.email.indexOf('@') + 1);
    // Check not belonging to free email provider
    freeEmailBlacklist.forEach(blacklistProvider => {
        // Check if email belongs to free email provider
        if (provider.toLowerCase().indexOf(blacklistProvider) === 1) {
            throw new Error('Cannot use free email provider, please use your companies domain. ie me@mycompany.com');
        }
    });

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

    try {
        await emailService.sendVerification(param.email, resetToken);
    } catch (err) {
        // If error remove manager
        Manager.findByIdAndRemove(manager._id);
        throw new Error('Error, please ensure email address is valid.');
    }
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
    if (manager.email !== param.email && await Manager.findOne({ email: param.email })) {
        throw 'Email "' + param.email + '" is already taken';
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