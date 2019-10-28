const PDFDocument = require('pdfkit');
const db = require('./db');
const Campaign = db.Campaign;

module.exports = {
    generateReport
}

async function generateReport(campaign) {
    // Create a document
    const doc = new PDFDocument;

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
    doc.end();

    return doc;
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
    let noEmployees = campaign.employees.length;
    let percentageLinks = totalEmployeesOpenedLinks/noEmployees*100;
    let percentageCaught = totalEmployeesCaught/noEmployees*100;  

    // Update campaign object
    campaign.report.totalOpenedLinks = totalLinks;
    campaign.report.totalEmployeesOpenedLinks = totalEmployeesOpenedLinks;
    campaign.report.totalEmployeesCaught = totalEmployeesCaught;
    campaign.report.percentageLinksOpened = percentageLinks;
    campaign.report.percentageCaught = percentageCaught;

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