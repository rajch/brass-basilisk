'use strict';

import Passage from './passage'
import { processHTML, processTwineLinks, addParagraphTags } from './transformers'

class Story {
    #addscanner
    #addtransformer
    #stateset
    #stateget
    #addplugin
    #getplugin
    #start


    constructor() {
        const storyElement = document.querySelector('tw-storydata')
        if (!storyElement) {
            return
        }

        const contentElement = document.querySelector('section.content')
        if (!contentElement) {
            return
        }

        const storyName = storyElement.getAttribute('name')
        const startNodePid = storyElement.getAttribute('startnode')
        const tags = storyElement.getAttribute('tags')?.split(' ')

        // Scan management
        // A scanner is a function which takes a single string, and returns
        // nothing. It is called when a new passage is about to be rendered
        // after successful navigation. Scanners are called in the order of
        // registration. They are usually implemented by Plugins.
        const scanners = []

        this.#addscanner = (scannerFunc) => {
            scanners.push(scannerFunc)
        }

        function scanPassageBody (body) {
            for (let i = 0; i < scanners.length; i++) {
                if (typeof scanners[i] === 'function') {
                    scanners[i](body)
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
            bodystr = processHTML(bodystr)

            // Run the in-build links transformer next
            bodystr = processTwineLinks(bodystr)

            // Run all registered transformers. In all
            // of them, the string should contain text
            // and unencoded HTML.
            for (let i = 0; i < transformers.length; i++) {
                if (typeof transformers[i] === 'function') {
                    bodystr = transformers[i](bodystr)
                }
            }

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

        // This is where a passage is rendered. Body can be scanned, for
        // taking any action. Scanning cannot change the text.
        // After scanning, body is transformed into HTML and rendered.
        // Finally, hyperlinks are connected to navigation. 
        function renderPassage (passage) {
            scanPassageBody(passage.body)

            contentElement.innerHTML = transformPassageBody(passage.body)

            contentElement.querySelectorAll('a[class="link"]')
                .forEach((element) => {
                    element.addEventListener('click', linkClickedToNavigate)
                })
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

        function navigateToPassage (name) {
            const passage = getPassageByName(name)
            if (passage) {
                renderPassage(passage)
            }
        }

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

        /// Navigation state
        let currentState = {}

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

        function finishNavigation () {
            manageNavigationButtons()

            const stackFrame = navStack[stackPosition]
            // console.log(`You have come to ${stackFrame.passageName}. The state is ${JSON.stringify(stackFrame)}`)
            // console.log(`The whole stack is ${JSON.stringify(navStack)}`)
            currentState = stackFrame.state
            navigateToPassage(stackFrame.passageName)
        }

        function navigateNew (passageName) {
            // If current position is not at end, and we are
            // pushing, then the elements after the current
            // position are no longer required.
            if (stackPosition < (navStack.length - 1)) {
                navStack.splice(stackPosition + 1)
            }

            // navigateNew is the only operation that can
            // push state on the stack
            navStack.push({
                passageName,
                state: structuredClone(currentState)
            })
            stackPosition = navStack.length - 1

            finishNavigation()
        }

        function navigateBack () {
            if (stackPosition > 0) {
                stackPosition--
            }

            finishNavigation()
        }

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

        // Plugin management
        const plugins = {}

        this.#addplugin = (pluginname, plugin) => {
            // Check for validity of plugin
            // TODO: Do this better
            if(typeof plugin?.init !== 'function') {
                throw new Error(`${pluginname} is not a valid plugin`)
            }

            plugins[pluginname] = plugin
            plugin.init(this)
        }

        this.#getplugin = (pluginname) => {
            return plugins[pluginname]
        }

        // Start
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

    addScanner (scannerFunc) {
        this.#addscanner(scannerFunc)
    }

    addTransformer (transformerFunc) {
        this.#addtransformer(transformerFunc)
    }

    addToolPanel () {
        return document.querySelector('div.diceboard')
    }

    addPlugin (pluginname, plugin) {
        this.#addplugin(pluginname, plugin)
    }

    getPlugin (pluginname) {
        return this.#getplugin(pluginname)
    }

    setCurrentState (key, value) {
        this.#stateset(key, value)
    }

    getCurrentState (key) {
        return this.#stateget(key)
    }

    start () {
        this.#start()
    }
}

export default Story;