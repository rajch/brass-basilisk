'use strict'

import { ChanceRollPlugin } from "./plugins/chancerollplugin"
import { CharacterSheetPlugin } from "./plugins/charactersheetplugin"
import { CombatPlugin } from "./plugins/combatplugin"
import { DefaultView } from "./defaultview"
import { DiceBoardPlugin } from "./plugins/diceboardplugin"
import { DefaultStory } from "./defaultstory"
import { Player } from "./core/player"
import { TurnToLinksPlugin } from "./plugins/turntolinksplugin"
import { AttributePhrasePlugin } from "./plugins/attributephraseplugin"


try {
    const player = new Player(new DefaultStory, new DefaultView)


    player.addPlugin(new DiceBoardPlugin)

    player.addPlugin(new CharacterSheetPlugin)

    player.addPlugin(new CombatPlugin)

    player.addPlugin(new ChanceRollPlugin)

    player.addPlugin(new AttributePhrasePlugin)

    player.addPlugin(new TurnToLinksPlugin)

    player.start()
} catch (e) {
    document.body.innerHTML = ''

    const errorScreen = document.createElement('div')
    errorScreen.style.display = 'flex'
    errorScreen.style.flexDirection = 'row'
    errorScreen.style.width = '100vw'
    errorScreen.style.height = '100vh'
    errorScreen.style.backgroundColor = 'blue'
    errorScreen.style.color = 'white'
    errorScreen.style.flexWrap = 'wrap'
    errorScreen.style.alignContent = 'center'

    const errorText = document.createElement('div')
    errorText.style.width = '100%'
    errorText.style.textAlign = 'center'
    errorText.textContent = e

    errorScreen.appendChild(errorText)
    document.body.appendChild(errorScreen)

    throw e
}