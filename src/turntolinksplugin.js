'use strict'

import { BBPlugin } from "./plugin";

export class TurnToLinksPlugin extends BBPlugin {

    constructor() {
        super('turntolinks')
    }

    /**
     * 
     * @param {import("./plugin").PlayerProxy} player 
     */
    init(player) {

        /**
         * 
         * @param {string} text 
         */
        const transformTurnTo = (text) => {
            return text.replaceAll(/([Tt]urn to )(\d{1,3})/g, '[[$1 $2-&gt;$2]]')
        }

        player.addTransformer(transformTurnTo)
    }
}