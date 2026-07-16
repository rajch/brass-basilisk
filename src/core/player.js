'use strict'

import { BBPlugin } from "./plugin"

import './types'


export class Player {
    /** @type {(scannerfunc: ScannerFunc) => void} */
    #addscanner
    /** @type {(trasformerFunc: TransformerFunc) => void} */
    #addtransformer

    /** @type {Boolean} */
    #blocklinks = false
    /** @type {() => void} */
    #preventnavigation
    /** @type {() => void} */
    #allownavigation

    /** @type {(key: string, value: any) => void} */
    #stateset
    /** @type {(key: string) => any} */
    #stateget
    /** @type {(key: string, value: any) => void} */
    #statesetglobal
    /** @type {(key: string) => any} */
    #stategetglobal
    /** @type {(plugin: IPlugin) => void} */
    #addplugin
    /** @type {(pluginname: string) => IPlugin} */
    #getplugin
    /** @type {(slot: number) => boolean} */
    #savegame
    /** @type {(slot: number) => boolean} */
    #loadgame
    /** @type {(slot: number) => boolean} */
    #deletegame
    /** @type {() => SaveSlotInfo[]} */
    #getsaveslots
    /** @type {() => boolean} */
    #issaveavailable

    /** @type {() => void} */
    #start

    /**
     * 
     * @param {IStory} story 
     * @param {IView} view 
     */
    constructor(story, view) {
        if (!story) {
            throw new Error('please provide a story reader to the player')
        }

        if (!view) {
            throw new Error('please provide a view to the player')
        }

        const contentElement = view.content

        // Scan management
        // A scanner is a function which takes a passage object and returns
        // nothing. It is called when a new passage is about to be rendered
        // after successful navigation. Scanners are called in the order of
        // registration. They are implemented by BBScannerPlugins.

        /** @type {ScannerFunc[]} */
        const scanners = []

        const scanPassage = (/** @type {IPassage} */passage) => {
            for (let i = 0; i < scanners.length; i++) {
                if (typeof scanners[i] === 'function') {
                    scanners[i](passage)
                }
            }
        }

        this.#addscanner = (scannerFunc) => {
            scanners.push(scannerFunc)
        }

        // Transformation
        // A transformer is a function which takes a string and returns a
        // string. The assumption is that it will translate something in 
        // the input into unencoded HTML. There are a few in-built ones,
        // and more can be registered. Just as a passage is about to be
        // rendered, the passage body is piped through all transformers.
        // After the last one, a final sanitisation is done (TODO:), and 
        // the results are rendered.

        /** @type {TransformerFunc[]} */
        const transformers = []

        const transformPassageBody =
            /**
             * 
             * @param {string} body 
             * @returns {string}
             */
            (body) => {
                let bodystr = body

                // Run all registered transformers. In all
                // of them, the result should contain text
                // and unencoded HTML.

                // DEBUG: console.log('Transformation starts with:')
                // DEBUG: console.log(bodystr)

                for (let i = 0; i < transformers.length; i++) {
                    if (typeof transformers[i] === 'function') {
                        bodystr = transformers[i](bodystr)
                        // DEBUG: console.log('Transformed:')
                        // DEBUG: console.log(bodystr)
                    }
                }

                // Run the view-provided link transformer
                bodystr = view.transformLinks(bodystr)
                // DEBUG: console.log('Transformed:')
                // DEBUG: console.log(bodystr)

                // Run the view-provided paragraph transformer
                bodystr = view.transformParagraphs(bodystr)
                // DEBUG: console.log('Transformed:')
                // DEBUG: console.log(bodystr)

                return bodystr
            }

        this.#addtransformer = (transformerFunc) => {
            transformers.push(transformerFunc)
        }

        /// These methods can be called from plugins to prevent
        /// or allow navigation from a passage. Only navigation
        /// to new passages is prevented.
        this.#preventnavigation = () => {
            this.#blocklinks = true

            view.disableNavLinks()
        }

        this.#allownavigation = () => {
            this.#blocklinks = false

            view.enableNavLinks()
        }

        // This is where a passage is rendered. This is the final action
        // of any navigation step. The actions are as follows:
        // First, all registered scanners are called. They cannot change
        // the passage in any way. 
        // Next, the passage body text is piped through all registered 
        // transformers, in the process becoming unencoded HTML. As part
        // of this process, hyperlinks are also generated.
        // Finally, hyperlinks are connected to navigation. 
        const renderPassage =
            /**
             * 
             * @param {IPassage} passage 
             */
            (passage) => {
                // Default to "allowed" for every render. Scanners are the
                // only thing that can then block navigation again, based
                // on current state. This makes blocking a positive, always
                // re-derived fact about where the player currently is,
                // rather than something a plugin has to remember to undo --
                // which is what previously let a "player is dead" block
                // silently disappear on reload/back-forward/a loaded save,
                // once the plugin that first set it had already recorded
                // that it had "acted" and so didn't run that logic again.
                this.#allownavigation()

                scanPassage(passage)

                const passageBodyHTML = transformPassageBody(passage.body)
                const passageNameHTML = `<p class="passagename">${passage.name}</p>`

                contentElement.innerHTML = `${passageNameHTML}${passageBodyHTML}`

                view.attachNavLinksHandler(linkClickedToNavigate, this.#blocklinks)
            }

        // This connects the navigation, defined below, to passage rendering.
        // As the final task of any navigation step, this function is called.
        const navigateToPassage =
            /**
             * 
             * @param {string} name 
             */
            (name) => {
                const passage = story.getPassageByName(name)
                if (passage) {
                    renderPassage(passage)
                }
            }

        // Navigation
        /** @type {any[]} */
        const navStack = []
        let stackPosition = -1

        const clearAfterCurrent = () => {
            if (stackPosition < (navStack.length - 1)) {
                navStack.splice(stackPosition + 1)
            }
        }

        /// Navigation UI
        const backButton = view.backButton
        const forwardButton = view.forwardButton
        const restartButton = view.restartButton

        const manageNavigationButtons = () => {
            // Back button
            if (stackPosition > 0) {
                view.enable(backButton)
            } else {
                view.disable(backButton)
            }
            // Forward button
            if (stackPosition === (navStack.length - 1)) {
                view.disable(forwardButton)
            } else {
                view.enable(forwardButton)
            }
        }

        /// Navigation state management

        /** @type {Record<string,any>} */
        let currentState = {}
        /** @type {Record<string,any>} */
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
        const finishNavigation = () => {
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
        const navigateNew = (/** @type {string} */ passageName) => {
            // Moving to a "new" passage means, any navigation  after
            // the current position is no longer required. 
            clearAfterCurrent()

            // This is the only operation that can push state on  the
            // navigation stack. All others restore from it.
            // Note: this is a shallow copy, not a deep clone. 
            // Callers of setCurrentState are expected to treat the 
            // values they store as immutable (clone before mutating 
            // in place) so that old stack frames can safely keep 
            // sharing references to them.
            navStack.push({
                passageName,
                //state: structuredClone(currentState)
                state: { ...currentState }
            })
            stackPosition = navStack.length - 1

            finishNavigation()
        }

        /// This gets called when the "back" button is clicked in the
        /// UI. It goes back one step in the navigation stack, if not
        /// already at the beginning, and restores the current state
        /// from what was saved on the stack. 
        const navigateBack = () => {
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
        const navigateForward = () => {
            if (stackPosition < (navStack.length - 1)) {
                stackPosition++
            }

            finishNavigation()
        }

        const restartNavigation = () => {
            navStack.splice(0)
            stackPosition = -1
            currentState = {}
            globalState = {}

            const passage = story.getStartPassage()
            if (!passage) {
                throw new Error('start passage not set')
            }

            navigateNew(passage.name)
        }

        /// This can be attached to link click events
        function linkClickedToNavigate(/** @type {Event} */ e) {
            const linkElement = /** @type {HTMLElement} */ (e.target)
            const destPassageName = linkElement.getAttribute('data-destination')
            if (destPassageName) {
                navigateNew(destPassageName)
            }
        }

        /// Save / restore
        ///
        /// Everything that defines "where the player is" lives in
        /// navStack, stackPosition and globalState -- all plain,
        /// JSON-serialisable data (see the contract noted above navStack
        /// .push). Saving is just snapshotting those three things;
        /// loading is just replacing them and re-running the same
        /// finishNavigation() step that back/forward/restart already
        /// use to redraw the current passage and let plugins rebuild
        /// their UI from state.
        // Bumped from 1 to 2 with the addition of storyIfid below --
        // a deliberate clean cutover rather than a migration, since
        // the feature is brand new. Any v1 saves are simply refused.
        const SAVE_SCHEMA_VERSION = 2
        const SAVE_SLOT_COUNT = 3
        const SAVE_KEY_PREFIX = 'bb-save'

        // Prefer the story's ifid for identity: it's a GUID Twine
        // assigns once when a story is created and never changes, so
        // saves survive the story being renamed or re-exported. Only
        // falls back to name for hand-authored/non-Twine tw-storydata
        // that has no ifid at all.
        const storyIdentityFragment = story.ifid ?? story.name ?? 'untitled'

        // Turns the story identity into something safe to use in a
        // localStorage key, so two different stories hosted under the
        // same origin never collide.
        const storyKeyFragment = storyIdentityFragment
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-+|-+$)/g, '') || 'untitled'

        const saveStorageKey = (/** @type {number} */slot) => `${SAVE_KEY_PREFIX}:${storyKeyFragment}:${slot}`

        // localStorage can throw (privacy mode, sandboxed iframes, some
        // file:// setups) even just on access, not only when full. This
        // checks once whether it's safe to use at all.
        const storageIsAvailable = () => {
            const testKey = '__bb_storage_test__'
            try {
                window.localStorage.setItem(testKey, '1')
                window.localStorage.removeItem(testKey)
                return true
            } catch (e) {
                return false
            }
        }

        this.#issaveavailable = () => storageIsAvailable()

        this.#savegame = (slot) => {
            if (slot < 0 || slot >= SAVE_SLOT_COUNT) {
                return false
            }

            const data = {
                schemaVersion: SAVE_SCHEMA_VERSION,
                storyName: story.name,
                storyIfid: story.ifid,
                savedAt: new Date().toISOString(),
                passageName: navStack[stackPosition]?.passageName,
                stackPosition,
                navStack,
                globalState
            }

            try {
                window.localStorage.setItem(saveStorageKey(slot), JSON.stringify(data))
                return true
            } catch (e) {
                console.log(`Could not save to slot ${slot}: ${e}`)
                return false
            }
        }

        this.#loadgame = (slot) => {
            if (slot < 0 || slot >= SAVE_SLOT_COUNT) {
                return false
            }

            let raw
            try {
                raw = window.localStorage.getItem(saveStorageKey(slot))
            } catch (e) {
                console.log(`Could not read slot ${slot}: ${e}`)
                return false
            }

            if (!raw) {
                return false
            }

            let data
            try {
                data = JSON.parse(raw)
            } catch (e) {
                console.log(`Save in slot ${slot} is corrupt and could not be read: ${e}`)
                return false
            }

            // A save only makes sense against the story it was made
            // from. A mismatch here (different story, or a save made
            // by a future/older version of this format) is refused
            // rather than partially applied. Prefer comparing ifid
            // when both sides have one -- it's stable across renames,
            // where name isn't -- and fall back to name otherwise.
            if (data.schemaVersion !== SAVE_SCHEMA_VERSION) {
                console.log(`Save in slot ${slot} was made by an incompatible version and was not loaded`)
                return false
            }

            const identityMatches = story.ifid && data.storyIfid
                ? data.storyIfid === story.ifid
                : data.storyName === story.name

            if (!identityMatches) {
                console.log(`Save in slot ${slot} does not match this story and was not loaded`)
                return false
            }

            const restoredFrame = data.navStack?.[data.stackPosition]
            if (!restoredFrame || !story.getPassageByName(restoredFrame.passageName)) {
                console.log(`Save in slot ${slot} points at a passage that no longer exists and was not loaded`)
                return false
            }

            navStack.splice(0, navStack.length, ...data.navStack)
            stackPosition = data.stackPosition
            globalState = data.globalState ?? {}

            // A save always resumes as a normal, navigable passage. If
            // navigation had been blocked (e.g. a defeat screen) at the
            // moment of saving, that's re-derived from state as usual
            // when finishNavigation() re-scans the passage below.
            this.#allownavigation()

            finishNavigation()
            return true
        }

        this.#deletegame = (slot) => {
            if (slot < 0 || slot >= SAVE_SLOT_COUNT) {
                return false
            }

            try {
                window.localStorage.removeItem(saveStorageKey(slot))
            } catch (e) {
                console.log(`Could not delete slot ${slot}: ${e}`)
                return false
            }

            return true
        }

        this.#getsaveslots = () => {
            const slots = []

            for (let slot = 0; slot < SAVE_SLOT_COUNT; slot++) {
                let raw
                try {
                    raw = window.localStorage.getItem(saveStorageKey(slot))
                } catch (e) {
                    slots.push({ slot, empty: true })
                    continue
                }

                if (!raw) {
                    slots.push({ slot, empty: true })
                    continue
                }

                try {
                    const data = JSON.parse(raw)
                    slots.push({
                        slot,
                        empty: false,
                        passageName: data.passageName,
                        savedAt: data.savedAt
                    })
                } catch (e) {
                    slots.push({ slot, empty: true })
                }
            }

            return slots
        }

        // Plugin Management

        /** @type {Record<string,IPlugin>} */
        const plugins = {}

        this.#getplugin = (pluginname) => {
            return plugins[pluginname]
        }

        this.#addplugin = (plugin) => {
            // Check for validity of plugin
            if (!(plugin instanceof BBPlugin)) {
                throw new Error(`${plugin.name ?? "That"} is not a valid plugin`)
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
                allowNavigation: this.#allownavigation,
                saveGame: this.#savegame,
                loadGame: this.#loadgame,
                deleteGame: this.#deletegame,
                getSaveSlots: this.#getsaveslots,
                isSaveAvailable: this.#issaveavailable,
                view: view
            })
        }

        // Start playing
        this.#start = function () {
            // Set up story styles
            // NOTE: We are no longer processing story styles or javascript in Brass Basilisk.
            //       If and when we do, it will be the responsibility of an IStory to extract
            //       the styles, and an IView to render/use them. The following code is kept
            //       commented here to remind us how it used to be done.
            //
            // const storyStyleElement = storyElement.querySelector('style')?.cloneNode(true)
            // storyStyleElement.removeAttribute('role')
            // storyStyleElement.removeAttribute('type')
            // if (storyStyleElement) {
            //     const styleElement = document.querySelector('head style')
            //     if (styleElement) {
            //         styleElement.insertAdjacentElement('afterend', storyStyleElement)
            //     }
            // }

            // Show the title
            view.title = story.name

            // Hook up forward, backward and restart buttons
            backButton?.addEventListener('click', navigateBack)
            forwardButton?.addEventListener('click', navigateForward)
            restartButton?.addEventListener('click', restartNavigation)

            // Navigate to first passage
            restartNavigation()
        }
    }

    /**
     * Add a plugin to the player. The order of adding is important.
     * @param {BBPlugin} plugin 
     */
    addPlugin(plugin) {
        this.#addplugin(plugin)
    }

    /**
     * Start playing the story.
     */
    start() {
        this.#start()
    }

    /**
     * Save the current game into the given slot (0-based). Overwrites
     * whatever was previously in that slot.
     *
     * @param {Number} slot
     * @returns {Boolean} true if the save succeeded
     */
    saveGame(slot) {
        return this.#savegame(slot)
    }

    /**
     * Load a game previously saved into the given slot (0-based). If
     * the slot is empty, corrupt, or doesn't match the current story,
     * this does nothing and returns false; the current game continues
     * unaffected.
     *
     * @param {Number} slot
     * @returns {Boolean} true if the load succeeded
     */
    loadGame(slot) {
        return this.#loadgame(slot)
    }

    /**
     * Delete a game previously saved into the given slot (0-based). If
     * the slot is empty, this does nothing and returns false.
     *
     * @param {Number} slot
     * @returns {Boolean} true if the delete succeeded
     */
    deleteGame(slot) {
        return this.#deletegame(slot)
    }

    /**
     * @returns {SaveSlotInfo[]} one entry per save slot, in order
     */
    getSaveSlots() {
        return this.#getsaveslots()
    }

    /**
     * @returns {Boolean} whether save/load can be used at all in this
     * browser environment
     */
    isSaveAvailable() {
        return this.#issaveavailable()
    }
}