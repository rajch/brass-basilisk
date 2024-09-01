'use strict'

import { CharacterSheetPlugin } from "./charactersheetplugin";
import { DiceBoardPlugin } from "./diceboardplugin";
import { Passage } from "../core/passage";
import { BBScannerPlugin } from "../core/plugin";

import '../core/types'

const combatRegex = /\n+([A-Z\s]+)\s+VIGOUR\s+(\d+)\s*\n+\s*?[Rr]oll\s+(\w+)\s+dice:\n+\s*((?:[Ss]core\s+\d+\s+to\s+\d+[^\n]+\n\s*)+)(?:\n+(.*?)\n)/
const combatRuleRegex = /score\s+(\d+)\s+to\s+(\d+)\s+(?:[\w;,\-:]+\s)+?(loses?)\s+(\d+)\s+VIGOUR/g
const destRegex = /[Ii]f .*?(FLEE|win|lose).*?turn to (\d{1,3})\./g

export class CombatPlugin extends BBScannerPlugin {
    /** @type {DiceBoardPlugin} */
    #diceboard
    /** @type {CharacterSheetPlugin} */
    #charactersheet
    #combat
    #won
    #lost
    // #element
    // #foenamelabel
    // #foevigourlabel

    constructor() {
        super('meleecombat')

    }

    /**
     * 
     * @param {PlayerProxy} player 
     */
    init (player) {
        super.init(player)

        this.#diceboard = player.getPlugin('diceboard')
        if (!this.#diceboard) {
            throw new Error('Combat plugin requires the Dice Board plugin')
        }

        this.#charactersheet = player.getPlugin('charactersheet')
        if (!this.#charactersheet) {
            throw new Error('Combat plugin requires the Character Sheet plugin')
        }

        const replaceFightArea = (message) => {
            updateFightArea(message)
            const contentarea = player.view.content
            const fightarea = contentarea.querySelector('.fightarea .combattable>div:first-child')
            fightarea.textContent = ''
        }

        const updateFightArea = (message) => {
            const contentarea = player.view.content
            const rollstatusarea = contentarea.querySelector('.fightarea .rollstatus')
            rollstatusarea.textContent = message
            const foevigourarea = contentarea.querySelector('.fightarea .foeVigour')
            foevigourarea.textContent = this.#combat.foeVigour
        }

        this.#diceboard.addEventListener('roll', (e) => {
            if (this.active) {
                const rollscore = e.detail.total
                const combat = this.#combat
                const contentarea = player.view.content

                combat.rules.map((rule) => {
                    if (rollscore >= rule.rangeLow &&
                        rollscore <= rule.rangeHigh
                    ) {
                        if (rule.action === 'loses') {
                            combat.foeVigour = combat.foeVigour - rule.turnAmount;
                            updateFightArea(`You hit ${combat.foe} for ${rule.turnAmount} points.`)
                            if (combat.foeVigour <= 0) {
                                this.#won = true
                                this.#lost = false
                                replaceFightArea('You won!')
                                this.#diceboard.hide('combat')
                                this.setCurrentState({ defeated: true })
                                this.#charactersheet.vigour = this.#charactersheet.vigour
                                this.player.allowNavigation()

                                contentarea.querySelectorAll('.combatwon').forEach((item) => {
                                    player.view.show(item)
                                })
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

                                contentarea.querySelectorAll('.combatlost').forEach((item) => {
                                    player.view.show(item)
                                })
                            }
                        }
                    }
                })
            }
        })

        this.player.addTransformer(
            /** 
             * @params {String} 
             * @returns {String} 
             */
            (input) => {
                if (!this.active) {
                    return input
                }

                const combat = this.#combat
                const areacontent = this.#won
                    ? `You defeated ${combat.foe} here.`
                        + (combat.destinations.winGoTo
                            ? `\n[[Go to ${combat.destinations.winGoTo}|${combat.destinations.winGoTo}]]\n`
                            : ''
                        )
                    : this.#lost
                        ? `You were killed by ${combat.foe} in combat.`
                            + (
                                combat.destinations.loseGoTo
                                    ? `\n[[Go to ${combat.destinations.loseGoTo}|${combat.destinations.loseGoTo}]]\n`
                                    : ''
                            )
                        : formatCombat(combat)

                const result = input.replace(
                    combatRegex,
                    `<div class="fightarea">${areacontent}</div>\n${combat.lastParagragh}\n`
                )

                console.log('Combat transform:')
                console.log(result)

                return result
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
                destinations: {},
                lastParagragh: ''
            };

            let ruleMatch;
            while ((ruleMatch = combatRuleRegex.exec(combatMatch[4])) !== null) {
                combat.rules.push({
                    rangeLow: parseInt(ruleMatch[1]),
                    rangeHigh: parseInt(ruleMatch[2]),
                    action: ruleMatch[3],
                    turnAmount: parseInt(ruleMatch[4])
                });
            }

            // If there is a paragraph after the rules table
            if (combatMatch[5]) {
                combat.lastParagragh = combatMatch[5]

                let destMatch
                while ((destMatch = destRegex.exec(combatMatch[5])) !== null) {
                    if (destMatch[1] === 'FLEE') {
                        combat.destinations.fleeTo = destMatch[2]
                        combat.lastParagragh = combat.lastParagragh.replace(destMatch[0], '')
                    } else if (destMatch[1] === 'lose') {
                        combat.destinations.loseGoTo = destMatch[2]
                        combat.lastParagragh = combat.lastParagragh.replace(destMatch[0], '')
                    } else if (destMatch[1] === 'win') {
                        combat.destinations.winGoTo = destMatch[2]
                        combat.lastParagragh = combat.lastParagragh.replace(destMatch[0], '')
                    }
                }
            }

            // If that paragraph could not be parsed, put it into
            // the combat object for restoring during transform.
            if (!combat.destinations.fleeTo
                && !combat.destinations.winGoToTo
                && !combat.destinations.loseGoTo
            ) {
                combat.lastParagragh = combatMatch[5]
            }

            this.#combat = combat

            this.#diceboard.setDice(combat.numberOfDice)
            this.#diceboard.show('combat')
            this.player.preventNavigation()

            console.log('Combat detected:')
            console.dir(combat)
            console.dir(combatMatch)

            return true
        }

        this.#diceboard.hide('combat')
        this.player.allowNavigation()
        return false
    }
}

const combatTemplate = '<div class="combattable"><div><div><table><caption>Rules</caption><tbody>{rules}</tbody></table><div>{flee}</div></div><div>{foe}</div><div>VIGOUR: <span class="foeVigour">{foeVigour}</span></div></div><div class="rollstatus"></div></div>{wingoto}{losegoto}'

/**
 * 
 * @param {Combat} combat 
 * @returns {string}
 */
const formatCombat = (combat) => {
    let result = combatTemplate
        .replace('{foe}', `You face ${combat.foe} in combat.`)
        .replace('{foeVigour}', combat.foeVigour)
        .replace(
            '{rules}',
            combat.rules.reduce(
                (accum, rule) => accum + `<tr><td>${rule.rangeLow} to ${rule.rangeHigh}</td><td>${rule.action === 'lose' ? ': you lose' : ': they lose'} ${rule.turnAmount}</td></tr>`,
                '')
        )
        .replace('{flee}', combat.destinations.fleeTo ? `[[${combat.destinations.fleeTo}<-Flee]]` : '')
        .replace('{wingoto}', combat.destinations.winGoTo ? `<p class="combatwon hidden">[[Go to ${combat.destinations.winGoTo}|${combat.destinations.winGoTo}]]</p>` : '')
        .replace('{losegoto}', combat.destinations.loseGoTo ? `<p class="combatlost hidden">[[Go to ${combat.destinations.loseGoTo}|${combat.destinations.loseGoTo}]]</p>` : '')

    return result
}
