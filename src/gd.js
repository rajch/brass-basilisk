'use strict'

function Story () {
    if (!this) {
        return new Story()
    }

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

    // Passage management
    function getPassageByName (name) {
        const passageElement = storyElement?.querySelector(`tw-passagedata[name="${name}"]`)
        if (!passageElement) {
            return
        }

        return getPassageFromElement(passageElement)
    }

    function renderPassage (passage) {
        contentElement.innerHTML = transformPassageBody(passage.body)

        contentElement.querySelectorAll('a[class="link"]')
            .forEach((element) => {
                element.addEventListener('click', linkClickedToNavigate)
            });
    }

    // Navigation
    const navStack = []
    let stackPosition = -1
    const backButton = document.getElementById('backButton')
    const forwardButton = document.getElementById('forwardButton')
    const restartButton = document.getElementById('restartButton')

    function linkClickedToNavigate (e) {
        const linkElement = e.target;
        const destPassageName = linkElement.getAttribute('data-destination');
        if (destPassageName) {
            navigateNew(destPassageName);
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
        const passage = getPassageFromElement(passageElement)
        if (passage?.name) {
            navigateNew(passage.name)
        }
    }

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

function Passage (id, name, body) {
    if (!this) {
        return new Passage(id, name, body)
    }

    this.pid = id
    this.name = name
    this.body = body
}

const getPassageFromElement = (passageElement) => {
    const pid = passageElement.getAttribute('pid')
    const name = passageElement.getAttribute('name')
    const body = passageElement.innerHTML

    return new Passage(pid, name, body)
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
        .split('\n')
        .map((row) => `<p>${row}</p>`)
        .join('')
}

// FINALLY, start the story
const story = new Story()
story?.Start()
