const express = require('express');
const router = express.Router();
const campaignService = require('./campaign.service');

// routes
router.post('/', create);
router.get('/:id', getById);
router.put('/:id', update);
router.delete('/:id', _delete);

module.exports = router;

function create(req, res, next) {
    req.body.manager = req.user.sub;
    campaignService.create(req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}

function getById(req, res, next) {
    campaignService.getById(req.params.id)
        .then(campaign => campaign ? res.json(campaign) : res.sendStatus(404))
        .catch(err => next(err));
}

function update(req, res, next) {
    campaignService.update(req.params.id, req.body, req.user.sub)
        .then(() => res.json({}))
        .catch(err => next(err));
}

function _delete(req, res, next) {
    campaignService.delete(req.params.id, req.user.sub)
        .then(() => res.sendStatus(204).json({}))
        .catch(err => next(err));
}