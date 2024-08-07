'use strict'

import { BBScannerPlugin } from "./plugin";
import './types'

// Raises 'roll' event, with event.detail containing the total roll
export class DiceBoardPlugin extends BBScannerPlugin {
    /** @type {number} */
    #numdice = 0
    /** @type {Function} */
    #updatelabel
    /** @type {Function} */
    #setdice
    /** @type {Function} */
    #setresults
    /** @type {Function} */
    #hide
    /** @type {Function} */
    #show
    /** @type {Number} */
    #currentresult = 0
    #hidestack = {}

    constructor() {
        super('diceboard')
    }

    /**
     * 
     * @param {PlayerProxy} player 
     */
    init (player) {
        super.init(player)

        // This should move to renderer interface
        const element = player.view.getToolPanel('diceboard')

        const rollArea = element.querySelector('div.rollarea')
        const rollButton = element.querySelector('button.dicerollbutton')
        const rollResultLabel = element.querySelector('label.rollresultlabel')

        const diceRotationMap = {
            1: 'rotateX(0deg) rotateY(0deg)',
            2: 'rotateX(0deg) rotateY(-90deg)',
            3: 'rotateX(180deg) rotateY(0deg)',
            4: 'rotateX(0deg) rotateY(90deg)',
            5: 'rotateX(-90deg) rotateY(0deg)',
            6: 'rotateX(90deg) rotateY(0deg)'
        }

        const setDieTo = (dieNum, score) => {
            const dice = rollArea.querySelector(`div.dice-${dieNum}`)
            dice.style.transform = diceRotationMap[score]
        }

        this.#updatelabel = (message) => {
            rollResultLabel.innerText = message
        }

        const self = this

        /**
         * 
         * @param {Number[]} results 
         * @param {Number} totalresults 
         * @param {boolean} isOldRoll 
         */
        const updateResultsLabel = (results, totalresults, isOldRoll) => {
            const resultsStr = results.reduce(
                (finalValue, currentValue) => {
                    finalValue = finalValue
                        ? finalValue + '+' + currentValue
                        : String(currentValue)
                    return finalValue
                },
                ''
            )
            const verb = isOldRoll ? 'was' : 'is'
            this.#updatelabel(`Your score ${verb} ${resultsStr} = ${totalresults}.`)
        }

        const rollDice = () => {
            const number = this.#numdice

            const results = []
            let totalresults = 0

            for (let i = 0; i < number; i++) {
                const result = Math.floor(Math.random() * 6) + 1
                results.push(result)
                totalresults += result

                setDieTo(i, result)
            }

            updateResultsLabel(results, totalresults, false)

            this.#currentresult = totalresults

            // Raises 'roll' event, with event.detail containing the total roll
            this.dispatchEvent(
                new CustomEvent(
                    'roll',
                    {
                        detail: {
                            total: totalresults,
                            rolls: results
                        }
                    }
                )
            )
        }

        rollButton.addEventListener('click', (e) => {
            rollDice()
        })

        const matchMap = {
            "0": 0,
            "2": 2,
            "two": 2,
            "3": 3,
            "three": 3,
            "some": 3
        }

        this.#setdice = (number) => {
            number = matchMap[number] ?? 1

            this.#numdice = number

            rollArea.innerHTML = ''

            let dieStr = ''
            for (let i = 0; i < number; i++) {
                dieStr = dieStr + dieTemplate.replace('{{n}}', i)
            }

            const templ = document.createElement('template')
            templ.innerHTML = dieStr
            const result = templ.content.children

            rollArea.append(...result)
        }

        /**
         * 
         * @param {number[]} results 
         */
        this.#setresults = (results) => {
            const resultscount = results.length
            if (this.#numdice !== resultscount) {
                this.#setdice(resultscount)
            }
            let totalresults = 0
            for (let i = 0; i < results.length; i++) {
                totalresults += results[i]
                setDieTo(i, results[i])
            }

            updateResultsLabel(results, totalresults, true)
            this.#currentresult = totalresults
        }

        this.#hide = () => {
            element.classList.add('hidden')
        }

        this.#show = () => {
            element.classList.remove('hidden')
        }

        this.#hide()
    }

    scan (passage) {
        this.#hide()
        this.#setdice(0)
        this.#updatelabel('')
        this.#hidestack = {}

        return true
    }

    /**
     * Hides the diceboard from the UI. The calling plugin needs to specify
     * its name in the owner parameter. The diceboard can be hidden only by
     * the same plugin that showed it last.
     * 
     * @param {string} owner The plugin which wants to hide the diceboard
     * @returns {void}
     */
    hide (owner) {
        if (!owner) {
            throw new Error('please provide the name of the plugin that is trying to hide the diceboard')
        }

        if (this.#hidestack[owner]) {
            this.#hide()
            this.#hidestack[owner] = undefined
            console.log(`Dice hidden by ${owner}`)
            return
        }

        console.log(`Dice NOT hidden by ${owner} `)
    }

    /**
     * Makes the diceboard visible in the UI. The calling plugin needs to 
     * specify its name in the owner parameter, because the diceboard can
     * be required by multiple plugins. Only that plugin which last shows 
     * the diceboard can hide it.
     * 
     * @param {*} owner The plugin which wants to show the diceboard
     */
    show (owner) {
        if (!owner) {
            throw new Error('please provide the name of the plugin that is trying to hide the diceboard')
        }

        this.#hidestack[owner] = true
        this.#show()

        console.log(`Dice shown by ${owner}`)
    }

    /**
     * Sets up the diceboard to show and roll the specified number of dice.
     * 
     * @param {Number} number Number of dice 
     */
    setDice (number) {
        this.#setdice(number)
    }

    /**
     * Sets the current results of the diceboard, as specified. Also sets
     * the number of dice.
     * 
     * @param {Number[]} results 
     */
    setResults (results) {
        this.#setresults(results)
    }

    /**
     * Returns the total score from the last roll.
     * 
     * @returns {Number}
     */
    get currentResult () {
        return this.#currentresult
    }
}

const dieTemplate = `
<div class="dice dice-{{n}}">
    <div class="side one">
    <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="10" fill="black" />
    </svg>
    </div>
    <div class="side two">
    <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="25" r="10" fill="black" />
        <circle cx="50" cy="75" r="10" fill="black" />
    </svg>    
    </div>
    <div class="side three">
    <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="25" r="10" fill="black" />
        <circle cx="50" cy="50" r="10" fill="black" />
        <circle cx="50" cy="75" r="10" fill="black" />
    </svg>    
    </div>
    <div class="side four">
    <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="25" cy="25" r="10" fill="black" />
        <circle cx="75" cy="25" r="10" fill="black" />
        <circle cx="25" cy="75" r="10" fill="black" />
        <circle cx="75" cy="75" r="10" fill="black" />
    </svg>
    </div>
    <div class="side five">
    <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="25" cy="25" r="10" fill="black" />
        <circle cx="75" cy="25" r="10" fill="black" />
        <circle cx="50" cy="50" r="10" fill="black" />
        <circle cx="25" cy="75" r="10" fill="black" />
        <circle cx="75" cy="75" r="10" fill="black" />
    </svg>    
    </div>
    <div class="side six">
    <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="25" cy="25" r="10" fill="black" />
        <circle cx="75" cy="25" r="10" fill="black" />
        <circle cx="25" cy="50" r="10" fill="black" />
        <circle cx="75" cy="50" r="10" fill="black" />
        <circle cx="25" cy="75" r="10" fill="black" />
        <circle cx="75" cy="75" r="10" fill="black" />
    </svg>    
    </div>
</div>`
