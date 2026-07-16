'use strict'

/**
 * @typedef {Object} IPassage
 * @property {string} pid
 * @property {string} name
 * @property {string} body
 */

/**
 * @callback FuncVoidString
 * @returns {string}
 */

/**
 * @callback FuncStringVoid
 * @param {string} text
 * @returns {void}
 */

/**
 * @callback FuncHTMLElementVoid
 * @param {HTMLElement} element
 * @returns {void}
 */

/**
 * @callback FuncVoidPassage
 * @returns {IPassage}
 */

/**
 * @callback FuncStringPassage
 * @param {string} passageName
 * @returns {IPassage}
 */

/**
 * @callback ScannerFunc
 * @param {IPassage} passage
 * @returns {void}
 */

/**
 * @callback TransformerFunc
 * @param {string} text
 * @returns {string}
 */

/**
 * @typedef IStory
 * @property {string} name
 * @property {string} [ifid] a stable GUID assigned by Twine when the story was created;
 * absent on hand-authored/non-Twine-published tw-storydata
 * @property {FuncStringPassage} getPassageByName
 * @property {FuncVoidPassage} getStartPassage
 */

/**
 * @callback EventFunc
 * @param {Event} e
 * @returns {void}
 */

/**
 * @callback AttachHandlerFunc
 * @param {EventFunc} handler A click handler function
 * @param {boolean} blockLinks Whether blockable links should be set to blocked
 * @returns {void}
 */

/**
 * @callback FuncStringHTMLElement
 * @param {string} name
 * @returns {HTMLElement}
 */

/**
 * @callback FuncStringHTMLDivElement
 * @param {string} name
 * @returns {HTMLDivElement}
 */

/**
 * @callback FuncStringHTMLDialogElement
 * @param {string} name
 * @returns {HTMLDialogElement}
 */

/**
 * @typedef {Object} IView
 * @property {string} title
 * @property {HTMLElement} content
 * @property {FuncHTMLElementVoid} hide
 * @property {FuncHTMLElementVoid} show
 * @property {FuncHTMLElementVoid} disable
 * @property {FuncHTMLElementVoid} enable
 * @property {FuncStringVoid} hideSelectedContent
 * @property {HTMLButtonElement} backButton
 * @property {HTMLButtonElement} forwardButton
 * @property {HTMLButtonElement} restartButton
 * @property {HTMLButtonElement} saveLoadButton
 * @property {Function} disableNavLinks
 * @property {Function} enableNavLinks
 * @property {AttachHandlerFunc} attachNavLinksHandler
 * @property {TransformerFunc} transformLinks
 * @property {TransformerFunc} transformParagraphs
 * @property {FuncStringHTMLDivElement} getToolPanel
 * @property {FuncStringHTMLDialogElement} getDialog
 */

/**
 * @typedef {Object} IPlugin
 * @property {string} name
 * @property {PlayerProxy} player
 * @property {(player: PlayerProxy) => void} init
 */

/**
 * @typedef {Object} CombatRule
 * @property {number} rangeLow
 * @property {number} rangeHigh
 * @property {string} action
 * @property {number} turnAmount
 */

/**
 * @typedef {Object} CombatDestinations
 * @property {string} fleeTo
 * @property {string} loseGoTo
 * @property {string} winGoTo
 */

/**
 * @typedef {Object} Combat
 * @property {string} foe
 * @property {number} foeVigour
 * @property {string} numberOfDice
 * @property {CombatRule[]} rules
 * @property {CombatDestinations} destinations
 * @property {string} lastParagragh
 */


/**
 * @callback AddTransformerFunction
 * @param {TransformerFunc} f
 */

/**
 * @typedef {Object} SaveSlotInfo
 * @property {number} slot
 * @property {boolean} empty
 * @property {string} [passageName]
 * @property {string} [savedAt] ISO timestamp
 */


/**
 * @typedef {Object} PlayerProxy
 * @property {(scannerfunc: ScannerFunc) => void} addScanner
 * @property {(trasformerFunc: TransformerFunc) => void} addTransformer
 * @property {(plugin: IPlugin) => void} addPlugin
 * @property {(pluginname: string) => IPlugin} getPlugin
 * @property {(key: string, value: any) => void} setCurrentState
 * @property {(key: string) => any} getCurrentState
 * @property {(key: string, value: any) => void} setGlobalState
 * @property {(key: string) => any} getGlobalState
 * @property {() => void} preventNavigation
 * @property {() => void} allowNavigation
 * @property {(slot: number) => boolean} saveGame
 * @property {(slot: number) => boolean} loadGame
 * @property {(slot: number) => boolean} deleteGame
 * @property {() => SaveSlotInfo[]} getSaveSlots
 * @property {() => boolean} isSaveAvailable
 * @property {IView} view
 */

/**
 * @typedef {Object} CharacterSheet
 * @property {Number} vigour
 * @property {Number} agility
 * @property {Number} psi
 */

/** 
 * @callback Action
 * @param {RegExpMatchArray} matches
 * @returns {boolean}
 */

/**
 * @typedef {Object} PhraseAction
 * @property {string} name
 * @property {string} phraseRegExp
 * @property {Action} action 
 * */

/**
 * @typedef {Object} ChanceAction
 * @property {number} rangeStart
 * @property {number} rangeEnd
 * @property {string} rangeOperator
 * @property {string} sentence
 * @property {string} destination
 */

/**
 * @typedef {Object} ChanceRoll
 * @property {string} numDice
 * @property {ChanceAction[]} actions
 * @property {string} restOfParagraph
 */

/**
 * @typedef {Object} StatCheckRoll
 * @property {string} numDice
 * @property {string} operator  Can be < or <=
 * @property {"agility" | "psi"} stat  Can be AGILITY or PSI
 * @property {string} successGoTo
 * @property {string} failGoTo
 */

/**
 * @typedef {Object} DiceRollEventDetail
 * @property {number} total The sum total of the results
 * @property {number[]} rolls An array containing the individual die results
 */