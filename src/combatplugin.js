'use strict'

import { CharacterSheetPlugin } from "./charactersheetplugin";
import { DiceBoardPlugin } from "./diceboardplugin";
import Passage from "./passage";
import { BBScannerPlugin } from "./plugin";

const combatRegex = /([A-Z\s]+)\s+VIGOUR\s+(\d+)\s*\n+\s*?[Rr]oll\s+(\w+)\s+dice:\n+\s*((?:[Ss]core\s+\d+\s+to\s+\d+[^\n]+\n\s*)+)/
const combatRuleRegex = /score\s+(\d+)\s+to\s+(\d+)\s+(?:\w+\s)+(loses?)\s+(\d+)\s+VIGOUR/g

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

        const updateFightArea = (message) => {
            const fightarea = document.querySelector('.content .fightarea')
            fightarea.textContent = message
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
                                updateFightArea('You won!')
                                this.#diceboard.hide()
                                this.setCurrentState({ defeated: true })
                                this.#charactersheet.vigour = this.#charactersheet.vigour
                                this.player.allowNavigation()
                            }

                        } else {
                            const sheet = this.#charactersheet
                            sheet.vigour = sheet.vigour - rule.turnAmount
                            updateFightArea(`${combat.foe} hit you for ${rule.turnAmount} points.`)
                            if(sheet.vigour <= 0) {
                                this.#lost = true
                                this.#won = false
                                updateFightArea(`You were killed by ${combat.foe}.`)
                                this.setCurrentState({ playerdefeated: true })
                                this.#diceboard.hide()
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
            if(!this.active) {
                return input
            }

            const text = this.#won 
                ? `You defeated ${this.#combat.foe} here.` 
                : this.#lost 
                ? `You were killed by ${this.#combat.foe} in combat.`
                : `You face ${this.#combat.foe} in combat.`

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
                rules: []
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
            this.#diceboard.show()
            this.#element.classList.remove('hidden')
            this.player.preventNavigation()
            return true
        }

        this.#diceboard.hide()
        this.#element.classList.add('hidden')
        this.player.allowNavigation()
        return false
    }
}

