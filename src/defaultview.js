'use strict'

import './core/types'

/**
 * @implements {IView}
 */
export class DefaultView {
    /** @type {HTMLElement} */
    #contentelement

    constructor() {
        this.#contentelement = document.querySelector('section.content')
        if (!this.#contentelement) {
            throw new Error('could not initialize default view')
        }
    }

    /** @type {string} */
    get title () {
        const titleElement = document.getElementById('storyTitle')
        if (!titleElement) {
            return ''
        }

        return titleElement.textContent
    }

    /**
     * @param {string} value 
     */
    set title (value) {
        const titleElement = document.getElementById('storyTitle')
        if (titleElement) {
            titleElement.textContent = value
            titleElement.setAttribute('title', value)
        }
    }

    /** @type {HTMLElement} */
    get content () {
        return this.#contentelement
    }

    /**
     * 
     * @param {HTMLElement} element 
     */
    hide (element) {
        element.classList.add('hidden')
    }

    /**
     * 
     * @param {HTMLElement} element 
     */
    show (element) {
        element.classList.remove('hidden')
    }

    /**
     * 
     * @param {HTMLElement} element 
     */
    enable (element) {
        element.removeAttribute('disabled')
    }

    /**
     * 
     * @param {HTMLElement} element 
     */
    disable (element) {
        element.setAttribute('disabled', 'true')
    }

    /**
     * Hides all elements that match the selector under
     * the content element
     * @param {string} selector 
     */
    hideSelectedContent (selector) {
        this.#contentelement.querySelectorAll(selector)
            .forEach((item) => {
                this.hide(/** @type {HTMLElement} */(item))
            })
    }

    /**
     * @type {HTMLButtonElement}
     */
    get backButton () {
        return /** @type {HTMLButtonElement}  */(document.getElementById('backButton'))
    }

    /**
     * @type {HTMLButtonElement}
     */
    get forwardButton () {
        return /** @type {HTMLButtonElement}  */(document.getElementById('forwardButton'))
    }

    /**
     * @type {HTMLButtonElement}
     */
    get restartButton () {
        return /** @type {HTMLButtonElement}  */(document.getElementById('restartButton'))
    }

    /**
     * @type {HTMLButtonElement}
     */
    get saveLoadButton () {
        return /** @type {HTMLButtonElement} */(document.getElementById('saveLoadButton'))
    }

    /**
     * Blocks navigation for all blockable links in the content area
     */
    disableNavLinks () {
        this.#contentelement.querySelectorAll('a.link')
            .forEach((element) => {
                element.classList.add('navblocked')
            })
    }

    /**
     * Removes navigation block for all blockable links in the content area
     */
    enableNavLinks () {
        this.#contentelement.querySelectorAll('a.link')
            .forEach((element) => {
                element.classList.remove('navblocked')
            })
    }

    /**
     * Attaches a click handler to all Brass Basilisk links in the content area 
     * @param {EventFunc} handler A click handler function
     * @param {boolean} blockLinks Whether blockable links should be set to blocked
     */
    attachNavLinksHandler (handler, blockLinks) {
        const contentElement = this.#contentelement

        // Regular links can be navigation-blocked
        contentElement.querySelectorAll('a[class="link"]')
            .forEach((element) => {
                element.addEventListener('click', handler)
                if (blockLinks) {
                    element.classList.add('navblocked')
                }
            })

        // Some links are unblockable
        contentElement.querySelectorAll('a[class="stronglink"]')
            .forEach((element) => {
                element.addEventListener('click', handler)
            })
    }

    /**
     * Transforms Twine links
     * 
     *   [[Text->Target]], [[Text|Target]], [[Target]] to regular links,
     *   [[Target<-Text]] to unblockable links
     * 
     * @param {string} input 
     * @returns {string}
     */
    transformLinks (input) {
        return input
            .replaceAll(/\[\[([^\]]*?)(?:-(?:>|&gt;))([^\]]*?)\]\]/g, '<a class="link" data-destination="$2">$1</a>')
            .replaceAll(/\[\[([^\]]*?)\|([^\]]*?)\]\]/g, '<a class="link" data-destination="$2">$1</a>')
            .replaceAll(/\[\[([^\]]*?)(?:(?:<|&lt;)-)([^\]]*?)\]\]/g, '<a class="stronglink" data-destination="$1">$2</a>')
            .replaceAll(/\[\[([^\]]*?)\]\]/g, '<a class="link" data-destination="$1">$1</a>')
    }

    /**
     * Transforms newlines in input to <p> tags.
     * @param {string} input 
     */
    transformParagraphs (input) {
        return input
            .split(/\r?\n|\r|\n/g)
            .map((row) => `<p>${row}</p>`)
            .join('');
    }

    /**
     * Gets a container for a "tools" UI element.
     * 
     * In the default implementation, this looks for a div with the 
     * specified classname under section.sidebar-1
     * @param {string} panelName 
     * @returns {HTMLDivElement}
     */
    getToolPanel (panelName) {
        return document.querySelector(`section.sidebar-1 div.${panelName}`)
    }

    /**
     * Gets a dialog UI element.
     * 
     * In the default implementation, this looks for a dialog with
     * the specified id.
     * 
     * @param {string} dialogId
     * @returns {HTMLDialogElement}
     */
    getDialog (dialogId) {
        return /** @type {HTMLDialogElement}*/(document.getElementById(dialogId))
    }
}