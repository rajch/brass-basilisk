'use strict'

import { CharacterSheetPlugin } from './charactersheetplugin'
import { Passage } from './passage'
import { BBScannerPlugin } from './plugin'

import './types'

// This matches a sentence that ends a paragraph.
const phraseRegex = /Your (VIGOUR|AGILITY|PSI) ((?:is restored)|(?:increases by)|(?:decreases by))( \d{1,2})?\.\n/g

export class AttributePhrasePlugin extends BBScannerPlugin {
    /** @type {CharacterSheetPlugin} */
    #charactersheet

    constructor() {
        super('actionphrase')
    }

    /**
     * 
     * @param {PlayerProxy} player 
     */
    init (player) {
        super.init(player)

        this.#charactersheet = player.getPlugin('charactersheet')
        if (!this.#charactersheet) {
            throw new Error('Attribute Phrase plugin requires Character Sheet plugin')
        }
    }

    /**
     * 
     * @param {Passage} passage 
     */
    scan (passage) {
        const currentState = this.getCurrentState()
        if (currentState && currentState.acted) {
            return true
        }

        const passageBody = passage.body
        let result = false

        let phraseMatch
        while ((phraseMatch = phraseRegex.exec(passageBody)) !== null) {
            const attribute = phraseMatch[1].toLowerCase()
            const action = phraseMatch[2].toLowerCase()
            const amount = action === 'is restored'
                ? 1000 // a high amount restores the attribute
                : phraseMatch[3]
                    ? parseInt(phraseMatch[3].trimStart()) * (action === 'decreases by' ? -1 : 1)
                    : 0

            this.#charactersheet[attribute] += amount

            result = true
        }

        if (result) {
            this.setCurrentState({ acted: true })
        }

        // for (let i = 0; i < this.#phraseActions.length; i++) {
        //     const phraseAction = this.#phraseActions[i]
        //     const rexp = new RegExp(phraseAction.phraseRegExp)
        //     const rexMatches = passageBody.match(rexp)
        //     if (rexMatches) {
        //         result = result || phraseAction.action(rexMatches)
        //     }
        // }

        return result
    }
}