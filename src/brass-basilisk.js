'use strict'

import { ChanceRollPlugin } from "./chancerollplugin"
import { CharacterSheetPlugin } from "./charactersheetplugin"
import { CombatPlugin } from "./combatplugin"
import { DiceBoardPlugin } from "./diceboardplugin"
import Player from "./player"

const player = new Player


player.addPlugin(new DiceBoardPlugin)

player.addPlugin(new ChanceRollPlugin)

player.addPlugin(new CharacterSheetPlugin)

player.addPlugin(new CombatPlugin)

player.start()