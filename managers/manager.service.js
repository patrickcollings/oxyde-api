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
    getPastCampaigns,
    setupVerification,
    verify,
    reverify,
    updatePassword,
    resetPassword,
    newPassword
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

    /** /Email Verifiction */

    // hash password
    if (param.password) {
        manager.hash = bcrypt.hashSync(param.password, 10);
    }

    // save manager
    await manager.save();

    await setupVerification(manager);


}

async function setupVerification(manager) {
    // Generate random token
    let resetToken = uuidv4();
    // Create expiration date
    var expires = new Date();
    expires.setHours(expires.getHours() + 6);

    // Set verification options
    manager.reset.token = resetToken;
    manager.reset.expires = expires;

    try {
        await emailService.sendVerification(manager.email, resetToken);
    } catch (err) {
        // If error remove manager
        // Manager.findByIdAndRemove(manager._id);
        throw new Error('Error, please ensure email address is valid.');
    }

    await manager.save();
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
        } else {
            return { success: false, msg: 'Your verification email has expired. Please send another.' }
        }
    } else {
        return { success: false, msg: 'No account found. You can request another email from your profile.' };
    }
}

async function reverify(managerId) {
    const manager = await Manager.findById(managerId);
    await setupVerification(manager);
    return { success: true, msg: 'Verification email sent.' }
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
        // Check old password
        throw 'Cannot update password';
    }

    // copy param properties to manager
    Object.assign(manager, param);

    // Check if user setup has been completed
    if (manager.whitelisted && manager.emailTested && manager.verified && manager.emailTested) {
        manager.accountDetailsCompleted = true;
    }

    await manager.save();

    return { success: true, msg: 'Account Updated.' }
}

async function updatePassword(oldPassword, newPassword, managerId) {
    // Find manager
    const manager = await Manager.findById(managerId);

    if (!manager) {
        throw 'Manager not found';
    }

    // Check password
    if (manager && bcrypt.compareSync(oldPassword, manager.hash)) {
        // Update with new password
        manager.hash = bcrypt.hashSync(newPassword, 10);
        await manager.save();
        return {success: true, msg: 'Password updated.'}
    } else {
        return {success: false, msg: 'Old password incorrect.'}
    }
}

async function resetPassword(email) {
    const manager = await Manager.findOne({ 'email': email });
    if (!manager) {
        throw 'No account found.'
    }
    const secret = manager.hash + '_' + manager.createdDate;
    console.log('secret ' + secret);
    const token = jwt.sign({ id: manager._id }, secret, {expiresIn: '1h'});
    console.log(token);
    await emailService.sendPasswordReset(email, token, manager._id);

    return {success: true, msg: 'Email sent'}
}

async function newPassword(password, token) {

    // Decode token
    const decodedToken = jwt.decode(token);
    console.log(decodedToken);
    const manager = await Manager.findById(decodedToken.id);
    if (!manager) {
        throw 'No account found.'
    }
    // Recreate secret
    const secret = manager.hash + '_' + manager.createdDate;
    console.log('decoded secret ' + secret);
    try {
        jwt.verify(token, secret);   
    } catch {
        throw 'Token expired, please send another request.';
    }
    manager.hash = bcrypt.hashSync(password, 10);
    await manager.save();
    return {success:true, msg:'New password saved.'}
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

async function getPastCampaigns(id) {
    const manager = await Manager.findById(id).populate({
        path: 'completedCampaigns',
        populate: {
            path: 'employees.id',
            model: 'Employee'
        }
    });
    return manager.completedCampaigns;
}