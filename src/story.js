'use strict';

import DiceBoard from './diceboard'
import Passage from './passage'

class Story {
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
        // nothing.
        const scanners = []

        function scanPassageBody (body) {
            for (let i = 0; i < scanners.length; i++) {
                if (typeof scanners[i] === 'function') {
                    scanners[i](body)
                }
            }
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
        const backButton = document.getElementById('backButton')
        const forwardButton = document.getElementById('forwardButton')
        const restartButton = document.getElementById('restartButton')

        function linkClickedToNavigate (e) {
            const linkElement = e.target
            const destPassageName = linkElement.getAttribute('data-destination')
            if (destPassageName) {
                navigateNew(destPassageName)
            }
        }

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

        function navigateNew (passageName) {
            // If current position is not at end, and we are
            // pushing, then the elements after the current
            // position are no longer required.
            if (stackPosition < (navStack.length - 1)) {
                navStack.splice(stackPosition + 1)
            }

            navStack.push(passageName)
            stackPosition = navStack.length - 1

            manageNavigationButtons()
            navigateToPassage(passageName)
        }

        function navigateBack () {
            if (stackPosition > 0) {
                stackPosition--
            }

            manageNavigationButtons()
            navigateToPassage(navStack[stackPosition])
        }

        function navigateForward () {
            if (stackPosition < (navStack.length - 1)) {
                stackPosition++
            }

            manageNavigationButtons()
            navigateToPassage(navStack[stackPosition])
        }

        function restartNavigation () {
            navStack.splice(0)
            stackPosition = -1

            const passageElement = storyElement?.querySelector(`tw-passagedata[pid="${startNodePid}"]`)
            if (!passageElement) {
                return
            }
            const passage = Passage.FromElement(passageElement)
            if (passage?.name) {
                navigateNew(passage.name)
            }
        }

        // Dice
        const diceBoardElement = document.querySelector('div.diceboard')
        const diceBoard = new DiceBoard(diceBoardElement)
        scanners.push(diceBoard.Scan)

        // Start
        this.Start = function () {
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
}

// Passage to HTML transformation
const transformPassageBody = (body) => {
    // Process HTML in passage body
    let bodystr = processHTML(body)

    // Process links
    bodystr = processTwineLinks(bodystr)

    // Add paragraph tags
    bodystr = addParagraphTags(bodystr)

    return bodystr
}

const processHTML = (input) => {
    // The following will decode HTML-encoded content
    const element = document.createElement('div');
    element.innerHTML = input;
    // TODO: strip unwated tags here
    return element.textContent;
}

const processTwineLinks = (input) => {
    return input
        .replaceAll(/\[\[(.*?)-(>|&gt;)(.*?)\]\]/g, '<a class="link" data-destination="$3">$1</a>')
        .replaceAll(/\[\[(.*?)(<|&lt;)-(.*?)\]\]/g, '<a class="link" data-destination="$1">$3</a>')
        .replaceAll(/\[\[(.*?)\]\]/g, '<a class="link" data-destination="$1">$1</a>')
}

const addParagraphTags = (input) => {
    return input
        .split(/\r?\n|\r|\n/g)
        .map((row) => `<p>${row}</p>`)
        .join('');
}

export default Story;