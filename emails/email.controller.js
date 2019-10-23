const express = require('express');
const router = express.Router();
const emailService = require('./email.service');

// routes
router.post('/send', send);
router.post('/sendtest', sendTest);
router.get('/templates', templates);
router.get('/template/:id', template);
router.post('/caught', caught);
router.post('/contact', contact);

module.exports = router;

function send(req, res, next) {
    emailService.send(req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}

function sendTest(req, res, next) {
    emailService.sendTest(req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}

function contact(req, res, next) {
    emailService.sendContactEmail(req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}

function templates(req, res, next) {
    emailService.getTemplates(req.body)
        .then(templates => templates ? res.json({templates}) : res.sendStatus(400))
        .catch(err => next(err));
}

function template(req, res, next) {
    emailService.getTemplate(req.params.id)
        .then(template => template ? res.json({template}) : res.sendStatus(400))
        .catch(err => next(err));
}

function caught(req, res, next) {
    emailService.caught(req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}