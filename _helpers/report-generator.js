const PDFDocument = require('pdfkit');
const db = require('./db');
const Campaign = db.Campaign;

const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

const emailService = require('../emails/email.service');

const bucket = process.env.NODE_ENV === 'production' ? 'oxyde' : 'development';

module.exports = {
    generateReport,
    generateStatistics
}

async function generateReport(campaign, email) {
    // Create a document
    const doc = new PDFDocument();
    // const writeStream = fs.createWriteStream('report.pdf');
    // doc.pipe(writeStream);

    const reportStatistics = await generateStatistics(campaign);

    // Pipe its output somewhere, like to a file or HTTP response
    // See below for browser usage
    // Embed a font, set the font size, and render some text
    doc.text('Number of employees that entered their credentials on our phishing page: ' + reportStatistics.totalEmployeesCaught, 100, 100);
    doc.text('That is %' + reportStatistics.percentageCaught + ' of your team.');
    doc.text('Number of times the phishing link was opened: ' + reportStatistics.totalLinks);
    doc.text('%' + reportStatistics.percentageLinks + ' of your team opened the link atleast once.');

    // For each employee
    campaign.employees.forEach(employee => {
        doc.text(employee.id.firstName + ' ' + employee.id.lastName + ': ' + employee.id.email + ' - caught: ' + employee.caught);
    });

    // Finalize PDF file

    let buffers = [];
    doc.on('data', buffers.push.bind(buffers));


    let end = new Promise((resolve, reject) => {
        doc.on('end', () => {
            console.log('Concat buffers');
            let pdfData = Buffer.concat(buffers);
            resolve(pdfData);
        });
    });

    doc.end();

    let finalDoc = await end;

    console.log('Finished creating pdf');
    // call the callback function or in my case resolve the Promise.
    const name = "report/" + Date.now() + "_" + campaign.name + ".pdf";

    // Save PDF location to campaign
    campaign.report.file_URL = name;
    await campaign.save();

    // Save pdf to amazon s3 and add meta data to DB
    await savePDF(finalDoc, name);

    return finalDoc;
}

async function generateStatistics(campaign) {
    // Generate campaign statistics
    // Get total links opened
    let totalLinks = 0;
    let totalEmployeesOpenedLinks = 0;
    let totalEmployeesCaught = 0;
    campaign.employees.forEach(employee => {
        if (employee.caught) {
            totalEmployeesCaught += 1;
        }
        totalLinks += employee.linkOpened;
        if (employee.linkOpened > 0) {
            totalEmployeesOpenedLinks += 1;
        }
    });
    // Get percentages
    let percentageLinks = 0;
    let percentageCaught = 0;
    let noEmployees = campaign.employees.length;
    if (noEmployees > 0) {
        percentageLinks = totalEmployeesOpenedLinks / noEmployees * 100;
        percentageCaught = totalEmployeesCaught / noEmployees * 100;
    }
    // Update campaign object
    campaign.report.totalOpenedLinks = totalLinks;
    campaign.report.totalEmployeesOpenedLinks = totalEmployeesOpenedLinks;
    campaign.report.totalEmployeesCaught = totalEmployeesCaught;
    campaign.report.percentageLinksOpened = percentageLinks;
    campaign.report.percentageCaught = percentageCaught;
    campaign.report.percentageCaught = percentageCaught;

    campaign.report.percentageNoEngagement = 100 - percentageLinks;

    campaign.report.updated = new Date();

    await campaign.save();

    return {
        totalLinks,
        totalEmployeesOpenedLinks,
        totalEmployeesCaught,
        percentageLinks,
        percentageCaught,
        noEmployees
    };
}

async function savePDF(pdf, name) {
    const awsSecretKey = '9oDWCbZ9v9YgtHxbR8fmatRcaLqaIhNg41yBNIcX';
    const awsAccessID = 'AKIAI2LZ7SFSRTAJSCGQ';

    //configuring the AWS environment
    AWS.config.update({
        accessKeyId: awsAccessID,
        secretAccessKey: awsSecretKey
    });

    var s3 = new AWS.S3();

    //configuring parameters
    var params = {
        Bucket: 'oxyde',
        Body: pdf,
        Key: name
    };

    await s3.upload(params, (err, data) => {
        //handle error
        if (err) {
            console.log("Error", err);
        }

        //success
        if (data) {
            console.log("Uploaded in:", data.Location);
        }
    });
}