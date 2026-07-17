'use strict'

import { BBGlobalStatePlugin } from "../core/plugin";
import '../core/types'
import { SaveLoadPlugin } from "./saveloadplugin";

export class CharacterSheetPlugin extends BBGlobalStatePlugin {
    /** @type {SaveLoadPlugin} */
    #saveloadPlugin

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

        this.#currentSheet = { vigour: 0, agility: 0, psi: 0 }
    }


    /** @type {CharacterSheet} */
    get #maxSheet() {
        return this.player?.getGlobalState(this.name)?.sheet ?? { vigour: 0, agility: 0, psi: 0 }
    }

    /**
     * 
     * @param {PlayerProxy} player 
     */
    init(player) {
        super.init(player)

        this.#saveloadPlugin = /** @type {SaveLoadPlugin} */ (player.getPlugin('saveload'))
        if (!this.#saveloadPlugin) {
            throw new Error('Character Sheet plugin requires the Save/Load plugin')
        }

        const element = player.view.getToolPanel('charactersheet')

        this.#vigourlabel = element.querySelector('label.vigour')
        this.#agilitylabel = element.querySelector('label.agility')
        this.#psilabel = element.querySelector('label.psi')


        this.#refreshdisplay =
            /**
             * 
             * @param {number} vigour 
             * @param {number} agility 
             * @param {number} psi 
             */
            (vigour, agility, psi) => {
                this.#vigourlabel.textContent = String(vigour ?? this.#currentSheet?.vigour)
                this.#agilitylabel.textContent = String(agility ?? this.#currentSheet?.agility)
                this.#psilabel.textContent = String(psi ?? this.#currentSheet?.psi)
            }

        // Restart the .stat-flash animation on a label, even if it's
        // already mid-flash from a rapid prior change.
        for (const label of [this.#vigourlabel, this.#agilitylabel, this.#psilabel]) {
            label.addEventListener('animationend', () => label.classList.remove('stat-flash'))
        }

        /** @type {HTMLDialogElement} */
        const dialog = player.view.getDialog('characterSheet') //document.getElementById('characterSheet')
        /** @type {HTMLInputElement} */
        const vigourInput = dialog.querySelector('#csVigour')
        /** @type {HTMLInputElement} */
        const agilityInput = dialog.querySelector('#csAgility')
        /** @type {HTMLInputElement} */
        const psiInput = dialog.querySelector('#csPsi')

        function rollNewSheet() {
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

            this.#refreshdisplay()
        })

        const loadButton = dialog.querySelector('#csLoad')
        loadButton.addEventListener('click', (e) => {
            dialog.close()
            this.#saveloadPlugin.showDialog()
        })

        this.#dialog = dialog
    }

    /**
     * 
     * @param {IPassage} passage 
     * @returns 
     */
    scan(passage) {
        /**
         * @returns {CharacterSheet}
         */

        const currentState = this.getCurrentState()

        if (!currentState || !currentState.sheet) {
            this.#dialog.showModal()
            return true
        }

        this.#currentSheet.vigour = currentState.sheet.vigour
        this.#currentSheet.agility = currentState.sheet.agility
        this.#currentSheet.psi = currentState.sheet.psi

        this.#refreshdisplay()

        // Re-derived every render (initial visit, back/forward, page
        // reload, or a loaded save) rather than relying solely on the
        // one-off side effect in the vigour setter below, which only
        // fires at the moment vigour actually changes to zero.
        if (this.#currentSheet.vigour <= 0) {
            this.player.preventNavigation()
        }

        return true
    }

    /**
     * Restarts the .stat-flash animation on a stat's label, forcing a
     * reflow so it retriggers even if the same stat just changed again
     * before the previous flash finished.
     *
     * @param {HTMLLabelElement} label
     */
    #flash(label) {
        label.classList.remove('stat-flash')
        // Trick to force the browser to restart a CSS animation
        void label.offsetWidth
        label.classList.add('stat-flash')
    }

    /**
     * 
     * @returns {Number|null}
     */
    get vigour() {
        return this.#currentSheet.vigour
    }

    /**
     * The current VIGOUR of the player. Setting it to a high value
     * like 1000 resets it to its normal or initial value.
     * 
     * @param {Number} value 
     */
    set vigour(value) {
        if (value > this.#maxSheet.vigour) {
            value = this.#maxSheet.vigour
        }

        this.#currentSheet.vigour = value
        this.#vigourlabel.textContent = String(value)
        this.#flash(this.#vigourlabel)
        this.setCurrentState({ sheet: structuredClone(this.#currentSheet) })

        // Handle the death case
        // <= rather than === 0: a phrase that decreases VIGOUR by more
        // than the character currently has overshoots straight past
        // zero into negative territory, and should still count as dead.
        if (value <= 0) {
            this.player.preventNavigation()
        }
    }

    /**
     * 
     * @returns {Number|null}
     */
    get agility() {
        return this.#currentSheet.agility
    }

    /**
     * The current AGILITY of the player. Setting it to a high value
     * like 1000 resets it to its normal or initial value.
     * 
     * @param {Number} value 
     */
    set agility(value) {
        if (value > this.#maxSheet.agility) {
            value = this.#maxSheet.agility
        }

        this.#currentSheet.agility = value
        this.#agilitylabel.textContent = String(value)
        this.#flash(this.#agilitylabel)
        this.setCurrentState({ sheet: structuredClone(this.#currentSheet) })
    }

    /**
     * 
     * @returns {Number|null}
     */
    get psi() {
        return this.#currentSheet.psi
    }

    /**
     * The current PSI of the player. Setting it to a high value
     * like 1000 resets it to its normal or initial value.
     * 
     * @param {Number} value 
     */
    set psi(value) {
        if (value > this.#maxSheet.psi) {
            value = this.#maxSheet.psi
        }

        this.#currentSheet.psi = value
        this.#psilabel.textContent = String(value)
        this.#flash(this.#psilabel)
        this.setCurrentState({ sheet: structuredClone(this.#currentSheet) })
    }
}