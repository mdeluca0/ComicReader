function replaceEscapedCharacters(s) {
    s = s.toString();

    s = s.replace(/&47;/g, '/');
    s = s.replace(/&92;/g, '\\');
    s = s.replace(/&58;/g, ':');
    s = s.replace(/&42;/g, '*');
    s = s.replace(/&63;/g, '?');
    s = s.replace(/&34;/g, '"');
    s = s.replace(/&60;/g, '<');
    s = s.replace(/&lt;/g, '<');
    s = s.replace(/&62;/g, '>');
    s = s.replace(/&gt;/g, '>');
    s = s.replace(/&124;/g, '|');

    return s;
}

function removeHtmlTags(html) {
    //return html.replace(/<(?:.|\\n)*?>/g, ''); //this is all tags
    return html.replace(/<\/?(?!p)\w*\b[^>]*>/g, ''); //all but <p> tags
}

function removeLeadingZeroes(s) {
    s = s.toString();
    s = s.replace(/^0+/g, '');
    return !s.length ? '0' : s;
}

function dissectFileName(s) {
    let issueNumber = '';
    let ext = '';

    let split = s;

    if (split.indexOf('.') !== -1) {
        split = split.split('.');
        ext = split.pop().trim();
        split = split.join('.');
    }

    if (split.indexOf('-') !== -1) {
        split = split.split('-');
        issueNumber = split.pop().trim();
        split = split.join('-');
    }

    let name = split.trim();

    return {
        name: name,
        issueNumber: issueNumber,
        ext: ext
    };
}

module.exports.replaceEscapedCharacters = replaceEscapedCharacters;
module.exports.removeHtmlTags = removeHtmlTags;
module.exports.removeLeadingZeroes = removeLeadingZeroes;
module.exports.dissectFileName = dissectFileName;