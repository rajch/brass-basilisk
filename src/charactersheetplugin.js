'use strict'

import { BBScannerPlugin, PlayerProxy } from "./plugin";

/**
 * @typedef {Object} CharacterSheet
 * @property {string} name
 * @property {Number} vigour
 * @property {Number} agility
 * @property {Number} psi
 */


export class CharacterSheetPlugin extends BBScannerPlugin {
    /** @type CharacterSheet */
    #currentSheet
    /** @type {Function} */
    #setCurrentSheet
    /** @type {HTMLLabelElement} */
    #vigourlabel
    /** @type {HTMLLabelElement} */
    #agilitylabel
    /** @type {HTMLLabelElement} */
    #psilabel

    constructor() {
        super('charactersheet')
    }

    /**
     * 
     * @param {PlayerProxy} player 
     */
    init (player) {
        super.init(player)

        const element = document.querySelector('.sidebar-1 .charactersheet')
        this.#vigourlabel = element.querySelector('label.vigour')
        this.#agilitylabel = element.querySelector('label.agility')
        this.#psilabel = element.querySelector('label.psi')

        /** @type {HTMLDialogElement} */
        const dialog = document.getElementById('characterSheet')
        /** @type {HTMLInputElement} */
        const vigourInput = dialog.querySelector('#csVigour')
        const agilityInput = dialog.querySelector('#csAgility')
        const psiInput = dialog.querySelector('#csPsi')

        function rollNewSheet () {
            vigourInput.valueAsNumber = Math.floor(Math.random() * 12) + 20
            agilityInput.valueAsNumber = Math.floor(Math.random() * 6) + 3
            psiInput.valueAsNumber = Math.floor(Math.random() * 6) + 3
        }

        rollNewSheet()

        /** @type {HTMLButtonElement} */
        const reRollButton = dialog.querySelector('#csReRoll')
        reRollButton.addEventListener('click', (e) => {
            rollNewSheet()
        })

        dialog.addEventListener('close', (e) => {
            this.#currentSheet = {
                vigour: vigourInput.valueAsNumber,
                agility: agilityInput.valueAsNumber,
                psi: psiInput.valueAsNumber
            }

            this.setGlobalState({
                sheet: this.#currentSheet
            })

            this.#vigourlabel.textContent = vigourInput.valueAsNumber
            this.#agilitylabel.textContent = agilityInput.valueAsNumber
            this.#psilabel.textContent = psiInput.valueAsNumber
        })
    }

    scan (passage) {
        /**
         * @returns {CharacterSheet}
         */

        const currentState = this.getCurrentState()
       
        if (!currentState || !currentState.sheet) {
            /** @type {HTMLDialogElement} */
            const dialog = document.getElementById('characterSheet')
            dialog.showModal()
        }
    }
}
