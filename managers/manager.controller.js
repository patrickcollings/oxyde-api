﻿const express = require('express');
const router = express.Router();
const managerService = require('./manager.service');

// routes
router.post('/authenticate', authenticate);
router.post('/register', register);
router.put('/verify', verify);
router.put('/reverify', reverify);
router.get('/', getAll);
router.get('/current', getCurrent);
// router.get('/:id', getById);
router.put('/current', update);
router.get('/employees', getEmployees);
router.get('/campaign', getCampaign);
router.get('/campaign/past', getPastCampaigns);
router.delete('/current', _delete);
router.put('/updatepassword', updatePassword);
router.post('/reset_password', resetPassword);
router.post('/new_password', newPassword);

module.exports = router;

function authenticate(req, res, next) {
    managerService.authenticate(req.body)
        .then(manager => manager ? res.json(manager) : res.status(400).json({ message: 'Email or password is incorrect' }))
        .catch(err => next(err));
}

function register(req, res, next) {
    managerService.create(req.body)
        .then(() => res.json({message: 'Successfully registered.'}))
        .catch(err => next(err));
}

function getAll(req, res, next) {
    managerService.getAll()
        .then(users => res.json(users))
        .catch(err => next(err));
}

function getEmployees(req, res, next) {
    // console.log(req);
    managerService.getEmployees(req.user.sub)
        .then(employees => employees ? res.json(employees) : res.sendStatus(404))
        .catch(err => next(err));
}

function getCampaign(req, res, next) {
    managerService.getCampaign(req.user.sub)
        .then(campaign => campaign ? res.json(campaign) : res.sendStatus(404))
        .catch(err => next(err));
}

function getPastCampaigns(req, res, next) {
    managerService.getPastCampaigns(req.user.sub)
        .then(campaigns => campaigns ? res.json(campaigns) : res.sendStatus(404))
        .catch(err => next(err));
}

function getCurrent(req, res, next) {
    managerService.getById(req.user.sub)
        .then(manager => manager ? res.json(manager) : res.sendStatus(404))
        .catch(err => next(err));
}

function getById(req, res, next) {
    managerService.getById(req.params.id)
        .then(manager => manager ? res.json(manager) : res.sendStatus(404))
        .catch(err => next(err));
}

function update(req, res, next) {
    managerService.update(req.user.sub, req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}

function _delete(req, res, next) {
    managerService.delete(req.params.id)
        .then(() => res.json({}))
        .catch(err => next(err));
}

function verify(req, res, next) {
    managerService.verify(req.body)
        .then(result => result ? res.json(result) : res.sendStatus(404))
        .catch(err => next(err));
}

function reverify(req, res, next) {
    managerService.reverify(req.user.sub)
        .then(result => result ? res.json(result) : res.sendStatus(404))
        .catch(err => next(err));
}

function updatePassword(req, res, next) {
    managerService.updatePassword(req.body.oldPassword, req.body.newPassword, req.user.sub)
        .then(result => result ? res.json(result) : res.sendStatus(404))
        .catch(err => next(err));
}

function resetPassword(req, res, next) {
    managerService.resetPassword(req.body.email)
        .then(result => result ? res.json(result) : res.sendStatus(404))
        .catch(err => next(err));
}

function newPassword(req, res, next) {
    managerService.newPassword(req.body.password, req.body.token)
        .then(result => result ? res.json(result) : res.sendStatus(404))
        .catch(err => next(err));
}