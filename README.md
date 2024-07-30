# Brass Basilisk

Brass Basilisk is a [story format] for [Twine/Twee](https://twinery.org/).

It's purpose is to easily create and play stories resembling the classic [Golden Dragon Fantasy Gamebooks](https://gamebooks.org/Series/14).

In those gamebooks, *entries* (what Twine calls *passages*) were written using a remarkably uniform language and format. A typical entry looked like this:

>&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;**107**
>
> The Giant tears a branch from a nearby tree and lumbers towards you. There is nowehere to run - you must fight.
>
> GIANT&emsp;&emsp;VIGOUR 15
>
> *Roll two dice:*
>
> Score 2 to 6&emsp;&emsp;You are hit. Lose 3 VIGOUR points<br>
> Score 7 to 12&emsp;&emsp;The Giant loses 3 VIGOUR points
>
> If you win, turn to **273**.

You can see the following features, from top to bottom:

* Entries were numbered. This one is entry 107. This translates well to passage titles in Twine.
* Some entries featured *combat*. The presence of a table like the one above indicated the name ("GIANT") and health ("VIGOUR 15") on the enemy, how to fight them ("Roll *two* dice"), and how each combat round is scored ("Score *x* to *y*"). "*Lose n* VIGOUR" meant the player was hit, and "*loses n* VIGOUR" meant that the enemy was hit.
* Links to other entries were always indicated by the phrase "turn to *number*".

There were also random dice rolls, and a rudimentary inventory (yes, i know), all expressed in mostly uniform language.

The aim of this story format is to recreate that experience as faithfully and easily as possible. Passage authors should be able to just put in text, with ideally no markup whatsover. As long as the text is written according to a small set of rules, the story format will figure out and execute what needs to happen, from rendering the text with appropriate decorations to providing dice rolls and combat.

## Status

This story format is currently a work in progress. No releases yet, there will be one hopefully soon.
