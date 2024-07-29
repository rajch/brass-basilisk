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
        const body = passageElement.innerHTML

        return new Passage(pid, name, body)
    }
}


export default Passage
