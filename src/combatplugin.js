'use strict'

import { DiceBoardPlugin } from "./diceboardplugin";
import Passage from "./passage";
import { BBScannerPlugin, PlayerProxy } from "./plugin";

const combatRegex = /([A-Z\s]+)\s+VIGOUR\s+(\d+)\s*\n+\s*?[Rr]oll\s+(\w+)\s+dice:\n+\s*((?:[Ss]core\s+\d+\s+to\s+\d+[^\n]+\n\s*)+)/
const combatRuleRegex = /score\s+(\d+)\s+to\s+(\d+)\s+(?:\w+\s)+(loses?)\s+(\d+)\s+VIGOUR/g

export class CombatPlugin extends BBScannerPlugin {
    /** @type {DiceBoardPlugin} */
    #diceboard
    #combat
    #element
    #foenamelabel
    #foevigourlabel

    constructor() {
        super('meleecombat')

    }

    /**
     * 
     * @param {PlayerProxy} player 
     */
    init (player) {
        super.init(player)

        // This should move to renderer interace
        const element = document.querySelector('div.combat')

        this.#foenamelabel = element.querySelector('label.foename')
        this.#foevigourlabel = element.querySelector('label.foevigour')
        this.#element = element

        this.#diceboard = player.getPlugin('diceboard')
        if (!this.#diceboard) {
            throw new Error('Combat plugin requires the Dice Board plugin. Please add it first')
        }

        if (!player.getPlugin('chancerollplugin')) {
            throw new Error('Combat plugin requires the Chance Roll plugin. Please add it first')
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
                            if (combat.foeVigour <= 0) {
                                this.#foenamelabel.textContent = 'DEFEATED!'
                                window.alert('You won!')
                                this.#diceboard.hide()
                            }

                        }
                    }
                })
            }
        })

    }

    /** @type {Passage} */
    scan (passage) {
        const passageBody = passage.body

        let combat
        const combatMatch = passageBody.match(combatRegex)
        if (combatMatch) {
            passage.isCombat = true;
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

            this.#element.classList.remove('hidden')

            return true
        }

        return false
    }
}

