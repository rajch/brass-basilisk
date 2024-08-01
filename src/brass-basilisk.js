'use strict'

import { ChanceRollPlugin } from "./chancerollplugin"
import { DiceBoardPlugin } from "./diceboardplugin"
import Player from "./player"

const player = new Player


player.addPlugin(new DiceBoardPlugin)

player.addPlugin(new ChanceRollPlugin)

player.start()