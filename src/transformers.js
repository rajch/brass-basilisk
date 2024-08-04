'use strict'

// Passage body text to HTML transformation
export const processHTML = (input) => {
    // The following will decode HTML-encoded content
    const element = document.createElement('div');
    element.innerHTML = input;
    // TODO: strip unwated tags here
    return element.textContent;
}

// Convert text in all known Twine link formats to hyperlinks
export const processTwineLinks = (input) => {
    return input
        .replaceAll(/\[\[(.*?)-(>|&gt;)(.*?)\]\]/g, '<a class="link" data-destination="$3">$1</a>')
        .replaceAll(/\[\[(.*?)(<|&lt;)-(.*?)\]\]/g, '<a class="link" data-destination="$1">$3</a>')
        .replaceAll(/\[\[(.*?)\|(.*?)\]\]/g, '<a class="stronglink" data-destination="$2">$1</a>')
        .replaceAll(/\[\[(.*?)\]\]/g, '<a class="link" data-destination="$1">$1</a>')
}

// Convert all line breaks in the input text to HTML paragraphs
export const addParagraphTags = (input) => {
    return input
        .split(/\r?\n|\r|\n/g)
        .map((row) => `<p>${row}</p>`)
        .join('');
}