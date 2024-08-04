'use strict'

import { BBPlugin } from "./plugin"
import { processHTML, processTwineLinks, addParagraphTags } from './transformers'
import Passage from "./passage"

export default class Player {
    /** @type {Boolean} */
    #blocklinks = false
    /** @type {Function} */
    #preventnavigation
    /** @type {Function} */
    #allownavigation
    /** @type {Function} */
    #addscanner
    /** @type {Function} */
    #addtransformer
    /** @type {Function} */
    #stateset
    /** @type {Function} */
    #stateget
    /** @type {Function} */
    #statesetglobal
    /** @type {Function} */
    #stategetglobal
    /** @type {Function} */
    #addplugin
    /** @type {Function} */
    #getplugin
    /** @type {Function} */
    #start

    constructor() {
        const storyElement = document.querySelector('tw-storydata')
        if (!storyElement) {
            throw new Error('could not initialize reader')
        }

        const contentElement = document.querySelector('section.content')
        if (!contentElement) {
            throw new Error('could not initialize renderer')
        }

        const storyName = storyElement.getAttribute('name')
        const startNodePid = storyElement.getAttribute('startnode')
        const tags = storyElement.getAttribute('tags')?.split(' ')

        const self = this

        // Scan management
        // A scanner is a function which takes a passage object and returns
        // nothing. It is called when a new passage is about to be rendered
        // after successful navigation. Scanners are called in the order of
        // registration. They are implemented by BBScannerPlugins.
        const scanners = []

        this.#addscanner = (scannerFunc) => {
            scanners.push(scannerFunc)
        }

        function scanPassage (passage) {
            for (let i = 0; i < scanners.length; i++) {
                if (typeof scanners[i] === 'function') {
                    scanners[i](passage)
                }
            }
        }

        // Transformation
        // A transformer is a function which takes a string and returns a
        // string. The assumption is that it will translate something in 
        // the input into enencoded HTML. There are a few in-built ones,
        // and more can be registered. Just as a passage is about to be
        // rendered, the passage body is piped through all transformers.
        // After the last one, a final sanitisation is done (TODO:), and 
        // the results are rendered.
        const transformers = []

        function transformPassageBody (body) {
            let bodystr = body

            // Run the in-built HTML transformer first
            // This will read and sanitise any HTML in
            // the passage body. From this point, it's
            // all unencoded HTML.
            // bodystr = processHTML(bodystr)

            // Run all registered transformers. In all
            // of them, the result should contain text
            // and unencoded HTML.
            for (let i = 0; i < transformers.length; i++) {
                if (typeof transformers[i] === 'function') {
                    bodystr = transformers[i](bodystr)
                }
            }

            // Run the in-built links transformer next
            bodystr = processTwineLinks(bodystr)

            // Run the in-built transformer to change
            // newlines into <p> tags last.
            bodystr = addParagraphTags(bodystr)

            return bodystr
        }

        this.#addtransformer = (transformerFunc) => {
            transformers.push(transformerFunc)
        }

        // Passage management
        function getPassageByName (name) {
            const passageElement = storyElement?.querySelector(`tw-passagedata[name="${name}"]`)
            if (!passageElement) {
                return
            }

            return Passage.FromElement(passageElement)
        }

        /// These methods can be called from plugins to prevent
        /// or allow navigation from a passage. Only navigation
        /// to new passages is prevented.
        this.#preventnavigation = () => {
            this.#blocklinks = true

            contentElement.querySelectorAll('a.link')
                .forEach((element) => {
                    element.classList.add('navblocked')
                })
        }

        this.#allownavigation = () => {
            this.#blocklinks = false

            contentElement.querySelectorAll('a.link')
                .forEach((element) => {
                    element.classList.remove('navblocked')
                })
        }

        // This is where a passage is rendered. This is the final action
        // of any navigation step. The actions are as follows:
        // First, all registered scanners are called. They cannot change
        // the passage in any way. 
        // Next, the passage body text is piped through all registered 
        // transformers, in the process becoming unencoded HTML. As part
        // of this process, hyperlinks are also generated.
        // Finally, hyperlinks are connected to navigation. 
        function renderPassage (passage) {
            scanPassage(passage)

            contentElement.innerHTML = transformPassageBody(passage.body)

            // Regular links can be navigation-blocked
            contentElement.querySelectorAll('a[class="link"]')
                .forEach((element) => {
                    element.addEventListener('click', linkClickedToNavigate)
                    if (self.#blocklinks) {
                        element.classList.add('navblocked')
                    }
                })

            // Some links are unblockable
            contentElement.querySelectorAll('a[class="stronglink"]')
                .forEach((element) => {
                    element.addEventListener('click', linkClickedToNavigate)
                })

        }

        // This connects the navigation, defined below, to passage rendering.
        // As the final task of any navigation step, this function is called.
        function navigateToPassage (name) {
            const passage = getPassageByName(name)
            if (passage) {
                renderPassage(passage)
            }
        }


        // Navigation
        const navStack = []
        let stackPosition = -1

        function clearAfterCurrent () {
            if (stackPosition < (navStack.length - 1)) {
                navStack.splice(stackPosition + 1)
            }
        }

        /// Navigation UI
        const backButton = document.getElementById('backButton')
        const forwardButton = document.getElementById('forwardButton')
        const restartButton = document.getElementById('restartButton')


        function manageNavigationButtons () {
            // Back button
            if (stackPosition > 0) {
                // backButton?.classList.remove('hidden')
                backButton?.removeAttribute('disabled')
            } else {
                // backButton?.classList.add('hidden')
                backButton?.setAttribute('disabled', 'true')
            }
            // Forward button
            if (stackPosition === (navStack.length - 1)) {
                // forwardButton?.classList.add('hidden')
                forwardButton?.setAttribute('disabled', 'true')
            } else {
                //forwardButton?.classList.remove('hidden')
                forwardButton?.removeAttribute('disabled')
            }
        }

        /// Navigation state management
        let currentState = {}
        let globalState = {}

        this.#stateset = (key, value) => {
            currentState[key] = value
            navStack[stackPosition].state[key] = value

            // Setting current state invalidates any navigation
            // after the current position
            clearAfterCurrent()
            manageNavigationButtons()
        }

        this.#stateget = (key) => {
            // Navigation has already set the current state
            return currentState[key]
        }

        this.#statesetglobal = (key, value) => {
            // A global state set is always destructive. The old state goes,
            // and the new one should not be linked with anything
            globalState[key] = structuredClone(value)

            console.log(`Global state set key:${key} to value: ${JSON.stringify(value)}`)

            // Setting global state invalidates any navigation
            // after the current position
            clearAfterCurrent()
            manageNavigationButtons()
        }

        this.#stategetglobal = (key) => {
            return globalState[key]
        }

        /// At the end of the three kinds of navigation defined below
        /// , this is called. Here, we manage the navigation buttons
        /// based on our current location, and restore the current 
        /// state from the navigation stack.
        function finishNavigation () {
            manageNavigationButtons()

            const stackFrame = navStack[stackPosition]
            console.log(`You have come to ${stackFrame.passageName}. The state is ${JSON.stringify(stackFrame)}`)
            console.log(`The whole stack is ${JSON.stringify(navStack)}`)
            console.log(`The global state is ${JSON.stringify(globalState)}`)
            currentState = stackFrame.state
            navigateToPassage(stackFrame.passageName)
        }

        /// This is what gets called when a player clicks a link, and
        /// boldly goes where she has never gone before.
        function navigateNew (passageName) {
            // Moving to a "new" passage means, any navigation  after
            // the current position is no longer required. 
            clearAfterCurrent()

            // This is the only operation that can push state on  the
            // navigation stack. All other operations restore from it
            navStack.push({
                passageName,
                state: structuredClone(currentState)
            })
            stackPosition = navStack.length - 1

            finishNavigation()
        }

        /// This gets called when the "back" button is clicked in the
        /// UI. It goes back one step in the navigation stack, if not
        /// already at the beginning, and restores the current state
        /// from what was saved on the stack. 
        function navigateBack () {
            if (stackPosition > 0) {
                stackPosition--
            }

            finishNavigation()
        }

        /// This gets called when the "forward" button is clicked in 
        /// the UI. It goes forward one step provided there has been
        /// backward movement earlier.  It will never navigate  to a
        /// new position. It restores the current state from the 
        /// stack. 
        function navigateForward () {
            if (stackPosition < (navStack.length - 1)) {
                stackPosition++
            }

            finishNavigation()
        }

        function restartNavigation () {
            navStack.splice(0)
            stackPosition = -1
            currentState = {}
            globalState = {}

            const passageElement = storyElement?.querySelector(`tw-passagedata[pid="${startNodePid}"]`)
            if (!passageElement) {
                return
            }
            const passage = Passage.FromElement(passageElement)
            if (passage?.name) {
                navigateNew(passage.name)
            }
        }

        /// This can be attached to link click events
        function linkClickedToNavigate (e) {
            const linkElement = e.target
            const destPassageName = linkElement.getAttribute('data-destination')
            if (destPassageName) {
                navigateNew(destPassageName)
            }
        }

        // Plugin Management
        const plugins = {}

        this.#getplugin = (pluginname) => {
            return plugins[pluginname]
        }

        /**
         * 
         * @param {BBPlugin} plugin 
         */
        this.#addplugin = (plugin) => {
            // Check for validity of plugin
            if (!plugin instanceof BBPlugin) {
                throw new Error(`${pluginname} is not a valid plugin`)
            }

            const pluginname = plugin.name
            if (typeof plugins[pluginname] === 'object') {
                throw new Error(`a plugin called ${pluginname} already exists`)
            }

            plugins[pluginname] = plugin

            // Pass a player "proxy" to plugin
            plugin.init({
                addScanner: this.#addscanner,
                addTransformer: this.#addtransformer,
                addPlugin: this.#addplugin,
                getPlugin: this.#getplugin,
                setCurrentState: this.#stateset,
                getCurrentState: this.#stateget,
                setGlobalState: this.#statesetglobal,
                getGlobalState: this.#stategetglobal,
                preventNavigation: this.#preventnavigation,
                allowNavigation: this.#allownavigation
            })
        }

        // Start playing
        this.#start = function () {
            // Set up story styles
            const storyStyleElement = storyElement.querySelector('style')?.cloneNode(true)
            storyStyleElement.removeAttribute('role')
            storyStyleElement.removeAttribute('type')
            if (storyStyleElement) {
                const styleElement = document.querySelector('head style')
                if (styleElement) {
                    styleElement.insertAdjacentElement('afterend', storyStyleElement)
                }
            }

            // Show the title
            const titleElement = document.getElementById('storyTitle')
            if (titleElement) {
                titleElement.innerHTML = storyName
            }

            // Hook up forward, backward and restart buttons
            backButton?.addEventListener('click', navigateBack)
            forwardButton?.addEventListener('click', navigateForward)
            restartButton?.addEventListener('click', restartNavigation)

            // Navigate to first passage
            restartNavigation()
        }
    }

    /**
    * 
    * @param {string} key A unique key. Usually involves the passage name.
    * @param {*} state Any object
    */
    setCurrentState (key, state) {
        this.#stateset(key, state)
    }

    /**
     * 
     * @param {string} key A unique key. Usually involves the passage name.
     */
    getCurrentState (key) {
        return this.#stateget(key)
    }

    /**
    * 
    * @param {string} key A unique key.
    * @param {*} state Any object
    */
    setGlobalState (key, state) {
        this.#statesetglobal(key, state)
    }

    /**
     * 
     * @param {string} key A unique key.
     */
    getGlobalState (key) {
        return this.#stategetglobal(key)
    }


    /**
     * 
     * @param {BBPlugin} plugin 
     */
    addPlugin (plugin) {
        this.#addplugin(plugin)
    }

    start () {
        this.#start()
    }
}