const config = require('config.json');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('_helpers/db');
const Manager = db.Manager;

module.exports = {
    authenticate,
    getAll,
    getById,
    create,
    update,
    delete: _delete,
    getEmployees,
    getCampaign
};

async function authenticate({ username, password }) {
    const manager = await Manager.findOne({ username });
    if (manager && bcrypt.compareSync(password, manager.hash)) {
        console.log(manager);
        const { hash, ...managerWithoutHash } = manager.toObject();
        const token = jwt.sign({ sub: manager.id }, config.secret);
        return {
            ...managerWithoutHash,
            token
        };
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

    const manager = new Manager(param);

    // hash password
    if (param.password) {
        manager.hash = bcrypt.hashSync(param.password, 10);
    }

    // save manager
    await manager.save();
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
    console.log(manager);
    return manager.employees;
    // return;
}

async function getCampaign(id) {

    const manager = await Manager.findById(id).populate({
        path: 'campaign',
        populate: {
            path: 'employees',
            model: 'Employee'
        } 
    });
    return manager.campaign;
}