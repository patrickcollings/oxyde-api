const express = require('express');
const router = express.Router();
const emailService = require('./email.service');

// routes
router.post('/send', send);
router.get('/templates', templates);
router.post('/caught', caught);

module.exports = router;

function send(req, res, next) {
    emailService.send(req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}

function templates(req, res, next) {
    emailService.getTemplates(req.body)
        .then(templates => templates ? res.json({templates}) : res.sendStatus(400))
        .catch(err => next(err));
}

function caught(req, res, next) {
    emailService.caught(req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}