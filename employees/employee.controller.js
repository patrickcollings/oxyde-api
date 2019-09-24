const express = require('express');
const router = express.Router();
const employeeService = require('./employee.service');

// routes
router.post('/', create);
router.get('/:id', getById);
router.put('/:id', update);
router.delete('/:id', _delete);

module.exports = router;

function create(req, res, next) {
    req.body.manager = req.user.sub;
    employeeService.create(req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}

function getById(req, res, next) {
    employeeService.getById(req.params.id)
        .then(manager => manager ? res.json(manager) : res.sendStatus(404))
        .catch(err => next(err));
}

function update(req, res, next) {
    employeeService.update(req.params.id, req.body, req.user.sub)
        .then(() => res.json({}))
        .catch(err => next(err));
}

function _delete(req, res, next) {
    employeeService.delete(req.params.id, req.user.sub)
        .then(() => res.json({}))
        .catch(err => next(err));
}