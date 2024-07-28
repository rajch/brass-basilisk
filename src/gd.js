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

        return getPassageFromElement(passageElement)
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

// Dice
function DiceBoard (element) {
    if (!this) {
        return new DiceBoard(element)
    }

    const buttonsArea = element.querySelector('div.buttonsarea')
    const rollArea = element.querySelector('div.rollarea')
    const dieTemplate = `
<div class="dice dice-{{n}}">
    <div class="side one">1</div>
    <div class="side two">2</div>
    <div class="side three">3</div>
    <div class="side four">4</div>
    <div class="side five">5</div>
    <div class="side six">6</div>
</div>`

    const diceRotationMap = {
        1: 'rotateX(0deg) rotateY(0deg)',
        2: 'rotateX(-90deg) rotateY(0deg)',
        3: 'rotateX(0deg) rotateY(90deg)',
        4: 'rotateX(0deg) rotateY(-90deg)',
        5: 'rotateX(90deg) rotateY(0deg)',
        6: 'rotateX(180deg) rotateY(0deg)'
    }

    /**
     * @param {number} number - Number of dice
     * @param {HTMLLabelElement} rollResultLabel - label to show result
     */
    function rollDice (number, rollResultLabel) {
        const results = []
        let totalresults = 0
        for (let i = 0; i < number; i++) {
            const result = Math.floor(Math.random() * 6) + 1
            results.push(result)
            totalresults += result

            const dice = rollArea.querySelector(`div.dice-${i}`)
            dice.style.transform = diceRotationMap[result]
        }

        if(rollResultLabel) {
            const resultsStr = results.reduce((finalValue,currentValue) =>{
                finalValue = finalValue ? finalValue + "+" + currentValue : "" + currentValue
                return finalValue
            })
            rollResultLabel.innerText = `Your score is ${resultsStr} = ${totalresults}.`
        }
    }

    function addDice (number) {
        let dieStr = ''
        for (let i = 0; i < number; i++) {
            dieStr = dieStr + dieTemplate.replace('{{n}}', i)
        }
        const templ = document.createElement('template')
        templ.innerHTML = dieStr
        const result = templ.content.children

        rollArea.append(...result)

        const rollButton = document.createElement('button')
        rollButton.classList.add('dicerollbutton')
        rollButton.innerText = 'Roll'

        const rollResultLabel = document.createElement('label')

        rollButton.addEventListener('click', (e) => {
            rollDice(number, rollResultLabel)
        })

        buttonsArea.append(rollButton, rollResultLabel)
    }

    function clear () {
        rollArea.innerHTML = ''
        buttonsArea.innerHTML = ''
    }

    function hide () {
        clear()
        
        element.classList.add('hidden')
    }

    function show (numDice, oldRolls) {
        clear()

        addDice(numDice)
        element.classList.remove('hidden')
    }

    this.Show = (numDice, oldRolls) => {
        show(numDice, oldRolls)
    }

    const matchMap = {
        "2": 2,
        "two": 2,
        "3": 3,
        "three": 3,
        "some": 3
    }
    /***
     * @param {String} passageBody
     */
    this.Scan = (passageBody) => {
        const phrase1 = /[Rr]oll\s{1}(\S*?)\s{1}di(c{0,1})e/
        const match = passageBody.match(phrase1)

        if (match) {
            const numdice = match[1].trim().toLowerCase()
            const lookup = matchMap[numdice]
            let finalNum = lookup ?? 1
            show(finalNum)
        } else {
            hide()
        }
    }

    hide()
}


// FINALLY, start the story
const story = new Story()
story?.Start()
