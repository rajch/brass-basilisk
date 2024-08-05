'use strict'

class Passage {
    constructor(id, name, body) {
        this.pid = id
        this.name = name
        this.body = body
    }

    static FromElement (passageElement) {
        const pid = passageElement.getAttribute('pid')
        const name = passageElement.getAttribute('name')
        let body = passageElement.innerHTML

        /* Ours is a text and paragraph based DSL.
         *  The body should end in a paragraph break.
        */
        if (!body.endsWith('\n')) {
            body = body + '\n'
        }

        return new Passage(pid, name, body)
    }
}


export default Passage
