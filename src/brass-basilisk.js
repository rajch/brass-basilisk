'use strict'

import DiceBoard from "./diceboard"
import Story from "./story"


const story = new Story()
story.addPlugin('diceboard', new DiceBoard())

story?.start()
