this.editorExtensions = {
    twine: {
        '^2.9.0': {
            'references': {
                parsePassageText (text) {
                    const turnToRegex = /(?:[^\d\w]|^)[Tt]urn to (\d{1,3})(?:[^\d\w]|$)/g
                    return Array.from(text.matchAll(turnToRegex), (match) => match[1])
                            .filter(
                                (value, index, array) => array.indexOf(value) === index
                            )
                }
            }
        }
    }
}