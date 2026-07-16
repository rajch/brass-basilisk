'use strict'

/**
 * @implements {IPassage}
 */
export class Passage {
    /** @type {string} */
    #pid
    /** @type {string} */
    #name
    /** @type {string} */
    #body

    /**
     * 
     * @param {string} id 
     * @param {string} name 
     * @param {string} body 
     */
    constructor(id, name, body) {
        this.#pid = id
        this.#name = name
        this.#body = body
    }

    /**
     * @returns {string}
     */
    get pid() {
        return this.#pid
    }

    /**
     * @returns {string}
     */
    get name() {
        return this.#name
    }

    /**
     * @returns {string}
     */
    get body() {
        return this.#body
    }
}
