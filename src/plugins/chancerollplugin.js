'use strict'

import { DiceBoardPlugin } from "./diceboardplugin";
import { Passage } from "../core/passage";
import { BBScannerPlugin } from "../core/plugin";

import '../core/types'

const chanceRegEx = /(?:[Rr]oll|[Tt]hrow) (\S*?) di(?:c?)e[\.:](.*?)(?:\n|$)/
const actionRegEx = /If you (?:roll |score )(?:an? )?(\d{1,2})( or(?: an?)? | to |)(\d{0,2})[,:]([^\.\n]*?)(?: [Tt]urn to (\d{1,3}))?\./g

export class ChanceRollPlugin extends BBScannerPlugin {
    /** @type {DiceBoardPlugin} */
    #diceboard
    /** @type {ChanceRoll} */
    #chanceroll

    constructor() {
        super('chancerollplugin')
    }

    /**
     * 
     * @param {PlayerProxy} player 
     */
    init(player) {
        super.init(player)

        this.#diceboard = /** @type {DiceBoardPlugin} */ (player.getPlugin('diceboard'))
        if (!this.#diceboard) {
            throw new Error('Chance Roll plugin requires the Dice Board plugin. Please add it first')
        }

        this.#diceboard.addEventListener('roll', (e) => {
            if (!this.active) {
                return
            }

            const evt = /** @type {CustomEvent<DiceRollEventDetail>} */ (e);
            this.setCurrentState(evt.detail)

            const rollResult = evt.detail.total

            const chanceroll = this.#chanceroll
            if (!chanceroll || !chanceroll.numDice) {
                return
            }

            const view = this.player.view

            view.hideSelectedContent('p.cr-result')

            /** @type {HTMLElement} */
            let rowToShow
            for (let i = 0; i < chanceroll.actions.length; i++) {
                const action = chanceroll.actions[i]
                if (rollInRange(action, rollResult)) {
                    console.log(`Going to show ${JSON.stringify(action)}`)
                    rowToShow = view.content.querySelector(`p.chanceroll-result-${i}`)
                    break;
                }
            }

            if (rowToShow) {
                view.show(rowToShow)
            }
        })

        this.player.addTransformer((input) => {
            if (!this.active) {
                return input
            }

            const chanceroll = this.#chanceroll

            if (!chanceroll || !chanceroll.numDice) {
                return input
            }

            const diceString = chanceroll.numDice == '1' || chanceroll.numDice === 'one'
                ? `one die`
                : `${chanceroll.numDice} dice`

            const currentState = this.getCurrentState()
            const introStatement = currentState && currentState.total
                ? `You had rolled ${diceString} for a result of ${currentState.total}`
                : `Roll ${diceString}`

            let result = `<div class="chancerollarea">${introStatement}.`
            if (chanceroll.restOfParagraph !== '') {
                result = result + ` <span>${chanceroll.restOfParagraph}</span>\n`
            }
            result = result + '</div>'

            for (let i = 0; i < chanceroll.actions.length; i++) {
                const action = chanceroll.actions[i]
                const ishidden = currentState && currentState.total
                    ? rollInRange(action, currentState.total)
                        ? ''
                        : 'hidden'
                    : 'hidden'

                result = result + `<p class="cr-result chanceroll-result-${i} ${ishidden}">${action.sentence}`
                if (action.destination) {
                    result = result.trimEnd() + ` [[Go to ${action.destination}|${action.destination}]]`
                }
                result = result.trimEnd() + '.</p>'
            }

            return input.replace(chanceRegEx, result)
        }
        )
    }

    /**
     * 
     * @param {Passage} passage 
     * @returns {Boolean}
     */
    scan(passage) {
        const passageBody = passage.body

        const match = passageBody.match(chanceRegEx)

        if (!match) {
            this.#diceboard.hide('chanceroll')
            return false
        }

        const numdice = match[1].trim().toLowerCase()
        if (!this.#diceboard.validateDice(numdice)) {
            this.#diceboard.hide('chanceroll')
            return false
        }

        /** @type {ChanceRoll} */
        const chanceroll = {
            numDice: numdice,
            actions: [],
            restOfParagraph: ''
        }

        let restOfParagraph = match[2]

        let destMatch
        while ((destMatch = actionRegEx.exec(match[2])) !== null) {
            const chanceAction = {
                rangeStart: parseInt(destMatch[1]),
                rangeEnd: parseInt(destMatch[3]),
                rangeOperator: destMatch[2].trim().substring(0, 2).toLowerCase(),
                sentence: destMatch[4],
                destination: destMatch[5]
            }
            chanceroll.actions.push(chanceAction)
            restOfParagraph = restOfParagraph.replace(destMatch[0], '')
        }

        restOfParagraph = restOfParagraph.trim()
        if (restOfParagraph !== '') {
            chanceroll.restOfParagraph = restOfParagraph
        }

        console.dir(chanceroll)
        this.#chanceroll = chanceroll

        this.#diceboard.setDice(numdice)
        this.#diceboard.show('chanceroll')

        const currentState = this.getCurrentState()
        if (currentState && Array.isArray(currentState.rolls)) {
            this.#diceboard.setResults(currentState.rolls)
        }

        return true
    }
}

const rollInRange =
    /**
     *  @param {ChanceAction} action
     *  @param {Number} rollResult
     *  @returns {boolean}
     */
    (action, rollResult) => {
        if (action.rangeOperator == 'or') {
            return (rollResult == action.rangeStart || rollResult == action.rangeEnd)
        }

        return (!action.rangeEnd && rollResult == action.rangeStart)
            || (rollResult >= action.rangeStart && rollResult <= action.rangeEnd)
            || (rollResult == action.rangeStart || rollResult == action.rangeEnd)
    }