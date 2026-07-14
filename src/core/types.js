'use strict'

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
 * @returns {Passage}
 */

/**
 * @callback FuncStringPassage
 * @param {string} passageName
 * @returns {Passage}
 */

/**
 * @callback ScannerFunc
 * @param {Passage} passage
 * @returns {void}
 */

/**
 * @callback TransformerFunc
 * @param {string} text
 * @returns {string}
 */

/**
 * @typedef Story
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
 * @typedef {Object} View
 * @property {string} title
 * @property {HTMLElement} content
 * @property {FuncStringVoid} setContent
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
 * @property {(name: string) => HTMLDivElement} getToolPanel
 * @property {(name: string) => HTMLDialogElement} getDialog
 */

/**
 * @typedef {Object} CombatRule
 * @property {number} rangeLow
 * @property {number} rangeHigh
 * @property {string} action
 * @property {number} turnAmount
 */

/**
 * @typedef {Object} Combat
 * @property {string} foe
 * @property {number} foeVigour
 * @property {number} numberOfDice
 * @property {CombatRule[]} rules
 * @property {boolean} flee
 * @property {string|null} fleeTo
 */


/**
 * @callback AddTransformerFunction
 * @param {TransformerFunc} f
 */

/**
 * @typedef {Object} SaveSlotInfo
 * @property {Number} slot
 * @property {Boolean} empty
 * @property {string} [passageName]
 * @property {string} [savedAt] ISO timestamp
 */

/**
 * @typedef {Object} PlayerProxy
 * @property {Function} addScanner
 * @property {AddTransformerFunction} addTransformer
 * @property {Function} addPlugin
 * @property {Function} getPlugin
 * @property {Function} setCurrentState
 * @property {Function} getCurrentState
 * @property {Function} setGlobalState
 * @property {Function} getGlobalState
 * @property {Function} preventNavigation
 * @property {Function} allowNavigation
 * @property {(slot: number) => boolean} saveGame
 * @property {(slot: number) => boolean} loadGame
 * @property {(slot: number) => boolean} deleteGame
 * @property {() => SaveSlotInfo[]} getSaveSlots
 * @property {() => boolean} isSaveAvailable
 * @property {View} view
 */

/**
 * @typedef {Object} CharacterSheet
 * @property {string} name
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
 * @property {Number} rangeStart
 * @property {Number} rangeEnd
 * @property {string} rangeOperator
 * @property {string} sentence
 * @property {string} destination
 */

/**
 * @typedef {Object} StatCheckRoll
 * @property {Number} numDice
 * @property {string} operator  Can be < or <=
 * @property {string} stat  Can be PSI or AGILITY
 * @property {Number} successGoTo
 * @property {Number} failGoTo
 */