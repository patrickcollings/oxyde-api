const express = require('express');
const router = express.Router();
const campaignService = require('./campaign.service');

const AWS = require('aws-sdk');
const mime = require('mime');

const awsSecretKey = '9oDWCbZ9v9YgtHxbR8fmatRcaLqaIhNg41yBNIcX';
const awsAccessID = 'AKIAI2LZ7SFSRTAJSCGQ';

//configuring the AWS environment
AWS.config.update({
    accessKeyId: awsAccessID,
    secretAccessKey: awsSecretKey
});

var s3 = new AWS.S3();

// routes
router.post('/', create);
router.get('/:id', getById);
router.put('/:id', update);
router.put('/end/:id', endCampaign);
router.get('/report/:id', getReport);
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

function getReport(req, res, next) {
    campaignService.getCampaignReport(res, req.params.id, req.user.sub)
        .then(params => {
            s3.headObject(params, function (err, data) {
                console.log(params);
                if (err) {
                    // an error occurred
                    console.error(err);
                    // throw err;
                }
                var stream = s3.getObject(params).createReadStream();
        
                // forward errors
                stream.on('error', function error(err) {
                    //continue to the next middlewares
                    console.log(err);
                });
        
                //Add the content type to the response (it's not propagated from the S3 SDK)
                res.set('Content-Type', mime.getType(params.Key));
                res.set('Content-Length', data.ContentLength);
                res.set('Last-Modified', data.LastModified);
                res.set('ETag', data.ETag);
        
                stream.on('end', () => {
                    console.log('Served by Amazon S3');
                });
                //Pipe the s3 object to the response
                stream.pipe(res);
            });
        })
        .catch(err => next(err));
}

function update(req, res, next) {
    campaignService.update(req.params.id, req.body, req.user.sub)
        .then(() => res.json({}))
        .catch(err => next(err));
}

function endCampaign(req, res, next) {
    campaignService.endCampaignById(req.params.id)
        .then(result => (result) ? res.json(result) : res.sendStatus(404))
        .catch(err => next(err));
}

function _delete(req, res, next) {
    campaignService.delete(req.params.id, req.user.sub)
        .then(() => res.sendStatus(204).json({}))
        .catch(err => next(err));
}