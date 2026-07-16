'use strict'

import { CharacterSheetPlugin } from "./charactersheetplugin"
import { DiceBoardPlugin } from "./diceboardplugin";
import { Passage } from "../core/passage";
import { BBScannerPlugin } from "../core/plugin";

import '../core/types'

const stackCheckRegex = /(?:Roll|Throw) (1|2|one|two) di(?:c)?e,? and try to (?:roll|score) (equal to or less than|less than or equal to|less than) your(?: current)? (AGILITY|PSI). If you succeed, turn to (\d{1,3}). If you fail, turn to (\d{1,3})./

export class StatCheckRollPlugin extends BBScannerPlugin {
    /** @type {CharacterSheetPlugin} */
    #charactersheet

    /** @type {DiceBoardPlugin} */
    #diceboard

    /** @type {StatCheckRoll} */
    #statcheckroll

    constructor() {
        super('statcheckrollplugin')
    }

    /**
     * 
     * @param {PlayerProxy} player 
     */
    init(player) {
        super.init(player)

        this.#charactersheet = /** @type {CharacterSheetPlugin} */ (player.getPlugin('charactersheet'))
        if (!this.#charactersheet) {
            throw new Error('Stat Check Roll plugin requires Character Sheet plugin. Please add it first')
        }

        this.#diceboard = /** @type {DiceBoardPlugin} */ (player.getPlugin('diceboard'))
        if (!this.#diceboard) {
            throw new Error('Stat Check Roll plugin requires the Dice Board plugin. Please add it first')
        }

        this.#diceboard.addEventListener('roll', (evt) => {
            const e = /** @type {CustomEvent<DiceRollEventDetail>} */ (evt)

            if (!this.active) {
                return
            }

            const statcheckroll = this.#statcheckroll
            if (!statcheckroll || !statcheckroll.numDice || !statcheckroll.operator) {
                return
            }

            this.setCurrentState(e.detail)

            const rollResult = e.detail.total

            const diceString = statcheckroll.numDice == '1' || statcheckroll.numDice === 'one'
                ? `one die`
                : `${statcheckroll.numDice} dice`
            const introStatement = `You rolled ${diceString} for a result of ${rollResult}`
            const succeeded = statcheckroll.operator === '<='
                ? rollResult <= this.#charactersheet[statcheckroll.stat]
                : rollResult < this.#charactersheet[statcheckroll.stat]

            const view = this.player.view
            const introPara = view.content.querySelector('.statcheckarollarea p.intro')
            const successPara = /** @type {HTMLElement} */ (view.content.querySelector('.statcheckarollarea p.success'))
            const failPara = /** @type {HTMLElement} */ (view.content.querySelector('.statcheckarollarea p.fail'))

            introPara.textContent = introStatement
            if (succeeded) {
                view.hide(failPara)
                view.show(successPara)
            } else {
                view.hide(successPara)
                view.show(failPara)
            }
        })

        this.player.addTransformer((input) => {
            if (!this.active) {
                return input
            }

            const statcheckroll = this.#statcheckroll
            if (!statcheckroll || !statcheckroll.numDice) {
                return input
            }

            const diceString = statcheckroll.numDice == '1' || statcheckroll.numDice === 'one'
                ? `one die`
                : `${statcheckroll.numDice} dice`

            const currentState = this.getCurrentState()
            const rollMade = currentState && currentState.total
            const rollResult = rollMade ? parseInt(currentState.total) : 0
            const introStatement = rollMade
                ? `You had rolled ${diceString} for a result of ${rollResult}`
                : `Roll ${diceString}`
            const intro = `${statcheckroll.stat.toUpperCase()} check: ${introStatement}`
            const succeeded = rollMade
                ? statcheckroll.operator === '<='
                    ? rollResult <= this.#charactersheet[statcheckroll.stat]
                    : rollResult < this.#charactersheet[statcheckroll.stat]
                : null
            console.info(currentState, rollMade, rollResult, succeeded)

            let result = `<div class="statcheckarollarea"><p class="intro">${intro}</p>`
            result += `<p class="success ${succeeded === true ? '' : 'hidden'}">[[Go to ${statcheckroll.successGoTo}|${statcheckroll.successGoTo}]].</p>`
            result += `<p class="fail ${succeeded === false ? '' : 'hidden'}">[[Go to ${statcheckroll.failGoTo}|${statcheckroll.failGoTo}]].</p>`

            result += '</div>'

            return input.replace(stackCheckRegex, result)
        }
        )
    }

    /**
     * 
     * @param {Passage} passage 
     * @returns {boolean}
     */
    scan(passage) {
        const passageBody = passage.body

        const match = passageBody.match(stackCheckRegex)

        if (!match) {
            this.#diceboard.hide('statcheckroll')
            return false
        }

        const numdice = match[1].trim().toLowerCase()
        if (!this.#diceboard.validateDice(numdice)) {
            this.#diceboard.hide('statcheckroll')
            return false
        }

        const statcheckroll = {
            numDice: numdice,
            operator: match[2] === 'less than' ? '<' : '<=',
            stat: /** @type {"agility"|"psi"} */ (match[3].toLowerCase()),
            successGoTo: match[4],
            failGoTo: match[5]
        }

        console.dir(statcheckroll)
        this.#statcheckroll = statcheckroll

        this.#diceboard.setDice(numdice)
        this.#diceboard.show('statcheckroll')

        const currentState = this.getCurrentState()
        if (currentState && Array.isArray(currentState.rolls)) {
            this.#diceboard.setResults(currentState.rolls)
        }

        return true
    }
}
