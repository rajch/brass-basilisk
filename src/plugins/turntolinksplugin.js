'use strict'

import { BBPlugin } from "../core/plugin";

import "../core/types"

export class TurnToLinksPlugin extends BBPlugin {

    constructor() {
        super('turntolinks')
    }

    /**
     * 
     * @param {PlayerProxy} player 
     */
    init(player) {

        /**
         * 
         * @param {string} text 
         */
        const transformTurnTo = (text) => {
            return text.replaceAll(/(turn to )(\d{1,3})/ig, '[[$1 $2-&gt;$2]]')
        }

        player.addTransformer(transformTurnTo)
    }
}