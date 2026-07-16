'use strict'

import { Passage } from "./core/passage"

/**
 * @implements {IStory}
 */
export class DefaultStory {
    /** @type {HTMLElement} */
    #storyelement
    /** @type {string} */
    #storyname
    /** @type {string} */
    #startnodepid
    /** @type {string} */
    #ifid

    constructor() {
        /** @type {HTMLElement}  */
        const storyelement = document.querySelector('tw-storydata')
        if (!storyelement) {
            throw new Error('could not find story')
        }

        this.#storyelement = storyelement
        this.#storyname = storyelement.getAttribute('name')
        this.#startnodepid = storyelement.getAttribute('startnode')
        // Twine always writes this onto a published story: a GUID
        // generated once when the story is created, and stable across
        // renames and re-exports (unlike name). Not present on
        // hand-rolled tw-storydata such as our own test fixtures.
        this.#ifid = storyelement.getAttribute('ifid') || undefined
    }

    /**
     * @type {string}
     */
    get name() {
        return this.#storyname
    }

    /**
     * @type {string|undefined}
     */
    get ifid() {
        return this.#ifid
    }

    /**
     * 
     * @param {string} name 
     * @returns {Passage|null}
     */
    getPassageByName(name) {
        /** @type {HTMLElement} */
        const passageElement = this.#storyelement?.querySelector(`tw-passagedata[name="${name}"]`)
        if (!passageElement) {
            return
        }

        return fromElement(passageElement)
    }

    /**
     * 
     * @returns {IPassage|null}
     */
    getStartPassage() {
        /** @type {HTMLElement} */
        const passageElement = this.#storyelement?.querySelector(`tw-passagedata[pid="${this.#startnodepid}"]`)
        if (!passageElement) {
            return null
        }

        return fromElement(passageElement)
    }

}

/**
 * 
 * @param {HTMLElement|null} passageElement 
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
