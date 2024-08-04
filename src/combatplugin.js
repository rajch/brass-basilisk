'use strict'

import { CharacterSheetPlugin } from "./charactersheetplugin";
import { DiceBoardPlugin } from "./diceboardplugin";
import Passage from "./passage";
import { BBScannerPlugin } from "./plugin";


/**
 * @typedef {Object} CombatRule
 * @property {number} rangeLow
 * @property {number} rangeHigh
 * @property {string} action
 * @property {number} turnAmount
 */

/**
 * @typedef {Object} Combat
 * @property {string} foe
 * @property {number} foeVigour
 * @property {number} numberOfDice
 * @property {CombatRule[]} rules
 * @property {boolean} flee
 * @property {string|null} fleeTo
 */

const combatRegex = /([A-Z\s]+)\s+VIGOUR\s+(\d+)\s*\n+\s*?[Rr]oll\s+(\w+)\s+dice:\n+\s*((?:[Ss]core\s+\d+\s+to\s+\d+[^\n]+\n\s*)+)\n[\s\S]*?(FLEE[\s\S]*?turn to (\d+)[\D]|\n)/
const combatRuleRegex = /score\s+(\d+)\s+to\s+(\d+)\s+(?:[\w;,\-:]+\s)+?(loses?)\s+(\d+)\s+VIGOUR/g

export class CombatPlugin extends BBScannerPlugin {
    /** @type {DiceBoardPlugin} */
    #diceboard
    /** @type {CharacterSheetPlugin} */
    #charactersheet
    #combat
    #won
    #lost
    #element
    #foenamelabel
    #foevigourlabel

    constructor() {
        super('meleecombat')

    }

    /**
     * 
     * @param {import("./plugin").PlayerProxy} player 
     */
    init (player) {
        super.init(player)

        // This should move to renderer interface
        const element = document.querySelector('div.combat')

        this.#foenamelabel = element.querySelector('label.foename')
        this.#foevigourlabel = element.querySelector('label.foevigour')
        this.#element = element

        this.#diceboard = player.getPlugin('diceboard')
        if (!this.#diceboard) {
            throw new Error('Combat plugin requires the Dice Board plugin. Please add it first')
        }

        this.#charactersheet = player.getPlugin('charactersheet')
        if (!this.#charactersheet) {
            throw new Error('Combat plugin requires the Character Sheet plugin. Please add it first')
        }

        const replaceFightArea = (message) => {
            const fightarea = document.querySelector('.content .fightarea')
            fightarea.textContent = message
        }

        const updateFightArea = (message) => {
            const rollstatusarea = document.querySelector('.content .fightarea .rollstatus')
            rollstatusarea.textContent = message
            const foevigourarea = document.querySelector('.content .fightarea .foeVigour')
            foevigourarea.textContent = this.#combat.foeVigour
        }

        this.#diceboard.addEventListener('roll', (e) => {
            if (this.active) {
                const rollscore = e.detail.total
                const combat = this.#combat

                combat.rules.map((rule) => {
                    if (rollscore >= rule.rangeLow &&
                        rollscore <= rule.rangeHigh
                    ) {
                        if (rule.action === 'loses') {
                            combat.foeVigour = combat.foeVigour - rule.turnAmount;
                            this.#foevigourlabel.textContent = combat.foeVigour
                            updateFightArea(`You hit ${combat.foe} for ${rule.turnAmount} points.`)
                            if (combat.foeVigour <= 0) {
                                this.#won = true
                                this.#lost = false
                                this.#foenamelabel.textContent = 'DEFEATED!'
                                replaceFightArea('You won!')
                                this.#diceboard.hide('combat')
                                this.setCurrentState({ defeated: true })
                                this.#charactersheet.vigour = this.#charactersheet.vigour
                                this.player.allowNavigation()
                            }

                        } else {
                            const sheet = this.#charactersheet
                            sheet.vigour = sheet.vigour - rule.turnAmount
                            updateFightArea(`${combat.foe} hit you for ${rule.turnAmount} points.`)
                            if (sheet.vigour <= 0) {
                                this.#lost = true
                                this.#won = false
                                replaceFightArea(`You were killed by ${combat.foe}.`)
                                this.setCurrentState({ playerdefeated: true })
                                this.#diceboard.hide('combat')
                            }
                        }
                    }
                })
            }
        })

        this.player.addTransformer(
            /** @params {String} 
             * @returns {String} 
             */
            (input) => {
                if (!this.active) {
                    return input
                }

                const text = this.#won
                    ? `You defeated ${this.#combat.foe} here.`
                    : this.#lost
                        ? `You were killed by ${this.#combat.foe} in combat.`
                        : formatCombat(this.#combat)
                // : `<div>You face ${this.#combat.foe} in combat.<div>` +
                //     `<div class='rollstatus'></div>` +
                //     (this.#combat.fleeTo
                //         ? `<div>You may <a class="link" data-destination="this.#combat.fleeTo">flee</a>.</div>`
                //         : ''
                //     )
                // : `You face ${this.#combat.foe} in combat.` + 
                //         (this.#combat.fleeTo ? ` You can flee to ${this.#combat.fleeTo}` : '')

                return input.replace(
                    combatRegex,
                    `<div class="fightarea">${text}</div>\n`
                )
            })

    }

    /** @type {Passage} */
    scan (passage) {
        const passageBody = passage.body

        let combat
        const combatMatch = passageBody.match(combatRegex)
        if (combatMatch) {
            // Check if there is old state
            const state = this.getCurrentState()
            if (state?.defeated) {
                // Player had won earlier
                this.#won = true
                this.#lost = false
                this.#element.classList.add('hidden')
                this.player.allowNavigation()
                return true
            } else if (state?.playerdefeated) {
                // Player had lost earlier
                this.#won = false
                this.#lost = true
                this.player.preventNavigation()
                return true
            }

            // Player has neither won nor lost. Time to fight.
            this.#won = false
            this.#lost = false

            combat = {
                foe: combatMatch[1].trim(),
                foeVigour: parseInt(combatMatch[2]),
                numberOfDice: combatMatch[3],
                rules: [],
                flee: combatMatch[5] ? true : false,
                fleeTo: combatMatch[5] ? combatMatch[6] : undefined
            };

            let ruleMatch;
            while ((ruleMatch = combatRuleRegex.exec(combatMatch[4])) !== null) {
                combat.rules.push({
                    rangeLow: parseInt(ruleMatch[1]),
                    rangeHigh: parseInt(ruleMatch[2]),
                    action: ruleMatch[3],
                    turnAmount: parseInt(ruleMatch[4])
                });

                console.dir(ruleMatch)
            }

            this.#combat = combat

            this.#foenamelabel.textContent = combat.foe
            this.#foevigourlabel.textContent = combat.foeVigour

            this.#diceboard.setDice(combat.numberOfDice)
            this.#diceboard.show('combat')
            this.#element.classList.remove('hidden')
            this.player.preventNavigation()

            console.log('Combat detected:')
            console.dir(combat)
            console.dir(combatMatch)

            return true
        }

        this.#diceboard.hide('combat')
        this.#element.classList.add('hidden')
        this.player.allowNavigation()
        return false
    }
}

const combatTemplate = '<div class="combattable"><div><div>{foe}</div><div>VIGOUR: <span class="foeVigour">{foeVigour}</span></div><div><table><caption>Rules</caption><tbody>{rules}</tbody></table><div>{flee}</div></div></div><div class="rollstatus"></div></div>'

/**
 * 
 * @param {Combat} combat 
 * @returns {string}
 */
const formatCombat = (combat) => {
    const result = combatTemplate
        .replace('{foe}', `You face ${combat.foe} in combat.`)
        .replace('{foeVigour}', combat.foeVigour)
        .replace(
            '{rules}',
            combat.rules.reduce(
                (accum, rule) => accum + `<tr><td>${rule.rangeLow} to ${rule.rangeHigh}</td><td>${rule.action === 'lose' ? ': you lose' : ': they lose'} ${rule.turnAmount}</td></tr>`,
                '')
        )
        .replace('{flee}', combat.fleeTo ? `[[Flee|${combat.fleeTo}]]` : '')
    return result
}
