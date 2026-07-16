'use strict'

import { Passage } from "./passage"
import './types'

/**
 * @implements {BBPlugin}
 */
export class BBPlugin extends EventTarget {
    /** @type {string} */
    #name
    /** @type {PlayerProxy|undefined} */
    #player

    /**
     * 
     * @param {string} pluginname 
     */
    constructor(pluginname) {
        super()

        this.#name = pluginname
    }

    /**
     * @returns {PlayerProxy|undefined}
     */
    get player() {
        return this.#player
    }

    /**
     * @returns {string}
     */
    get name() {
        return this.#name
    }

    /**
     * 
     * @param {PlayerProxy} player 
     */
    init(player) {
        this.#player = player
    }

}


export class BBScannerPlugin extends BBPlugin {
    /** @type {Boolean} */
    #active = false
    /** @type {IPassage} */
    #currentpassage
    /** @type {(state: any) => void} */
    #setcurrentstate
    /** @type {() => any} */
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
    init(player) {
        super.init(player)

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

        const realscan =
            /**
             * 
             * @param {IPassage} passage
             * @returns {void}
             */
            (passage) => {
                self.#currentpassage = passage

                self.#active = self.scan(passage)
            }

        player.addScanner(realscan)
    }

    /**
     * Returns the current passage, which is set during scanning.
     * @returns {IPassage}
     */
    currentPassage() {
        return this.#currentpassage
    }

    /**
     * Saves any value or object as the current state. This state is 
     * stored with reference to the current passage, and will be
     * carried forward as the player navigates to new passages. A new
     * state will replace, but not overwrite, an old state.
     * 
     * @param {any} value 
     * @returns {void}
     */
    setCurrentState(value) {
        this.#setcurrentstate(value)
    }

    /**
     * Retrieves the current state from the top of the navigation stack.
     * If there is no current state in that stack, will try to retrieve 
     * the state from the global state automatically.
     * 
     * @returns {any}
     */
    getCurrentState() {
        return this.#getcurrentstate()
    }

    /**
     * Returns true if the plugin found something relevant 
     * to it in the passage body, false otherwise.
     * 
     * @returns {boolean}
     */
    get active() {
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
     * @param {IPassage} passage 
     * @returns {boolean}
     */
    scan(passage) {
        throw new Error('the scan method must be overridden. Return true to mark the plugin as active')
    }
}

export class BBGlobalStatePlugin extends BBScannerPlugin {
    /** @type {() => any} */
    #getstate
    /** @type {(state: any) => void} */
    #setstate
    /** @type {(state: any) => void} */
    #setglobalstate

    /**
     * 
     * @param {string} pluginname 
     */
    constructor(pluginname) {
        super(pluginname)
    }

    /**
     * 
     * @param {PlayerProxy} player 
     */
    init(player) {
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

    getCurrentState() {
        return this.#getstate()
    }

    /**
     * 
     * @param {any} value 
     */
    setCurrentState(value) {
        this.#setstate(value)
    }

    /**
     * Saves any value or object as the global state. There is only one
     * global state: any new value overwrites the old value.
     * @param {any} state 
     */
    setGlobalState(state) {
        this.#setglobalstate(state)
    }
}