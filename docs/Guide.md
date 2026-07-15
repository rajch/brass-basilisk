# A Guide to Brass Basilisk

## Introduction

This is a guide to the Brass Basilisk [story format](https://twinery.org/reference/en/getting-started/basic-concepts.html#story-formats) for [Twine/Twee](https://twinery.org/). This story format was made to easily create and play stories resembling the classic [Golden Dragon Fantasy Gamebooks](https://gamebooks.org/Series/14).


In these stories, the reader/player *is* the hero. Each story takes the player through a rollicking adventure, peppered with branching decisions, situations involving pure chance, and combat. Dice rolls are used for all these mechanics. The story format provides ways for authors to write them into their stories, and for players to play them.

One goal of the Brass Basilisk story format is to prevent the use of special markup or code. Stories are written in plain text - mechanics like dice rolls and combat are detected from patterns in the text. 

The stories are usually told in second person, although this is not a strict rule.

## Game mechanics

Stories are composed using normal Twine/Twee _passages_. Player progress and prowess in a story are tracked through three statistics:

* VIGOUR - represents strength, fitness and general will to survive. If it drops to 0, the story is over.
* PSI - represents psychic sensitivity and will power.
* AGILITY - represents nimbleness, speed and dexterity.

The scores for every game are decided at the beginning by rolling dice: starting VIGOUR is calculated by rolling two dice and adding 20 to the result (22 - 32), PSI and AGILITY by rolling one die and adding 3 (4-9). As the story progresses, these scores are used to decide outcome. VIGOUR plays the main role in combat, and both PSI and agility can affect which direction the story goes. 

Story direction can be affected by:

* direct player decisions, such as "If you choose the left fork, turn to 10. If the right, turn to 20."
* PSI or AGILITY checks, such as "Roll two dice. If you score less than your AGILITY, turn to 30."
* chance rolls, such as "Roll one die. If you score 1 to 2, turn to 40. If you score 3 to 6, turn to 50."
* scripted actions, such as "You VIGOUR decreases by 2."
* combat, described in detail below.

Stories can, and often will, end in player death. This can happen if the player goes down certain paths, or because their VIGOUR reaches 0. Fortunately, the story format offers the facility to save and restore up to three game instances. It also offers the facility to backtrack and change decisions (but not combat outcomes).

## Authoring stories

[Stories](https://twinery.org/cookbook/terms/terms_stories.html) can be written using the Twine tool, or using any text editor with the Twee format. As mentioned above, they are composed using [passages](https://twinery.org/cookbook/terms/terms_passages.html). There are some rules, over and above the standard Twine/Twee ones, for the Brass Basilisk story format.

### Passage naming

In Brass Basilisk, passage names should positive numbers, currently limited to be from 1 to 999. You can author passages with non-numeric names, but they will not be usable from mechanics like attribute checks, chance rolls or combat. A notable exception is: Brass Basilisk stories usually start with a passage traditionally named BACKGROUND, which introduces the setting of the story, and ends with the words "Turn to 1."

### Connecting Passages

Passages are connected using Twine links. You can create a link by including the pattern "turn to PAGE" anywhere in the passage text, where PAGE is a number from 1 to 999. The format will automatically translate that pattern (written in any casing, UPPER, lower or Proper) to a link, provided the destination passage exists.

Brass Basilisk also supports the standard Twine bracket forms:

|Syntax|Result|
|---|---|
|[[Text->Target]]|A normal link reading "Text", going to passage named "Target"|
[[Text\|Target]]|Same as above, using a pipe instead of an arrow|
|[[Target]]|A normal link, using "Target" as both the text and the destination passage name|
|[[Target<-Text]]|An _unblockable_(see below) link reading "Text", going to passage named "Target"|

This form can be used to link to passages whose names are not numbers between 1 and 999, which cannot be done using the "turn to PAGE" pattern.

In certain situations, the story format may _block_ player navigation;i.e.; the links become unclickable. This can happen when combat is initiated, or when player VIGOUR drops to 0. The only links that will work in such situations are the ones created using the fourth bracket  form shown above (arrow pointing left, destination written first).

### Inserting mechanics

Brass Basilisk turns ordinary-looking prose into game mechanics — combat, chance rolls outcomes, stat changes, links — without any special markup. That's the good news. The catch is *how* it does this: it reads your passage text looking for very specific, exact phrasings or _patterns_. If the wording matches, the mechanic works. If it's off, **the mechanic simply doesn't happen — no error, no warning, nothing.** The passage just renders as plain text and the game quietly carries on without the fight, the dice roll, or the stat change that was meant to trigger.

**The golden rule throughout this guide: copy the patterns exactly, including capitalization and punctuation, unless a section below tells you the engine is now flexible about it.**

The rest of the guide provides details of currently recognized mechanics.

## Mechanics list

### Chance rolls

Chance rolls are for moments that aren't combat but still hinge on a die roll — searching a room, dodging a trap, testing your luck. A chance roll detected in text will cause a diceboard to appear while playing the story. There should be only one chance roll in a passage; if there are multiple, only the first valid one will be detected.

Everything for a chance roll — the instruction to roll, *and every possible outcome* — must sit on **one single line** (one paragraph, no line breaks in the middle). The pattern is:

>  Roll _N_ dice: If you score a _NUM_, You win: turn to _NNN_. If you score _LOW_ to _HIGH_, turn to _NNN_.

#### Details

- Start with `Roll` or `Throw`, then the number of dice as a word or digit, then `dice` or `die`, then a period or colon with **no space** before it.
  - The dice count(_N_ in the pattern above) must be one the engine recognizes: `0`, `1`, `one`, `2`, `two`, `3`, `three`. If the word isn't recognized, the *entire* chance-roll block is ignored — no dice board appears at all.
- This must be followed by one or more _outcome sentences_. Each outcome sentence must start with `If you ` (**I** must be capital), followed by either `roll` or `score` followed by a _number or a range article_, followed by a either a comma or a colon, followed by a sentence that ends in `turn to NNN`. 
  - After `roll` or `score`, an article is optional and flexible: `roll 7`, `roll a 7`, `roll an 8` and `roll 9 to 12` all work , as do `score 5` and `score a 5` etc.
  - Give a single number (`If you score 5, ...`), or a range using `to` or `or` (`If you score 2 to 6, ...` / `If you score 2 or 6, ...`). 
  - **`or` and `to` mean different things, and it matters:** `If you score 2 to 6, ...` matches *any* roll from 2 through 6 inclusive. `If you score 2 or 6, ...` matches *only* an exact roll of 2 or an exact roll of 6 — nothing in between. Pick the one that actually matches what you mean.
  - To send the player to a specific passage for a given outcome, put `turn to <number>` right before the closing period of that same sentence, with **no period in between**. 

#### Example

Worked example from the sample story, with the chance roll prose in **bold**:

>  Somewhere ahead, water drips in a slow, patient rhythm. The left-hand floor looks recently disturbed.
>
>  **Roll two dice: If you score 2 to 5, you press on too quickly and turn to 3. If you score 6 to 12, you notice the loose flagstone in time and turn to 4.**

### Actions

Actions, or scripted actions, are parts of the narrative that affect the player's statistics. Simply by visiting a passage that contains one or more actions, statistics may increase or decrease. This happens only once in a gameplay session: if the player ever re-visits the passage, their statistics will not be adjusted again.

Each action must sit on **one single paragraph**. The pattern is:

>  Your STATISTIC VERB AMOUNT

Where:

- STATISTIC is VIGOUR, PSI or AGILITY, written in all caps.
- VERB is either 'is restored' followed by a period, or 'increases by', 'decreases by' or 'reduces by' followed by NUMBER followed by a period.

The effect is pretty much what the sentence describes. The 'is restored' verb will cause the statistic's value to be restored to what it was at the beginning of the game.

There is another special pattern which becomes a special action, which is:

> You are dead.

Exactly the captilization, spacing, and punctuation shown, in a paragraph by itself. This ends the story then and there by bringing all statistics down to 0.

There can be multiple actions in a single passage. They will all be acted upon.

#### Details

- The sentence must be exactly: `Your <ATTRIBUTE> <verb phrase> <number>.` followed immediately by a line break — **except** for `is restored`, which takes no number at all.
- `<ATTRIBUTE>` must be one of `VIGOUR`, `AGILITY`, or `PSI`, in capitals.
- `<verb phrase>` must be exactly one of: `increases by`, `decreases by`, `reduces by`, or `is restored`.
- **A number is required** for `increases by`, `decreases by`, and `reduces by` — `Your VIGOUR increases by.` with the number left off will prevent the sentence from being recognized as an action.
- **`is restored` cannot be followed by a number.** `Your VIGOUR is restored.` works; `Your VIGOUR is restored 5.` will prevent the sentence from being recognized as an action.
- Spacing here is strict — exactly one space between each word, including before the number. `Your  VIGOUR increases by 3.` (double space) and `Your VIGOUR increases by  3.` both fail to match. This is intentionally stricter than the other mechanics, since a stat change happens automatically as soon as the passage renders, with no dice roll or click from the player to confirm it — a forgiving pattern here risks a subtle, un-signposted misfire.
- The period must be followed immediately by a line break, with **no trailing space** after the period.
- If a `decreases by` or `reduces by` sentence brings VIGOUR down to zero or below, that on its own ends the story the same way a lost fight or a `You are dead.` sentence does — the passage becomes a permanent dead end, with no message beyond whatever your own prose said. This only applies to VIGOUR; AGILITY and PSI have no equivalent effect.

#### Example

Worked example from the sample story's reward passage, with action phrases shown here in **bold**:

>  The troll goes down hard, and the chamber falls quiet but for your own breathing. Wedged behind where it fell, half-buried in old bones, is a small hoard: a few coins gone green with age, and a stoppered vial that still catches the torchlight.
>
>  **Your VIGOUR increases by 3.**
>
>  You drink the vial's contents. It tastes of frost and copper, and the ache in your skull fades to nothing.
>
>  **Your PSI is restored.**


Another worked example from the sample story's trap ending, with the death action in **bold**:

> The flagstone tips beneath your boot. Below it there is no floor at all, only a black drop and, faintly, the glint of old spikes.
>
> **You are dead.**
>
> Anndon Weir will tell stories about the stranger who went down into the stones and never came up.

### Combat

Combat is exactly what it sounds like - fierce conflict with an unrelenting foe. Dice rolls determine the damage dealt to either the player's VIGOUR or the enemy's - until one reaches zero, or until the player (if given the option) chooses to FLEE.

Combat is written across multiple paragraphs, with blank pragraphs in between. The pattern is:

>  _FOENAME_ VIGOUR _FOEVIGOUR_
>
>  Roll _NUMBER_ dice:
>
>  score _LOW_ to _HIGH_ you lose _N_ VIGOUR
>  score _LOW_ to _HIGH_ _FOENAME_ loses N VIGOUR
>
> If you win, turn to NNN. If you lose, turn to NNN. If you FLEE, turn to NNN.

#### Details
The elements are as follows:

* A line naming the foe and its starting VIGOUR: _FOENAME_ (has to be written in all capital letters — spaces and hyphens in the name are fine, nothing else is) followed by "VIGOUR" (written exactly as shown, in all caps), and _FOEVIGOUR_ (a number).
* A blank line.
* A line saying how many dice to roll: Roll _NUMBER_ dice: . Here, _NUMBER_ must be 1 or 2, which can also be written as "one" or "two" (both a colon and a period work; singular die is also fine). Letter casing should be exactly as shown.
* One or more rule rows, one per line, each in the shape: Score _LOW_ to _HIGH_ (where _LOW_ and _HIGH_ are numbers; they may be the same number), followed by one or more spaces, followed by a sentence that must end in  "lose _N_ VIGOUR" or "loses _N_ VIGOUR", **with no punctuation at the end**. The word "lose" indicates that a combat dice roll score that falls between _LOW_ and _HIGH_ will cause the **player**'s VIGOUR to be reduced by _N_. The words "loses" in the same position will cause the **enemy**'s VIGOUR to be reduced by _N_, in the same situation.
* A blank line.
* Optionally, a single line describing what happens if the player wins, loses or flees. Letter casing should be exactly as shown, especially the word FLEE, which needs to be in all caps. At the minimum, you should provide a sentence for the "win" destination. A FLEE destination is optional: if you leave it out, the player will not be given the option to flee during combat.
* When a player navigates to a passage containing the combat mechanic, all links on that page (except a link to FLEE, if the combat allows it) will become unclickable, and the player will not be able to move on until combat finishes. If the player's VIGOUR drops to 0 or below, the game is over then and there.

#### Example

Worked example from the sample story's troll fight:

```
The thing at the far end of the chamber rises to its full height, and you realize it is not a shadow at all.

CAVE TROLL VIGOUR 14

Roll two dice:

score 2 to 6 you lose 2 VIGOUR
score 7 to 12 the troll loses 3 VIGOUR

If you win, turn to 6. If you FLEE, turn to 7.
```

