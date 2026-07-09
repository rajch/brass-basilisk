'use strict'

import { BBPlugin } from "../core/plugin"
import '../core/types'

/**
 * Wires up the Save/Load dialog. Unlike most plugins, this one isn't
 * a scanner -- it doesn't react to individual passages. It just gives
 * the player a way to call Player#saveGame / Player#loadGame /
 * Player#getSaveSlots (exposed on the player proxy) from a button and
 * a small list UI.
 */
export class SaveLoadPlugin extends BBPlugin {
    /** @type {HTMLDialogElement} */
    #dialog
    /** @type {HTMLElement} */
    #list
    /** @type {HTMLElement} */
    #unavailableMessage
    /** @type {HTMLElement} */
    #saveloaderrorMessage


    constructor() {
        super('saveload')
    }

    /**
     * @param {PlayerProxy} player
     */
    init(player) {
        super.init(player)

        const openButton = player.view.saveLoadButton
        const dialog = player.view.getDialog('saveLoad')

        this.#dialog = dialog
        this.#list = dialog.querySelector('.saveslotlist')
        this.#unavailableMessage = dialog.querySelector('.saveunavailable')
        this.#saveloaderrorMessage = dialog.querySelector('.saveloaderror')

        const closeButton = dialog.querySelector('#slClose')
        closeButton?.addEventListener('click', () => dialog.close())

        openButton?.addEventListener('click', () => {
            this.#refresh()
            dialog.showModal()
        })
    }

    /**
     * Rebuilds the slot list from scratch. Called whenever the dialog
     * is opened, and again after a save so the new timestamp shows up
     * immediately.
     */
    #refresh() {
        if (!this.player.isSaveAvailable()) {
            this.#list.replaceChildren()
            this.#unavailableMessage?.classList.remove('hidden')
            return
        }

        this.#unavailableMessage?.classList.add('hidden')
        this.#saveloaderrorMessage?.classList.add('hidden')

        const slots = this.player.getSaveSlots()
        const rows = slots.map((slotInfo) => this.#buildRow(slotInfo))

        this.#list.replaceChildren(...rows)
    }

    /**
     * @param {SaveSlotInfo} slotInfo
     * @returns {HTMLElement}
     */
    #buildRow(slotInfo) {
        const row = document.createElement('div')
        row.className = 'saveslot'

        const label = document.createElement('span')
        label.className = 'saveslotlabel'
        label.textContent = slotInfo.empty
            ? `Slot ${slotInfo.slot + 1}: empty`
            : `Slot ${slotInfo.slot + 1}: ${slotInfo.passageName} — ${new Date(slotInfo.savedAt).toLocaleString()}`

        const saveButton = document.createElement('button')
        saveButton.type = 'button'
        saveButton.textContent = 'Save'
        saveButton.addEventListener('click', () => {
            const saved = this.player.saveGame(slotInfo.slot)
            if (!saved) {
                this.#saveloaderrorMessage?.classList.remove('hidden')
                this.#saveloaderrorMessage.textContent = "Could not save."
                return
            }
            this.#refresh()
        })

        const loadButton = document.createElement('button')
        loadButton.type = 'button'
        loadButton.textContent = 'Load'
        loadButton.disabled = slotInfo.empty
        loadButton.addEventListener('click', () => {
            const loaded = this.player.loadGame(slotInfo.slot)
            if (!loaded) {
                this.#saveloaderrorMessage?.classList.remove('hidden')
                this.#saveloaderrorMessage.textContent = "Could not load."
                return
            }
            this.#dialog.close()
        })

        const deleteButton = document.createElement('button')
        deleteButton.type = 'button'
        deleteButton.textContent = 'Delete'
        deleteButton.disabled = slotInfo.empty
        deleteButton.addEventListener('click', () => {
            this.player.deleteGame(slotInfo.slot)
            this.#refresh()
        })

        row.append(label, saveButton, loadButton, deleteButton)

        return row
    }
}
