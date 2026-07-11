'use strict'

import { CharacterSheetPlugin } from './charactersheetplugin'
import { Passage } from '../core/passage'
import { BBScannerPlugin } from '../core/plugin'

import '../core/types'

// This matches a sentence by itself in a paragraph.
const deadPhraseRegex = /\nYou are dead.\n/g
// This matches a sentence that ends a paragraph.
//const phraseRegex = /Your (VIGOUR|AGILITY|PSI) ((?:is restored)|(?:increases by)|(?:decreases by)|(?:reduces by))( \d{1,2})?\.\n/g
const phraseRegex = /Your (VIGOUR|AGILITY|PSI) (?:(is restored)\.|(increases by|decreases by|reduces by) (\d{1,2})\.)\n/g

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
    init(player) {
        super.init(player)

        this.#charactersheet = player.getPlugin('charactersheet')
        if (!this.#charactersheet) {
            throw new Error('Attribute Phrase plugin requires Character Sheet plugin')
        }

        this.player.addTransformer(
            /**
             * @param {string} input 
             */
            (input) => {
                if (!this.active) {
                    return input
                }

                let result = input
                if (result.match(deadPhraseRegex)) {
                    result = result.replace(deadPhraseRegex, `<p><span class="attrphrase dead">You are dead.<span></p>`)
                }

                const phraseMatch = result.match(phraseRegex)
                if (phraseMatch) {
                    // result = result.replace(
                    //     phraseRegex,
                    //     `<span class="attrphrase">Your $1 $2 $3.</span>`
                    // ).replace(/(\w)\s+\./g, '$1.')
                    result = result.replace(phraseRegex, (match, attr, restored, verb, amount) =>
                        `<span class="attrphrase">Your ${attr} ${restored || `${verb} ${amount}`}.</span>`
                    )
                }

                return result
            }
        )
    }

    /**
     * 
     * @param {Passage} passage 
     */
    scan(passage) {
        const currentState = this.getCurrentState()
        if (currentState && currentState.acted) {
            return true
        }

        const passageBody = passage.body
        let result = false

        // First check for death. All else is secondary.
        // If death happens, nothing else needs to be
        // done.
        if (passageBody.match(deadPhraseRegex)) {
            this.#charactersheet.psi = 0
            this.#charactersheet.agility = 0
            this.#charactersheet.vigour = 0

            this.setCurrentState({ acted: true })
            return true
        }

        let phraseMatch
        while ((phraseMatch = phraseRegex.exec(passageBody)) !== null) {
            const attribute = phraseMatch[1].toLowerCase()
            // const action = phraseMatch[2].toLowerCase()
            const action = (phraseMatch[2] || phraseMatch[3]).toLowerCase()
            // const amount = action === 'is restored'
            //     ? 1000 // a high amount restores the attribute
            //     : phraseMatch[3]
            //         ? parseInt(phraseMatch[3].trimStart()) * (action === 'decreases by' || action === 'reduces by' ? -1 : 1)
            //         : 0
            const amount = action === 'is restored'
                ? 1000
                : parseInt(phraseMatch[4]) * (action === 'decreases by' || action === 'reduces by' ? -1 : 1)

            this.#charactersheet[attribute] += amount

            result = true
        }

        if (result) {
            this.setCurrentState({ acted: true })
        }

        return result
    }
}