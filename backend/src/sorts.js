function sortIssueNumber(a, b) {
    if (a.issue_number) {
        a = a.issue_number;
    }
    if (b.issue_number) {
        b = b.issue_number;
    }

    let aN = parseFloat(a.replace(/[^0-9.]/g, ''));
    let bN = parseFloat(b.replace(/[^0-9.]/g, ''));
    if (aN === bN) {
        let aA = a.replace(/[^a-zA-Z]/g, '');
        let bA = b.replace(/[^a-zA-Z]/g, '');
        return aA === bA ? 0 : aA > bA ? 1 : -1;
    } else {
        return aN > bN ? 1 : -1;
    }
}

module.exports.sortIssueNumber = sortIssueNumber;
