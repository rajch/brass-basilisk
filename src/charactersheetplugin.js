'use strict'

import { BBGlobalStatePlugin } from "./plugin";
import './types'

export class CharacterSheetPlugin extends BBGlobalStatePlugin {
    /** @type CharacterSheet */
    #currentSheet
    /** @type {HTMLLabelElement} */
    #vigourlabel
    /** @type {HTMLLabelElement} */
    #agilitylabel
    /** @type {HTMLLabelElement} */
    #psilabel
    /** @type {Function} */
    #refreshdisplay
    /** @type {HTMLDialogElement} */
    #dialog

    constructor() {
        super('charactersheet')

        this.#currentSheet = {
            vigour: 0,
            agility: 0,
            psi: 0
        }
    }

    /**
     * 
     * @param {PlayerProxy} player 
     */
    init (player) {
        super.init(player)

        const element = player.view.getToolPanel('charactersheet')

        this.#vigourlabel = element.querySelector('label.vigour')
        this.#agilitylabel = element.querySelector('label.agility')
        this.#psilabel = element.querySelector('label.psi')

        this.#refreshdisplay = (vigour, agility, psi) => {
            this.#vigourlabel.textContent = vigour ?? this.#currentSheet?.vigour
            this.#agilitylabel.textContent = agility ?? this.#currentSheet?.agility
            this.#psilabel.textContent = psi ?? this.#currentSheet?.psi
        }

        /** @type {HTMLDialogElement} */
        const dialog = player.view.getDialog('characterSheet') //document.getElementById('characterSheet')
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
            this.#currentSheet.vigour = vigourInput.valueAsNumber
            this.#currentSheet.agility = agilityInput.valueAsNumber
            this.#currentSheet.psi = psiInput.valueAsNumber

            this.setGlobalState({
                sheet: this.#currentSheet
            })

            this.#refreshdisplay()
        })

        this.#dialog = dialog
    }

    scan (passage) {
        /**
         * @returns {CharacterSheet}
         */

        const currentState = this.getCurrentState()

        if (!currentState || !currentState.sheet) {

            this.#dialog.showModal()

        } else {

            this.#currentSheet.vigour = currentState.sheet.vigour
            this.#currentSheet.agility = currentState.sheet.agility
            this.#currentSheet.psi = currentState.sheet.psi

            this.#refreshdisplay()

        }
    }

    /**
     * 
     * @returns {Number|null}
     */
    get vigour () {
        return this.#currentSheet.vigour
    }

    /**
     * 
     * @param {Number} value 
     */
    set vigour (value) {
        this.#currentSheet.vigour = value
        this.#vigourlabel.textContent = value
        this.setCurrentState({ sheet: structuredClone(this.#currentSheet) })
    }

    /**
     * 
     * @returns {Number|null}
     */
    get agility () {
        return this.#currentSheet.agility
    }

    /**
     * 
     * @param {Number} value 
     */
    set agility (value) {
        this.#currentSheet.agility = value
        this.#agilitylabel.textContent = value
        this.setCurrentState({ sheet: structuredClone(this.#currentSheet) })
    }

    /**
     * 
     * @returns {Number|null}
     */
    get psi () {
        return this.#currentSheet.psi
    }

    /**
     * 
     * @param {Number} value 
     */
    set psi (value) {
        this.#currentSheet.psi = value
        this.#psilabel.textContent = value
        this.setCurrentState({ sheet: structuredClone(this.#currentSheet) })
    }
}
