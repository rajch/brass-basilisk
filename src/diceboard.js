'use strict'

class DiceBoard {
    constructor(element) {
        const buttonsArea = element.querySelector('div.buttonsarea')
        const rollArea = element.querySelector('div.rollarea')
//         const dieTemplate = `
// <div class="dice dice-{{n}}">
//     <div class="side one">1</div>
//     <div class="side two">2</div>
//     <div class="side three">3</div>
//     <div class="side four">4</div>
//     <div class="side five">5</div>
//     <div class="side six">6</div>
// </div>`
        const dieTemplate = `
<div class="dice dice-{{n}}">
    <div class="side one">
    <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="10" fill="black" />
    </svg>
    </div>
    <div class="side two">
    <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="25" r="10" fill="black" />
        <circle cx="50" cy="75" r="10" fill="black" />
    </svg>    
    </div>
    <div class="side three">
    <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="25" r="10" fill="black" />
        <circle cx="50" cy="50" r="10" fill="black" />
        <circle cx="50" cy="75" r="10" fill="black" />
    </svg>    
    </div>
    <div class="side four">
    <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="25" cy="25" r="10" fill="black" />
        <circle cx="75" cy="25" r="10" fill="black" />
        <circle cx="25" cy="75" r="10" fill="black" />
        <circle cx="75" cy="75" r="10" fill="black" />
    </svg>
    </div>
    <div class="side five">
    <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="25" cy="25" r="10" fill="black" />
        <circle cx="75" cy="25" r="10" fill="black" />
        <circle cx="50" cy="50" r="10" fill="black" />
        <circle cx="25" cy="75" r="10" fill="black" />
        <circle cx="75" cy="75" r="10" fill="black" />
    </svg>    
    </div>
    <div class="side six">
    <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="25" cy="25" r="10" fill="black" />
        <circle cx="75" cy="25" r="10" fill="black" />
        <circle cx="25" cy="50" r="10" fill="black" />
        <circle cx="75" cy="50" r="10" fill="black" />
        <circle cx="25" cy="75" r="10" fill="black" />
        <circle cx="75" cy="75" r="10" fill="black" />
    </svg>    
    </div>
</div>`

        const diceRotationMap = {
            1: 'rotateX(0deg) rotateY(0deg)',
            2: 'rotateX(0deg) rotateY(-90deg)',
            3: 'rotateX(180deg) rotateY(0deg)',
            4: 'rotateX(0deg) rotateY(90deg)',
            5: 'rotateX(-90deg) rotateY(0deg)',
            6: 'rotateX(90deg) rotateY(0deg)'
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

            if (rollResultLabel) {
                const resultsStr = results.reduce((finalValue, currentValue) => {
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
            rollButton.type = 'button'
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
            let match = passageBody.match(phrase1)

            if (!match) {
                const phrase2 = /[Tt]hrow\s{1}(\S*?)\s{1}di(c{0,1})e/
                match = passageBody.match(phrase2)
            }

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
}

export default DiceBoard;