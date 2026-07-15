# A Guide to Brass Basilisk

## Introduction

Welcome to **Brass Basilisk**, a specialized story format for [Twine/Twee](https://twinery.org/). This format is designed specifically to let you easily create and play interactive adventures resembling the classic [Golden Dragon Fantasy Gamebooks](https://gamebooks.org/Series/14).

In these stories, the reader *is* the hero. Each adventure takes the player through a branching narrative peppered with tactical decisions, pure chance, and deadly combat—all governed by simulated dice rolls. 

One of the core design goals of Brass Basilisk is **zero special markup or code**. You write your stories entirely in plain text. The engine automatically detects mechanics like dice rolls, stat changes, and combat by listening for specific linguistic patterns in your prose. 

While stories are traditionally written in the second person ("You open the door..."), this is a stylistic choice rather than a strict engine rule.

## Game Mechanics

Stories are composed using standard Twine/Twee passages. A player's progress and physical state are tracked using three core statistics:

* **VIGOUR**: Represents physical strength, fitness, and the general will to survive. If VIGOUR drops to 0, the player dies and the game is over.
* **PSI**: Represents psychic sensitivity and willpower.
* **AGILITY**: Represents nimbleness, speed, and manual dexterity.

### Character Generation & Progression
Stat scores are determined at the very beginning of a game via automated dice rolls:
* **Starting VIGOUR**: Rolled using $2d6 + 20$ (resulting in a range of 22–32).
* **Starting PSI & AGILITY**: Rolled using $1d6 + 3$ (resulting in a range of 4–9).

As the story progresses, these scores dictate the player's fate. VIGOUR acts as your health pool during combat, while PSI and AGILITY checks are used to bypass traps or unlock hidden narrative paths.

## Authoring Stories

You can author Brass Basilisk stories using the official Twine desktop/browser tool, or via any standard text editor using the Twee format. 

Because the engine relies entirely on natural language processing to trigger mechanics, **you must follow the formatting rules strictly.** If a wording pattern is slightly off, the engine will not throw an error or warning; it will simply render your phrase as plain text, quietly skipping the fight, roll, or stat change you intended to trigger.

> ⚠️ **The Golden Rule:** Copy the language patterns detailed below exactly. Unless explicitly stated otherwise, assume capitalization, spacing, and punctuation are rigid.

### Passage Naming
Passage names must be **positive integers ranging from 1 to 999**. 

You can create passages with non-numeric names, but the engine's automated mechanics (like attribute checks and combat rewards) will not be able to target them. 
* **The Exception:** Your story should begin with a passage named `BACKGROUND` to introduce the setting. This passage must end with the exact phrase: `Turn to 1.`

### Connecting Passages
Passages are primarily connected using standard Twine links. If you write the phrase `"turn to PAGE"` (where PAGE is a number between 1 and 999) anywhere in your text, the engine will automatically convert it into a functional link. This pattern is case-insensitive (`TURN TO 10`, `turn to 10`, and `Turn to 10` all work).

For advanced linking, Brass Basilisk supports four explicit bracket forms:

| Syntax | Result |
| :--- | :--- |
| `[[Text->Target]]` | A standard link displaying "Text", pointing to passage "Target". |
| `[[Text\|Target]]` | Identical to the arrow syntax, using a pipe character. |
| `[[Target]]` | A standard link using the passage name as the clickable text. |
| `[[Target<-Text]]` | An **unblockable** link displaying "Text", pointing to "Target". |

#### Navigation Blocking
In certain scenarios—such as when combat is initiated or when a player's VIGOUR hits 0—the engine will **block** standard player navigation, turning regular links unclickable. The *only* links that remain functional during a block are **unblockable links** (`[[Target<-Text]]`). Use these to direct players to "Game Over" screens or forced combat resolutions.

---

## Mechanics Syntax

### 1. Chance Rolls
Chance rolls handle non-combat moments that hinge entirely on luck—like searching a dark room or dodging a sudden trap. Triggering a chance roll forces a visual diceboard to overlay on the player's screen. 

#### Syntax Rules
* **Single Paragraph Constraint:** The rolling instruction *and* every possible outcome must sit together on **one single line** with no hard returns/line breaks.
* **Limit:** Only **one** chance roll is allowed per passage. If multiple are present, only the first will be parsed.

#### The Pattern
```text
Roll N dice: If you score a NUM, You win: turn to NNN. If you score LOW to HIGH, turn to NNN.

```

* **The Trigger:** Must start with `Roll` or `Throw`, followed by a recognized number (`1`, `2`, `one`, or `two`), followed by `die` or `dice`, followed immediately by a period or colon (**no space before the punctuation**).
* **The Outcomes:** Each outcome must be its own sentence starting with a capital **I** (`If you...`).
* You can use `roll` or `score`.
* Articles are flexible: `roll 7`, `roll a 7`, or `roll an 8` are all acceptable.
* For ranges, use `to` (inclusive range) or `or` (discrete numbers). *Example:* `2 to 6` checks for 2, 3, 4, 5, and 6. `2 or 6` checks *only* for an exact 2 or an exact 6.
* The sentence must end immediately with `turn to <number>.` with no trailing punctuation inside the link phrase.

#### Example

> Somewhere ahead, water drips in a slow, patient rhythm. The left-hand floor looks recently disturbed.
>
> Roll two dice: If you score 2 to 5, you press on too quickly and turn to 3. If you score 6 to 12, you notice the loose flagstone in time and turn to 4.

### 2. Stat Check Rolls

Stat check rolls handle moments where the hero's survival hinges on their innate capabilities rather than pure luck or raw combat—such as balancing across a crumbling ledge using **AGILITY** or resisting a mental assault using **PSI**.

#### Syntax Rules

* **Single Paragraph Constraint:** The entire instruction, the condition, and both the success and failure outcomes must sit together on **one single line** with no hard returns/line breaks.
* **Limit:** Only **one** stat check roll is allowed per passage.

#### The Pattern

```text
Roll N dice, and try to score less than your AGILITY. If you succeed, turn to NNN. If you fail, turn to NNN.

```

#### Details

* **The Trigger:** Must start with `Roll` or `Throw`, followed by a recognized number (`1`, `2`, `one`, or `two`), followed by `die` or `dice`. A comma immediately after `die` or `dice` is optional.
* **The Condition:** Must include the phrase `and try to`, followed by either `roll` or `score`.
* **The Target Operator:** The engine allows a few natural variations here. You can write:
  * `less than`
  * `less than or equal to`
  * `equal to or less than`
* **The Attribute:** Must be followed by `your` (or `your current`), and then the targeted statistic, which must be in **ALL CAPS** (`AGILITY` or `PSI`).
* **The Outcomes:** You must provide exactly two resolution sentences following the check:
* **Success:** Must be exactly `If you succeed, turn to <number>.`
* **Failure:** Must be exactly `If you fail, turn to <number>.`
* ⚠️ **Strict Rule:** Both resolution sentences must use proper sentence capitalization (`If`) and end with standard periods.


#### Example

> The narrow stone bridge slick with moss stretches across the chasm. A strong gust of wind threatens to take you off your feet.
>
> Throw two dice, and try to roll equal to or less than your AGILITY. If you succeed, turn to 82. If you fail, turn to 104.

---

### 3. Stat Actions

Actions dynamically alter a player's statistics the moment they visit a passage. To prevent infinite loops, an action will only trigger **once per gameplay session**; if a player backtracks to this passage later, their stats will remain unchanged.

#### Syntax Rules

* **Single Paragraph Constraint:** Every individual stat action must occupy **its own isolated paragraph**.
* **Spacing Strictest:** There must be *exactly* one space between each word. Double spaces will cause the action to fail silently.
* **Line Ending:** The terminating period must be followed immediately by a line break, with **no trailing whitespace**.

#### The Pattern

```text
Your STATISTIC VERB AMOUNT.

```

* **STATISTIC** must be typed in all-caps: `VIGOUR`, `PSI`, or `AGILITY`.
* **VERB AMOUNT** options include:
* `increases by <number>.`
* `decreases by <number>.`
* `reduces by <number>.`
* `is restored.` *(Note: `is restored` must **never** be followed by a number).*


#### Instant Death

To instantly kill a player via narrative event, place this exact phrase on its own isolated paragraph:

```text
You are dead.

```

This instantly drops all statistics to 0 and permanently freezes navigation. If a standard `decreases by` action reduces a player's VIGOUR to 0 or less, it achieves this exact same effect.

#### Examples

> The troll goes down hard, and the chamber falls quiet but for your own breathing. Wedged behind where it fell, half-buried in old bones, is a small hoard.
> Your VIGOUR increases by 3.
> You drink the vial's contents. It tastes of frost and copper, and the ache in your skull fades to nothing.
> Your PSI is restored.

---

### 4. Combat

Combat represents a fierce, tactical conflict with an unrelenting foe. During combat, simulated dice rolls dynamically deduct points from either the player's VIGOUR or the enemy's VIGOUR until one reaches zero, or until the player chooses to **FLEE** (if the author permits it).

#### Syntax Rules

* **Multi-Paragraph Structure:** Unlike other mechanics, combat spans multiple paragraphs separated by standard blank lines.
* **Navigation Lock:** The moment a player enters a combat passage, all standard links on the page are **blocked** (unclickable). The player cannot leave the passage until combat resolves, unless a `FLEE` link is explicitly provided.
* **Instant Death:** If the player's VIGOUR drops to 0 or below during a round, the game ends immediately.

#### The Pattern

```text
[Narrative prose intro]

FOENAME VIGOUR FOEVIGOUR

Roll NUMBER dice:

score LOW to HIGH you lose N VIGOUR
score LOW to HIGH description loses N VIGOUR

If you win, turn to NNN. If you lose, turn to NNN. If you FLEE, turn to NNN.

```

#### Details

* **The Enemy Header:** Must be a single line containing the `FOENAME` (written in **ALL CAPS**; spaces and hyphens are allowed, but no other special characters), followed by the exact word `VIGOUR`, followed by a numeric starting value (`FOEVIGOUR`).
* **The Roll Trigger:** Followed by a blank line, this line must read exactly `Roll NUMBER dice:` (or `die:`). `NUMBER` can be `1`, `2`, `one`, or `two`. Standard sentence casing applies.
* **The Rule Rows:** Placed immediately below the roll trigger, you must provide one or more outcome rows (one per line):
* Each row starts with the word `score`, followed by the `LOW to HIGH` range.
* To damage the **player**, the sentence must end with the exact phrase `you lose N VIGOUR`.
* To damage the **enemy**, the sentence must end with `loses N VIGOUR` (e.g., `the troll loses 3 VIGOUR`).
* ⚠️ **Strict Rule:** Do **not** put a period or any punctuation at the end of a rule row.


* **The Resolution Line:** Followed by a blank line, this optional line dictates where the player goes when the fight ends.
* You must use the exact casing shown (`If you win...`, `If you lose...`, `If you FLEE...`).
* The word **FLEE** must be in all-caps.
* At a minimum, you must provide a `win` destination.
* The `FLEE` destination is optional. If omitted, the player will not be given an option to escape the combat interface.



#### Example

Here is how a standard combat passage should look in your editor:

> The thing at the far end of the chamber rises to its full height, and you realize it is not a shadow at all.
>
> CAVE TROLL VIGOUR 14
>
> Roll two dice:
>
> score 2 to 6 you lose 2 VIGOUR  
> score 7 to 12 the troll loses 3 VIGOUR
>
> If you win, turn to 6. If you FLEE, turn to 7.

## Wrapping Up

Authoring stories in **Brass Basilisk** is all about leaning into the rhythm of classic fantasy gamebooks. By eliminating complex code markup, you are free to focus entirely on the narrative, the choices, and the tension of the dice. Just keep the **Golden Rule** of exact pattern phrasing in mind as you draft your passages, and let the engine handle the heavy lifting.

Now that you know how to structure your text, manage statistics, test your player's attributes, and build deadly encounters, you have everything you need to forge your own adventure.

*May the dice always roll in your favor.*
