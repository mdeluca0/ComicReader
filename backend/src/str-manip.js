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
    return s.replace(/[0]+(?=[^0])/g, '');
}

module.exports.replaceEscapedCharacters = replaceEscapedCharacters;
module.exports.removeHtmlTags = removeHtmlTags;
module.exports.removeLeadingZeroes = removeLeadingZeroes;