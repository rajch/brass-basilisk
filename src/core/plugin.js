'use strict'

import { Passage } from "./passage"
import './types'

export class BBPlugin extends EventTarget {
    /** @type {string} */
    #name
    /** @type {PlayerProxy} */
    #player

    constructor(pluginname) {
        super()

        this.#name = pluginname
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

    /**
     * Will return true if the plugin found something relevant 
     * to it in the passage body, false otherwise.
     * 
     * @returns {boolean}
     */
    get active () {
        return this.#active
    }

    /**
     * Needs to be overridden in plugins. It should scan the
     * passage body and perform any UI setup if needed. Then
     * it should return true, to indicate that the plugin is
     * active. 
     * 
     * If it finds nothing relevant it should reverse any UI
     * changes, and return false.
     * 
     * @param {Passage} passage 
     * @returns {boolean}
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