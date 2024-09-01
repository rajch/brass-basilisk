'use strict'

import { BBGlobalStatePlugin } from "../core/plugin";
import '../core/types'

export class CharacterSheetPlugin extends BBGlobalStatePlugin {
    /** @type CharacterSheet */
    #currentSheet
    /** @type CharacterSheet */
    #globalSheet

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

        this.#globalSheet = {
            vigour: 0,
            agility: 0,
            psi: 0
        }

        this.#currentSheet = structuredClone(this.#globalSheet)
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
            this.#globalSheet.vigour = vigourInput.valueAsNumber
            this.#globalSheet.agility = agilityInput.valueAsNumber
            this.#globalSheet.psi = psiInput.valueAsNumber

            this.#currentSheet = structuredClone(this.#globalSheet)

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
     * The current VIGOUR of the player. Setting it to a high value
     * like 1000 resets it to its normal or initial value.
     * 
     * @param {Number} value 
     */
    set vigour (value) {
        if (value > this.#globalSheet.vigour) {
            value = this.#globalSheet.vigour
        }

        this.#currentSheet.vigour = value
        this.#vigourlabel.textContent = value
        this.setCurrentState({ sheet: structuredClone(this.#currentSheet) })

        // Handle the death case
        if (value === 0 ) {
            this.player.preventNavigation()
        }
    }

    /**
     * 
     * @returns {Number|null}
     */
    get agility () {
        return this.#currentSheet.agility
    }

    /**
     * The current AGILITY of the player. Setting it to a high value
     * like 1000 resets it to its normal or initial value.
     * 
     * @param {Number} value 
     */
    set agility (value) {
        if (value > this.#globalSheet.agility) {
            value = this.#globalSheet.agility
        }

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
     * The current PSI of the player. Setting it to a high value
     * like 1000 resets it to its normal or initial value.
     * 
     * @param {Number} value 
     */
    set psi (value) {
        if(value > this.#globalSheet.psi) {
            value = this.#globalSheet.psi
        }

        this.#currentSheet.psi = value
        this.#psilabel.textContent = value
        this.setCurrentState({ sheet: structuredClone(this.#currentSheet) })
    }
}
