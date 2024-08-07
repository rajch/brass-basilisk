'use strict'

import { DiceBoardPlugin } from "./diceboardplugin";
import { Passage } from "./passage";
import { BBScannerPlugin } from "./plugin";

import './types'

export class ChanceRollPlugin extends BBScannerPlugin {
    /** @type {DiceBoardPlugin} */
    #diceboard

    constructor() {
        super('chancerollplugin')
    }

    /**
     * 
     * @param {PlayerProxy}} player 
     */
    init (player) {
        super.init(player)

        this.#diceboard = player.getPlugin('diceboard')
        if (!this.#diceboard) {
            throw new Error('Chance Roll plugin requires the Dice Board plugin. Please add it first')
        }

        this.#diceboard.addEventListener('roll', (e) => {
            if (this.active) {
                this.setCurrentState(e.detail)
            }
        })
    }

    /**
     * 
     * @param {Passage} passage 
     * @returns {Boolean}
     */
    scan (passage) {
        const passageBody = passage.body

        const phrase1 = /[Rr]oll\s{1}(\S*?)\s{1}di(c{0,1})e\./
        let match = passageBody.match(phrase1)

        if (!match) {
            const phrase2 = /[Tt]hrow\s{1}(\S*?)\s{1}di(c{0,1})e\./
            match = passageBody.match(phrase2)
        }

        if (!match) {
            this.#diceboard.hide('chanceroll')
            return false
        }

        const numdice = match[1].trim().toLowerCase()
        this.#diceboard.setDice(numdice)

        this.#diceboard.show('chanceroll')

        const currentState = this.getCurrentState()
        if (currentState && Array.isArray(currentState.rolls)) {
            this.#diceboard.setResults(currentState.rolls)
        }

        return true
    }
}
