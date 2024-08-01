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
            )
        }

        //const scanMethod = this.scan

        function realscan (passage) {
            self.#currentpassage = passage

            // const pluginProxy = {
            //     name: pluginname,
            //     setCurrentState,
            //     getCurrentState,
            //     player: () => player
            // }

            self.#active =  Boolean(self.scan(passage))
            // scanMethod.call(pluginProxy, passage)
        }

        player.addScanner(realscan)
    }

    currentPassage() {
        return this.#currentpassage
    }

    setCurrentState(value) {
        this.#setcurrentstate(value)
    }

    getCurrentState() {
        return this.#getcurrentstate()
    }

    get active() {
        return this.#active
    }

    /**
     * 
     * @param {Passage} passage 
     */
    scan (passage) {
        throw new Error('the scan method must be overridden. Return true or false')       
    }
}