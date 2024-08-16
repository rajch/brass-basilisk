'use strict'

import { Passage } from "./core/passage"

export class DefaultStory {
    /** @type {HTMLElement} */
    #storyelement
    /** @type {string} */
    #storyname
    /** @type {string} */
    #startnodepid

    constructor() {
        const storyelement = document.querySelector('tw-storydata')
        if (!storyelement) {
            throw new Error('could not find story')
        }

        this.#storyelement  = storyelement
        this.#storyname = storyelement.getAttribute('name')
        this.#startnodepid = storyelement.getAttribute('startnode')
    }

    get name () {
        return this.#storyname
    }

    /**
     * 
     * @param {string} name 
     * @returns {Passage|null}
     */
    getPassageByName (name) {
        const passageElement = this.#storyelement?.querySelector(`tw-passagedata[name="${name}"]`)
        if (!passageElement) {
            return
        }

        return fromElement(passageElement)
    }

    /**
     * 
     * @returns {Passage|null}
     */
    getStartPassage () {
        const passageElement = this.#storyelement?.querySelector(`tw-passagedata[pid="${this.#startnodepid}"]`)
        if (!passageElement) {
            return
        }

        return fromElement(passageElement)
    }

}

/**
 * 
 * @param {HTMLElement} passageElement 
 * @returns {Passage}
 */
const fromElement = (passageElement) => {
    const pid = passageElement.getAttribute('pid')
    const name = passageElement.getAttribute('name')
    let body = passageElement.innerHTML

    // Ours is a text and paragraph based DSL.
    // The body should end in a paragraph break.
    if (!body.endsWith('\n')) {
        body = body + '\n'
    }

    return new Passage(pid, name, body)
}
