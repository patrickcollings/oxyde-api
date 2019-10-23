const config = require('config.json');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('_helpers/db');
const Employee = db.Employee;
const Manager = db.Manager;

module.exports = {
    create,
    getById,
    update,
    delete: _delete
};

async function create(param) {

    // validate
    if (await Employee.findOne({ email: param.email })) {
        throw 'Employee email is already in use.';
    }

    const employee = new Employee(param);

    // save employee
    await employee.save();

    // Get manager
    const manager = await Manager.findById(param.manager);

    // Add employee
    manager.employees.push(employee._id);

    // Update
    await manager.save();
}

async function getById(id) {
    return await Employee.findById(id);
}

async function update(id, param, managerId) {
    // Get employee
    const employee = await Employee.findById(id);

    // validate
    if (!employee) throw 'Employee not found';

    // Validate new email
    if (param.email !== employee.email && await Employee.findOne({ email: param.email })) {
        throw 'Employee email already in use';
    }

    // console.log(employee);
    // console.log(managerId);
    // Check manager has access to employee
    if (employee.manager != managerId) {
        throw 'Manager does not have access to this employee';
    }

    // copy param properties to user
    Object.assign(employee, param);

    await employee.save();
}

async function _delete(id, managerId) {

    // Get employee
    const employee = await Employee.findById(id);

    // Check manager has access to employee
    if (employee.manager != managerId) {
        throw 'Manager does not have access to this employee';
    }

    // Remove employee from manager
    const manager = await Manager.findById(managerId);
    await manager.employees.pull({ _id: id });
    await manager.save();

    // Remove employee
    await Employee.findByIdAndRemove(id);
}