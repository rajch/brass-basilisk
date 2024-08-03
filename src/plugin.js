'use strict'

import Passage from "./passage"

/**
 * @typedef {Object} PlayerProxy
 * @property {Function} addScanner
 * @property {Function} addTransformer
 * @property {Function} addPlugin
 * @property {Function} getPlugin
 * @property {Function} setCurrentState
 * @property {Function} getCurrentState
 * @property {Function} setGlobalState
 * @property {Function} getGlobalState
 * @property {Function} preventNavigation
 * @property {Function} allowNavigation
 */

/**
 * @typedef {Object} PluginProxy
 * @property {string} name Plugin Name
 * @property {Function} getCurrentState
 * @property {Function} setCurrentState
 * @property {Function} player
 */


export class BBPlugin extends EventTarget {
    /** @type {string} */
    #name
    /** @type {PlayerProxy} */
    #player

    constructor(pluginname) {
        super()

        this.#name = pluginname
    }

    postMessage (message) {

    }

    /**
     * @returns {PlayerProxy}
     */
    get player () {
        return this.#player
    }

    /**
     * @returns {string}
     */
    get name () {
        return this.#name
    }

    /**
     * 
     * @param {PlayerProxy} player 
     */
    init (player) {
        this.#player = player
    }

}


export class BBScannerPlugin extends BBPlugin {
    /** @type {Boolean} */
    #active = false
    /** @type {Passage} */
    #currentpassage
    /** @type {Function} */
    #setcurrentstate
    /** @type {Function} */
    #getcurrentstate
    /** @type {Function} */

    /**
     * 
     * @param {string} pluginname A unique name for the plugin
     */
    constructor(pluginname) {
        super(pluginname)

    }

    /**
     * 
     * @param {PlayerProxy} player The player proxy.
     */
    init (player) {
        super.init(player)

        /** @type {Passage} */
        let currentPassage

        const self = this

        this.#setcurrentstate = (state) => {
            player.setCurrentState(
                `${self.#currentpassage.name}-${self.name}`,
                state
            )
        }

        this.#getcurrentstate = () => {
            return player.getCurrentState(
                `${self.#currentpassage.name}-${self.name}`
            ) ?? player.getGlobalState(`${self.name}`)
        }

        function realscan (passage) {
            self.#currentpassage = passage

            self.#active = Boolean(self.scan(passage))
        }

        player.addScanner(realscan)
    }

    currentPassage () {
        return this.#currentpassage
    }

    setCurrentState (value) {
        this.#setcurrentstate(value)
    }

    getCurrentState () {
        return this.#getcurrentstate()
    }

    get active () {
        return this.#active
    }

    /**
     * 
     * @param {Passage} passage 
     */
    scan (passage) {
        throw new Error('the scan method must be overridden. Return true to mark the plugin as active')
    }
}

export class BBGlobalStatePlugin extends BBScannerPlugin {
    /** @type {Function} */
    #getstate
    /** @type {Function} */
    #setstate
    /** @type {Function} */
    #setglobalstate


    constructor(pluginname) {
        super(pluginname)
    }

    init (player) {
        super.init(player)

        this.#getstate = () => {
            return player.getCurrentState(
                `${this.name}`
            ) ?? player.getGlobalState(`${this.name}`)
        }

        this.#setstate = (state) => {
            player.setCurrentState(
                `${this.name}`,
                state
            )
        }

        this.#setglobalstate = (state) => {
            player.setGlobalState(
                `${this.name}`,
                state
            )
        }
    }

    getCurrentState () {
        return this.#getstate()
    }

    setCurrentState (value) {
        this.#setstate(value)
    }

    setGlobalState (state) {
        this.#setglobalstate(state)
    }
}