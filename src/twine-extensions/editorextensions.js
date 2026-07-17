const getPassageReferences = (text) => {
    const turnToRegex = /(?:[^\d\w]|^)turn to (\d{1,3})(?:[^\d\w]|$)/ig
    return Array.from(text.matchAll(turnToRegex), (match) => match[1])
        .filter(
            (value, index, array) => array.indexOf(value) === index
        )
}

const insertText = (editor, text) => {
    const doc = editor.getDoc()
    doc.replaceSelection(text)
}

const expandRuleset = (compact) => {
    const [header, ...rules] = compact.split('|').map(s => s.trim());
    const [foe, vigour] = header.split(':');
    let output = `${foe}    VIGOUR ${vigour}\n\nRoll two dice:\n\n`;

    for (const rule of rules) {
        const [range, result, text] = rule.split(':');
        let [low, high] = range.split('-');
        high = high ?? low;
        const [target, amount] = result.split('-');
        const targetText = target === 'P'
            ? `You lose ${amount} VIGOUR`
            : `${foe} loses ${amount} VIGOUR`;
        const scoreband = `Score ${String(low).padStart(2, '0')}${high ? ' to ' + String(high).padStart(2, '0') : ''}`.padEnd(8, ' ')
        output += `${scoreband}    ${text}. ${targetText}\n`;
    }

    output += `\nIf you win, turn to XXX. If you lose, turn to YYY. If you FLEE, turn to ZZZ.`;
    return output;
}

const insertCombatTable = (editor, ruleset) => {
    const combatSection = expandRuleset(ruleset)
    insertText(editor, combatSection)
}
const insertEasyCombat = (editor) => {
    insertCombatTable(editor, 'MONSTER:12 | 2-5:P-2:The foe’s strike grazes you | 6-12:F-3:You drive your blade deep')
}

const insertMediumCombat = (editor) => {
    insertCombatTable(editor, 'MEDIUMFOE:16 | 2-4:P-3:MEDIUMFOE’s strike staggers you | 5-8:F-2:You wound MEDIUMFOE lightly | 9-12:F-3:Your attack lands true')
}

const insertMediumWithFatal = (editor) => {
    insertCombatTable(editor, 'MEDIUMFOE:16 | 2:P-8:A crushing blow smashes your ribs | 3-4:P-3:MEDIUMFOE’s strike staggers you | 5-8:F-2:You wound MEDIUMFOE lightly | 9-11:F-3:Your attack lands true | 12:F-8:A fatal thrust pierces MEDIUMFOE’s heart')
}

const insertHardCombat = (editor) => {
    insertCombatTable(editor, 'HARDFOE:22 | 2-5:P-4:HARDFOE’s heavy blow batters you | 6-8:P-2:HARDFOE’s strike cuts deep | 9-12:F-3:You slash HARDFOE across the chest')
}

const insertHardWithFatal = (editor) => {
    insertCombatTable(editor, 'HARDFOE:22 | 2:P-10:HARDFOE’s savage strike crushes you | 3-5:P-4:HARDFOE’s heavy blow batters you | 6-8:P-2:HARDFOE’s strike cuts deep | 9-11:F-3:You slash HARDFOE across the chest | 12:F-10:Your blade finds its mark — HARDFOE suffers a mortal wound')
}

const insertActionPhrase = (editor, action, attribute) => {
    const phrase = `Your ${attribute} ${action==='restore' ? "is restored" : action +"s by 1"}.\n`
    insertText(editor, phrase)
}

const insertIncreaseVigourAction = (editor) => {
    insertActionPhrase(editor, 'increase', 'VIGOUR')
}

const insertDecreasePsiAction = (editor) => {
    insertActionPhrase(editor, 'decrease', 'PSI')
}

const insertRestoreAgilityAction = (editor) => {
    insertActionPhrase(editor, 'restore', 'AGILITY')
}

const insertYouDieAction = (editor) => {
    insertText(editor, 'You are dead.\n')
}

const insertEasyChanceRoll = (editor) => {
    insertText(editor, 'Roll one die. If you roll 1 to 3, you lose: turn to XXX. If you roll 4 to 6, you win: turn to XXX.')
}

const insertMediumChanceRoll = (editor) => {
    insertText(editor, 'Roll two dice. If you roll 2 to 4, you lose: turn to XXX. If you roll 5 to 8, you survive: turn to XXX. If you roll 9 to 12, you win: turn to XXX.')
}

const insertHardChanceRoll = (editor) => {
    insertText(editor, 'Roll two dice. If you roll 2 to 6, you lose: turn to XXX. If you roll 7 to 9, you survive: turn to XXX. If you roll 10 to 12, you win: turn to XXX.')
}

const parseToken = (stream, state) => {
    console.dir(state)
    if (stream.eol()) {
        return null
    }

    // Look for combat start at beginning of stream
    if (stream.sol()) {
        const combatStart = stream.match(
            /^([A-Z][A-Z\s\-]*?[A-Z]+)\s+VIGOUR\s+\d+/,
            false
        )
        if (combatStart) {
            state.combatDetected = true
            state.foeName = combatStart[1]
            // Skip until end of name
            stream.match(/^([A-Z][A-Z\s\-]*?[A-Z])(?=\s+VIGOUR)/, true)
            // stream.skipTo(' ')
            return "string strong"
        }
    }

    // Eat any spaces
    if (stream.eatSpace()) {
        return null
    }

    // Eat any punctuation
    if (stream.eatWhile(/\p{P}/u)) {
        return null
    }

    // If combat start has been detected
    // look for foeName
    if (state.combatDetected) {
        if (stream.match(state.foeName, true, true)) {
            return "string strong"
        }
    }

    // Detect "turn to"
    if (stream.match(/^(?:go|turn) to \d+/i, true)) {
        return "link strong"
    }

    // Detect chance roll
    const chanceRollRE = /^(?:[Rr]oll|[Tt]hrow) (?:1|01|2|02|3|03|one|two|three) di(?:c?)e[\.:]/
    if (stream.match(chanceRollRE, true)) {
        return "variable-3 strong"
    }

    // Detect attribute phrases
    const phraseRE = /^Your (VIGOUR|AGILITY|PSI) (?:(is restored)\.|(increases by|decreases by|reduces by) (\d{1,2})\.)/
    if (stream.match(phraseRE, true)) {
        return "variable-3 strong em"
    }

    const deadPhraseRE = /^You are dead./
    if (stream.match(deadPhraseRE, true)) {
        return "variable-3 strong em"
    }

    // Detect stat check rolls
    const statCheckRE = /(?:Roll|Throw) (1|2|one|two) di(?:c)?e,? and try to (?:roll|score) (equal to or less than|less than or equal to|less than) your(?: current)? (AGILITY|PSI). If you succeed, turn to (\d{1,3}). If you fail, turn to (\d{1,3})./
    if(stream.match(statCheckRE, true)) {
        return "variable-3 em"
    }

    // Detect VIGOUR, AGILITY, PSI
    if (stream.match(/^(?:VIGOUR)|(?:AGILITY)|(?:PSI)|(?:FLEE)/, true)) {
        return "keyword strong"
    }

    // Go to next "word"
    stream.match(/^.+?(?=\p{P}|\s|$)/u, true)
    return null
}

const bbToolbar = () => {
    return [
        {
            type: 'menu',
            label: 'Insert Combat...',
            icon: 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjxzdmcKICAgdmVyc2lvbj0iMS4wIgogICB3aWR0aD0iNDE1LjAwMDAwMHB0IgogICBoZWlnaHQ9IjQxNS4wMDAwMDBwdCIKICAgdmlld0JveD0iMCAwIDQxNS4wMDAwMDAgNDE1LjAwMDAwMCIKICAgcHJlc2VydmVBc3BlY3RSYXRpbz0ieE1pZFlNaWQgbWVldCIKICAgaWQ9InN2ZzEiCiAgIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKICAgeG1sbnM6c3ZnPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPGcKICAgICB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwLjAwMDAwMCw0MTUuMDAwMDAwKSBzY2FsZSgwLjEwMDAwMCwtMC4xMDAwMDApIgogICAgIGZpbGw9IiMwMDAwMDAiCiAgICAgc3Ryb2tlPSJub25lIgogICAgIGlkPSJnMSI+CiAgICA8cGF0aAogICAgICAgZD0iTTM0MjAgMzcyNiBjLTE0NyAtNDcgLTM0NiAtMTE4IC00NTEgLTE2MCAtNzMgLTMwIC02NyAtMjMgLTY0NCAtNjUxIC0xMjEgLTEzMiAtMzEwIC0zMzYgLTQyMCAtNDU1IC0xMTAgLTExOCAtMzAzIC0zMjcgLTQyOSAtNDY1IC0xMjYgLTEzNyAtMjM5IC0yNjEgLTI1MiAtMjc1IGwtMjMgLTI0IC01NyA2MiBjLTY4IDc2IC05MSA4NCAtMTQzIDQ3IC01NSAtMzcgLTE0MCAtMTM4IC0xNDcgLTE3MyAtOSAtNDIgMTQgLTc5IDExNSAtMTg1IGw4OSAtOTMgLTIzNCAtMjU5IC0yMzMgLTI1OSAtNTMgLTExIGMtNjcgLTE0IC04NyAtMjUgLTEyOCAtNzEgLTQ1IC01MiAtNjAgLTkzIC02MCAtMTY3IDAgLTE1MiAxMjQgLTI3MiAyODAgLTI3MSAxMjYgMSAyMTkgODMgMjM2IDIxMSA2IDQ4IDEwIDU0IDI0OCAyOTcgbDI0MSAyNDcgMTA5IC05NSBjMTAzIC05MSAxMTEgLTk2IDE1NCAtOTYgNDQgMCA0OSA0IDEyNCA3OCAxMDMgMTAzIDEwNCAxMTcgMTEgMjEzIGwtNjYgNjkgNjQgNjcgYzM1IDM4IDIzNyAyNDQgNDQ5IDQ1OSA2NzQgNjgzIDExODEgMTIwMiAxMjEwIDEyNDAgMTYgMTkgMzkgNjEgNTAgOTIgNTEgMTM0IDE1OSA1NTYgMTYwIDYxOSAwIDI2IC0yNSA1MyAtNDggNTIgLTkgMCAtNzggLTIwIC0xNTIgLTQzeiBtNzggLTE1OCBjLTMxIC0xMzQgLTExOSAtNDMwIC0xMzkgLTQ3MCAtMTAgLTIwIC0yODMgLTMwNiAtNjA2IC02MzUgLTMyMyAtMzI5IC03MTIgLTcyNSAtODY0IC04ODAgbC0yNzcgLTI4MyAtNzQgNjkgLTczIDY5IDQ5IDUzIGMyOCAzMCAxNzYgMTg3IDMzMCAzNDkgMTU1IDE2MiAzMTcgMzMzIDM2MSAzODAgNDQgNDcgMjIwIDIzMSAzOTEgNDEwIDE3MSAxNzkgMzU1IDM3NSA0MDkgNDM1IDkzIDEwNSAxODUgMjI1IDE4NSAyNDAgMCAxMyAtODYgLTYwIC0yMDQgLTE3NSAtMTA5IC0xMDUgLTEzNzMgLTE0MTcgLTE1MDkgLTE1NjYgLTMyIC0zNSAtNjQgLTY0IC03MSAtNjQgLTYgMCAtNDEgMjkgLTc2IDY1IGwtNjQgNjUgMzUgMzcgYzE5IDIxIDY2IDcyIDEwNCAxMTMgMzkgNDIgMTQ0IDE1NiAyMzUgMjU1IDkxIDk5IDE5OSAyMTYgMjQwIDI2MCA0MSA0NCAxNzkgMTkzIDMwNiAzMzAgMTI3IDEzOCAzNDkgMzc4IDQ5NCA1MzUgMTQ1IDE1NyAyNzEgMjkxIDI4MSAyOTggMzQgMjQgNTA0IDE5MSA1NDAgMTkyIDE1IDAgMTQgLTggLTMgLTgyeiBtLTIzODUgLTE5MTIgYzMwIC0zNSAxNTQgLTE1NSAyNzMgLTI2NyAxMjAgLTExMiAyNDUgLTIzMCAyNzggLTI2MSBsNjEgLTU3IC01MCAtNTEgYy0yNyAtMjcgLTUzIC01MCAtNTcgLTUwIC0xOSAwIC0yNDMgMjA0IC00NTIgNDEyIGwtMjMwIDIyOCA1NCA1NSBjMzAgMzAgNTcgNTUgNjAgNTUgNCAwIDMyIC0yOSA2MyAtNjR6IG0xNDcgLTU1MSBjLTEzIC0xNCAtMjggLTI1IC0zMiAtMjUgLTEzIDAgLTE1OCAxMzMgLTE1OCAxNDQgMCA2IDEyIDIzIDI3IDM4IGwyNyAyOSA4MCAtODAgODAgLTgwIC0yNCAtMjZ6IG0tMTU3IC0xMSBsNzcgLTcwIC01MCAtNDkgLTQ5IC00OSAtNjMgNTkgYy0zNSAzMiAtNjkgNjQgLTc3IDcxIC0xMiAxMSAtNyAyMSAzMCA2MyAyNCAyNyA0NyA0OSA1MCA0OCAzIC0xIDQwIC0zNCA4MiAtNzN6IG0tNzUgLTIxNSBjNCAtMTAgLTU2IC03NyAtODAgLTkwIC0xNiAtOSAtMzAgLTEgLTg2IDUyIC0zNyAzNCAtNjggNjUgLTcwIDY4IC0xIDQgMTkgMzAgNDQgNTkgbDQ2IDUzIDcyIC02OCBjMzkgLTM2IDcyIC03MCA3NCAtNzR6IG0tMjExIC04NiBsNzUgLTY2IC0zNCAtMzQgLTM0IC0zNCAtNzEgNjkgLTcwIDY4IDI2IDMxIGMxNCAxNyAyOCAzMiAzMCAzMiAyIDEgMzcgLTI5IDc4IC02NnogbS0xODkgLTY3IGM0NCAtMjMgMTE5IC0xMTAgMTMzIC0xNTQgMjEgLTcxIC0xMCAtMTI5IC04NiAtMTU4IC0zOSAtMTUgLTUxIC0xNSAtOTIgLTQgLTg5IDI1IC0xNTQgMTIxIC0xMzkgMjA4IDE1IDkyIDEwOCAxNDcgMTg0IDEwOHoiCiAgICAgICBpZD0icGF0aDEiCiAgICAgICBzdHlsZT0ic3Ryb2tlLXdpZHRoOjc1O3N0cm9rZS1kYXNoYXJyYXk6bm9uZTtzdHJva2U6IzAwMDAwMDtzdHJva2Utb3BhY2l0eToxO2ZpbGw6IzAwMDAwMDtmaWxsLW9wYWNpdHk6MSIgLz4KICA8L2c+Cjwvc3ZnPgo=',
            items: [
                {
                    type: 'button',
                    command: 'insertEasyCombat',
                    label: 'Easy Combat'
                },
                {
                    type: 'button',
                    command: 'insertMediumCombat',
                    label: 'Medium Combat'
                },
                {
                    type: 'button',
                    command: 'insertMediumWithFatal',
                    label: 'Medium Combat with Fatal Blow'
                },
                {
                    type: 'button',
                    command: 'insertHardCombat',
                    label: 'Hard Combat'
                },
                {
                    type: 'button',
                    command: 'insertHardWithFatal',
                    label: 'Hard Combat with Fatal Blow'
                }
            ]
        },
        {
            type: 'menu',
            label: 'Insert Action...',
            icon: 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjwhLS0gQ3JlYXRlZCB3aXRoIElua3NjYXBlIChodHRwOi8vd3d3Lmlua3NjYXBlLm9yZy8pIC0tPgoKPHN2ZwogICB3aWR0aD0iNDUwIgogICBoZWlnaHQ9IjQ1MCIKICAgdmlld0JveD0iMCAwIDExOS4wNjI1IDExOS4wNjI1IgogICB2ZXJzaW9uPSIxLjEiCiAgIGlkPSJzdmcxIgogICB4bWw6c3BhY2U9InByZXNlcnZlIgogICBpbmtzY2FwZTp2ZXJzaW9uPSIxLjQuMiAoZjQzMjdmNCwgMjAyNS0wNS0xMykiCiAgIHNvZGlwb2RpOmRvY25hbWU9IkJCLVR3aW5lLUFjdGlvbi5zdmciCiAgIHhtbG5zOmlua3NjYXBlPSJodHRwOi8vd3d3Lmlua3NjYXBlLm9yZy9uYW1lc3BhY2VzL2lua3NjYXBlIgogICB4bWxuczpzb2RpcG9kaT0iaHR0cDovL3NvZGlwb2RpLnNvdXJjZWZvcmdlLm5ldC9EVEQvc29kaXBvZGktMC5kdGQiCiAgIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKICAgeG1sbnM6c3ZnPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHNvZGlwb2RpOm5hbWVkdmlldwogICAgIGlkPSJuYW1lZHZpZXcxIgogICAgIHBhZ2Vjb2xvcj0iI2ZmZmZmZiIKICAgICBib3JkZXJjb2xvcj0iIzAwMDAwMCIKICAgICBib3JkZXJvcGFjaXR5PSIwLjI1IgogICAgIGlua3NjYXBlOnNob3dwYWdlc2hhZG93PSIyIgogICAgIGlua3NjYXBlOnBhZ2VvcGFjaXR5PSIwLjAiCiAgICAgaW5rc2NhcGU6cGFnZWNoZWNrZXJib2FyZD0iMCIKICAgICBpbmtzY2FwZTpkZXNrY29sb3I9IiNkMWQxZDEiCiAgICAgaW5rc2NhcGU6ZG9jdW1lbnQtdW5pdHM9Im1tIgogICAgIGlua3NjYXBlOnpvb209IjAuNjU0Nzc2OTQiCiAgICAgaW5rc2NhcGU6Y3g9IjM5NS41NTQ1NSIKICAgICBpbmtzY2FwZTpjeT0iNTYxLjI1OTg0IgogICAgIGlua3NjYXBlOndpbmRvdy13aWR0aD0iMTkyMCIKICAgICBpbmtzY2FwZTp3aW5kb3ctaGVpZ2h0PSI5NzQiCiAgICAgaW5rc2NhcGU6d2luZG93LXg9Ii0xMSIKICAgICBpbmtzY2FwZTp3aW5kb3cteT0iLTExIgogICAgIGlua3NjYXBlOndpbmRvdy1tYXhpbWl6ZWQ9IjEiCiAgICAgaW5rc2NhcGU6Y3VycmVudC1sYXllcj0ibGF5ZXIxIgogICAgIHNob3dncmlkPSJmYWxzZSIgLz48ZGVmcwogICAgIGlkPSJkZWZzMSIgLz48ZwogICAgIGlua3NjYXBlOmxhYmVsPSJMYXllciAxIgogICAgIGlua3NjYXBlOmdyb3VwbW9kZT0ibGF5ZXIiCiAgICAgaWQ9ImxheWVyMSI+PHBhdGgKICAgICAgIHN0eWxlPSJmaWxsOiMwMDAwMDA7c3Ryb2tlLXdpZHRoOjEuMzIyOTE2Njc7c3Ryb2tlLWRhc2hhcnJheTpub25lO3N0cm9rZTojMDAwMDAwO3N0cm9rZS1vcGFjaXR5OjEiCiAgICAgICBkPSJtIDUzLjQ5NDY5LDExMS45NzE5MyBjIC0xMi4zMDY5MzMsLTIuMjAxNjQgLTIyLjA2NTk0NCwtOS41MjU2MSAtMjcuMTA3NDI1LC0yMC4zNDM2NDEgLTMuMTAzMDY4LC02LjY1ODU5IC0zLjc1ODIxNCwtMTQuNTAzMzMgLTEuODMwNTIyLC0yMS45MTg3NCAwLjk3ODY3MSwtMy43NjQ3MyAxLjM4NjQxMywtNC43NzY4NSAzLjIxNDQ3OSwtNy45NzkxOCAyLjM4NTg5NCwtNC4xNzk1MSA1LjY1ODY2NCwtNy45OTM3NCA5LjMzOTA0MSwtMTAuODg0MTUgMS4yNDMyMDYsLTAuOTc2MzYgNC4yODIyNjYsLTIuODE0OTEzIDYuOTM0MDczLC00LjE5NDkzNiAzLjE2MDU1NCwtMS42NDQ3ODIgMy4xMDAzNTQsLTEuNDY1MzgyIDMuMTAwMzU0LC05LjIzODQxNSBWIDMwLjgyMjQ1MSBMIDQ2LjE0NjgsMzAuNTMzNzAyIGMgLTQuMjQyOTUsLTEuMjI3NzQzIC01LjIyMDQwNSwtNi43MjQyNzIgLTEuNjk0NjcyLC05LjUyOTY2OCAwLjg4MTMyOSwtMC43MDEyNjcgMS4yNjQ2NTQsLTAuODE3NzA0IDIuOTc2NTYyLC0wLjkwNDE1MiAyLjI3MTEsLTAuMTE0Njg1IDIuMTg0OTksMC4wNTc3NiAxLjU3MDQ4LC0zLjE0NDg2OSAtMS4wOTU3NywtNS43MTA5MzIgLTEuMTU2MywtNi4yMjc5NDIgLTAuODM5NjMsLTcuMTcyMTc3NiAwLjU5MDQyLC0xLjc2MDQ5NiAyLjIyMjg3LC0yLjM2NDIyNCA4LjAwMTM5LC0yLjk1OTE1IDQuMDkwNTgsLTAuNDIxMTQ1IDEwLjgyOTMxLDAuMTg1MDE4IDEzLjIzNjAzLDEuMTkwNjA5IDEuOTM4NTYsMC44MDk5ODUgMi4wNDE2NSwxLjg1MDE0OSAwLjgxMjkzLDguMjAyMTcwNiAtMC4zNjUzNCwxLjg4ODcwNyAtMC42MDc1MywzLjUyNTgxNyAtMC41MzgxOCwzLjYzODAyMSAwLjA2OTQsMC4xMTIyMDUgMC45MzQ2MywwLjIwNDAwOCAxLjkyMjg1LDAuMjA0MDA4IDEuNTYzMzgsMCAxLjkzNDU3LDAuMDk5ODIgMi44NTc1OSwwLjc2ODQ1MiAyLjAwNDc5LDEuNDUyMjYxIDIuNzYwNjUsMy40ODIzMjggMi4xODY5Nyw1Ljg3MzcwMiAtMC40MjA3NCwxLjc1MzgzNCAtMS44ODA4NCwzLjI4MTk3MiAtMy41NjY2NSwzLjczMjg1OCBsIC0xLjE4OTI0LDAuMzE4MDczIHYgNi4zMDM2MjIgYyAwLDcuMzMzMjQyIDAuMDY0OSw3LjYxNTgzMyAyLjAzOTQ5LDguODgyOTM3IDAuNzIyNzcsMC40NjM4IDEuNDA0OCwwLjg0MzI3MyAxLjUxNTYzLDAuODQzMjczIDAuNDI5MDcsMCA1LjM4OTA2LDMuMDUzMjM4IDYuOTA2NDMsNC4yNTE0MTggMTAuMTYxMzcsOC4wMjM4NCAxNS4xNjE2MSwyMS40MzM5NyAxMi41NzE4LDMzLjcxNjI5IC0xLjMwNjE4LDYuMTk0NjMgLTQuMTQzNTEsMTEuNTI5NCAtOC42NTEzOSwxNi4yNjY0MTEgLTMuMDU4MiwzLjIxMzY0IC02LjIwMzUxLDUuNTIyNTggLTEwLjI4MDkyLDcuNTQ3MDkgLTUuNTg1MjUsMi43NzMxOSAtMTAuMjk0MDgsMy44NDk2OCAtMTYuNjY4NzUsMy44MTA2NSAtMi4wMzcyOSwtMC4wMTI1IC00LjY1NjY2LC0wLjE5MzA4IC01LjgyMDgzLC0wLjQwMTM0IHogbSAxMS4wODkxNCwtMi42MTgwNyBjIDQuNzkzMDksLTAuNzIyNDQgMTEuMTAzMDIsLTMuMjQyODMgMTQuNjA4MDcsLTUuODM0OTMgMi41NDc0MSwtMS44ODM5IDYuNTQ2NTksLTUuODU4MDAxIDcuOTgwNzEsLTcuOTMwNjYxIDQuNTAzOCwtNi41MDkxNCA2LjQ1NjI1LC0xNC43MzgyMiA1LjIwMDM0LC0yMS45MTgyIC0xLjg4NTc0LC0xMC43ODA3MyAtOC4yNTEyOCwtMTkuMjA5NDcgLTE4LjQ0NTM3LC0yNC40MjM4NyAtNC42NzQxLC0yLjM5MDg2MSAtNC43NTQ5MSwtMi41ODAzNzYgLTQuOTQzMjgsLTExLjU5MjkxMyAtMC4xNDMxNiwtNi44NDk3NjUgLTAuMTQ2MjgsLTYuODc5NTIzIC0wLjcyOTc0LC02Ljk2MjQ4OSAtMC42Mjg2NCwtMC4wODkzOSAtMC41OTY0OCwtMC4xNjQxNDEgLTEuMTM4ODQsMi42NDY5MzMgLTAuMzgyLDEuOTc5OTY0IC0xLjAyODI1LDIuNzUzNTYyIC0yLjcyMTUxLDMuMjU3ODE0IC0yLjk5NDU1LDAuODkxNzc4IC04LjQ2NzA0LDAuNzQ1ODI2IC0xMC42MzY1NiwtMC4yODM2NzkgLTAuOTk4NjUsLTAuNDczODkgLTEuNjMxMDcsLTEuNjkwMTggLTEuODc0NjksLTMuNjA1NDc4IC0wLjIwMTU2LC0xLjU4NDYwNiAtMC40ODAyNSwtMi4wNjQ1NTkgLTEuMTk4NzksLTIuMDY0NTU5IC0wLjQ3MjA3LDAgLTAuNDk2NzcsMC4zMTMzODMgLTAuNDk2NzcsNi4zMDE5NzcgMCw5LjE3OTg5MyAtMC4yNDI4OSw5LjczMTg1OSAtNS40OTE5MDYsMTIuNDgwNjc0IC0zLjcxMTE3NiwxLjk0MzQ3IC03LjM0MzE0Miw0LjYzNjQ5IC05LjczMDEzNiw3LjIxNDY2IC03LjkxMDc2OSw4LjU0NDM2IC0xMC42MzY4NjgsMjAuNjc2ODMgLTYuOTc3MzE1LDMxLjA1MjQ2IDEuNzMwOTI2LDQuOTA3NTUgMy45MTE2NTksOC4zMjEyMiA3Ljc1Nzk2NCwxMi4xNDQxNyA0LjczOTU0Myw0LjcxMDc1MSA5LjIxMTYzMSw3LjE0MjY3MSAxNi41NTgwNTMsOS4wMDQyNzEgMy42ODY3OSwwLjkzNDIzIDguMjI5MzcsMS4xMjQzMSAxMi4yNzk3NywwLjUxMzgyIHogbSAtMTcuNzMyNjMsLTcuODM3OCBjIC00LjM4MzM0LC0yLjMyODIxMSAtOC4wMTIwNzUsLTUuNzA2ODYxIC0xMC4zNjA3MzQsLTkuNjQ2NjkxIC0xLjUwNTAyNSwtMi41MjQ2NiAtMS42ODc5MjQsLTMuMzY3MjcgLTAuODMwNTA4LC0zLjgyNjE1IDEuMDEwNjI2LC0wLjU0MDg3IDEuNjQwOTIzLC0wLjA5ODYgMi44ODU3NzMsMi4wMjQ3MiAyLjA4OTc4NSwzLjU2NDU3IDUuNjc5Nzk4LDYuOTk5MDYgOS40ODc4ODksOS4wNzY4NyAxLjQ0MTI2LDAuNzg2MzkgMS43NzIyMiwxLjA5MTQ1MSAxLjg0MjE3LDEuNjk3OTgxIDAuMDk3OSwwLjg0OTMgLTAuMzM5MDksMS41MDExMiAtMS4wMDY0NiwxLjUwMTEyIC0wLjI1Mjc0LDAgLTEuMTYwOSwtMC4zNzI1MyAtMi4wMTgxMywtMC44Mjc4NSB6IG0gMjguMDg5NzQsMC4yMzk4MSBjIC0wLjY0MDE2LC0wLjkxMzk1IC0wLjUxOTkzLC0xLjE2ODg2IDEuMTA5NDgsLTIuMzUyMzgxIDAuODM2NzQsLTAuNjA3NzcgMi42NTgzNywtMi4yNTQ5MyA0LjA0ODA2LC0zLjY2MDM2IDIuMjQwMDgsLTIuMjY1NDUgMi42OTc4MywtMi44OTg5IDQuMDM1MjcsLTUuNTg0MDQgMi4yMTI2NiwtNC40NDIzMSAyLjg3MjY2LC02Ljk3ODQ4IDIuOTIyNjEsLTExLjIzMDggMC4wNDEyLC0zLjUwOTAzIC0wLjE5MTA1LC02LjA1MTEyIC0wLjYxNTY3LC02LjczODE4IC0wLjE5NzQsLTAuMzE5NCAtMC41NjUwNCwtMC4yMTkzNCAtMi4xOTYyNiwwLjU5Nzc3IC0zLjczNjg2LDEuODcxODUgLTguMTY5NzIsMi41ODQxNCAtMTIuNzU4MDcsMi4wNTAwMSAtNC44ODY4OCwtMC41Njg4OCAtNy42Mzk1NSwtMS40MzExMiAtMTUuMTI4MDYsLTQuNzM4NjkgLTQuOTg2OTUsLTIuMjAyNjcgLTkuMDcwODYsLTMuMjA5NDYgLTEzLjAxODc3MywtMy4yMDk0NiAtMy4wNzY5MjYsMCAtNS4xMTYzNCwwLjMzOTY3IC03LjQzOTYzLDEuMjM5MDcgLTIuMTA2MjI1LDAuODE1MzcgLTIuNTA2NTI1LDEuMjU1MzYgLTMuMTc0NDE2LDMuNDg5MTQgLTEuMTcxMzgzLDMuOTE3NzMgLTEuMTU4MDM2LDguNDEyNDUgMC4wMzg4NSwxMy4wODIxMSAwLjY1NjUzOCwyLjU2MTUgMC41NDU2NzIsMy4xNjI2NiAtMC42MDkwODgsMy4zMDI3MyAtMS4yMDM4NDksMC4xNDYwMiAtMS45Nzc1MjMsLTEuNDg4NyAtMi43Mjk0OTMsLTUuNzY3MjEgLTAuNjU3OTcyLC0zLjc0MzcgLTAuNDYwNzUzLC02Ljk5OTk2IDAuNjg3MDI1LC0xMS4zNDM0NCAwLjk1NTM1NSwtMy42MTUzMSAxLjUyNzM3NywtNC4yMDk4NiA1LjMzOTM5LC01LjU0OTY3IDUuMTkxNDU2LC0xLjgyNDY1IDEzLjQwNjkyNSwtMS4yOTQ0OSAxOS44OTgwMzUsMS4yODQwNSBsIDIuMDkwNjYsMC44MzA1IDMuNTgzMTcsLTEuMTk0NTEgYyA1LjMyMDQ3LC0xLjc3MzY5IDkuMTc3MjUsLTIuMzYxNzMgMTQuNDMxMDgsLTIuMjAwMyAyLjQyMDYxLDAuMDc0NCA1LjAxNjQ3LDAuMzA5IDYuMDYyMjQsMC41NDc5MyAyLjA3MTgsMC40NzMzNiA1LjAyMywxLjc3NDQ1IDUuOTA3NDUsMi42MDQ0MSAxLjM1MTE5LDEuMjY3OTUgMi40NTAzLDYuMDMyMDkgMi40NDk3NCwxMC42MTg0OCAtOS40ZS00LDcuNjM3MzIgLTIuNTk1NTYsMTQuMjc3MzIgLTcuNjU0NDEsMTkuNTg4NzEgLTIuMDAyMzYsMi4xMDIzMyAtNS42NTUxMiw0LjkyMjE3MSAtNi4zNzYwNiw0LjkyMjE3MSAtMC4yNzAxOSwwIC0wLjY3NjYsLTAuMjY0NjIgLTAuOTAzMTMsLTAuNTg4MDQgeiBtIDUuMzEzNTMsLTMwLjIxNzE5MSBjIDIuNDYxNDksLTAuNzgyNjIgNC41OTMzNCwtMS44OTAyMyA0LjU5MzM0LC0yLjM4NjQ3IDAsLTAuODYxNjUgLTQuNzMzMjEsLTIuMzI5NTggLTguNTIyMjYsLTIuNjQzMDMgLTMuNTg2NjUsLTAuMjk2NzEgLTEwLjU4ODg0LDAuNzg3OTIgLTE0LjMzNzIxLDIuMjIwOCAtMC43MzQxOCwwLjI4MDY2IC0wLjc0NTQyLDAuMzA5NDggLTAuMjY0NTgsMC42NzgyMSAwLjcyODk1LDAuNTU5IDQuMjkyNzcsMS42Nzc1NiA3LjY0NTkzLDIuMzk5OCAzLjg3MTY1LDAuODMzOTMgNy43MTM5MywwLjczODg2IDEwLjg4NDc4LC0wLjI2OTMxIHogTSA2Mi45ODU4OSwzNC4zNjAyNSBjIDEuMzU0OTMsLTAuMzE0MzU3IDEuNDM5NjYsLTAuNDI3NTA4IDEuNjQ4MDYsLTIuMjAwNjMxIGwgMC4xNzgzOSwtMS41MTc3OTEgaCAtNS4yOTUzIC01LjI5NTMgbCAwLjMzNDI2LDEuNjAxNzc5IGMgMC4xODM4NSwwLjg4MDk3OSAwLjM4NDUxLDEuNjUyMDMgMC40NDU5MywxLjcxMzQ0NiAwLjU2Mjg1LDAuNTYyODU1IDYuMDkyMjUsMC44NDIwOTQgNy45ODM5NiwwLjQwMzE5NyB6IG0gMTAuMjI1MDQsLTYuODQ0MDk2IGMgMC40MzI2LC0wLjM1MDI5MiAwLjYyODU3LC0wLjg1NDM3NiAwLjcyNTg4LC0xLjg2NzEwOCAwLjEyMDM2LC0xLjI1MjYwNSAwLjA2MDksLTEuNDYyODU5IC0wLjYxMjc3LC0yLjE2NTk5MyBMIDcyLjU3Nzk4LDIyLjcwNDMyOCBIIDU5LjgxMjQxIGMgLTcuODE1NTcsMCAtMTMuMDMzNjksMC4xMDE5NDIgLTEzLjQ1NzA0LDAuMjYyOSAtMC44NjQ0MjIsMC4zMjg2NTEgLTEuNTEyNzUsMS43ODY2NSAtMS4yODk5MTUsMi45MDA4MjggMC4wODk2OSwwLjQ0ODQ2MSAwLjUxNDA1MSwxLjExMDcwOSAwLjk0MzAxNSwxLjQ3MTY2MSBsIDAuNzc5OTQsMC42NTYyNzcgaCAxMi45MTQ5OCBjIDEyLjA3ODIsMCAxMi45NTMzNiwtMC4wMzEwOSAxMy41MDc1NCwtMC40Nzk4NCB6IG0gLTYuNDgxNDcsLTcuNzg4Mzg5IGMgMC4zOTQzMSwtMS4wNzUxOTUgMS42OTgzNCwtOS4wNTEzNjcgMS41MTA1MiwtOS4yMzkxODggLTAuMzIwMzksLTAuMzIwMzkyIC0zLjc1NzI1LC0wLjkzNDY2NDYgLTYuNDEwOTIsLTEuMTQ1ODI4NiAtMi4zMDI3NCwtMC4xODMyNCAtNy40MjIwNywwLjE3ODU1NyAtOS44MjgyNCwwLjY5NDU4ODYgbCAtMS4zNDYyNywwLjI4ODcyMiAwLjEzOTM0LDAuOTYzNjE0IGMgMC4yODA4MiwxLjk0MjExIDEuNTE4NSw4LjMwMzY1MiAxLjY2MDEsOC41MzI3NjUgMC4wODAyLDAuMTI5ODMxIDMuMjk3NzUsMC4yMzYwNTYgNy4xNTAwMywwLjIzNjA1NiA1LjM2MjI1LDAgNy4wMzI1OCwtMC4wNzc1MyA3LjEyNTQ0LC0wLjMzMDcyOSB6IG0gLTQuMDUzNzMsLTIuNjMyNjA0IGMgLTAuNDQ5NTcsLTAuNDQ5NTY5IC0wLjM5Mzg2LC0yLjEwMTU3MyAwLjA5NDQsLTIuNzk4NjI4IDAuNTM4ODgsLTAuNzY5MzY0IDEuMzIzNTQsLTAuNzQ3NDcxIDEuODQ3MDcsMC4wNTE1NCAwLjM0MTcyLDAuNTIxNTMzIDAuMzY2NzMsMC44MzM5MjEgMC4xMzU1MiwxLjY5MjU4NiAtMC4zNSwxLjI5OTc5NSAtMS4zMzI3MywxLjc5ODc0MyAtMi4wNzY5NywxLjA1NDUwNiB6IgogICAgICAgaWQ9InBhdGgxIiAvPjwvZz48L3N2Zz4K',
            items: [
                {
                    type: 'button',
                    command: 'insertIncreaseVigourAction',
                    label: 'Increase VIGOUR'
                },
                {
                    type: 'button',
                    command: 'insertDecreasePsiAction',
                    label: 'Decrease PSI'
                },
                {
                    type: 'button',
                    command: 'insertRestoreAgilityAction',
                    label: 'Restore AGILITY'
                },
                {
                    type: 'button',
                    command: 'insertYouDieAction',
                    label: 'Die'
                }
            ]
        },
        {
            type: 'menu',
            label: 'Insert Chance...',
            icon: 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjxzdmcKICAgd2lkdGg9IjQ1MCIKICAgaGVpZ2h0PSI0NTAiCiAgIHZpZXdCb3g9IjAgMCAxMTkuMDYyNSAxMTkuMDYyNSIKICAgdmVyc2lvbj0iMS4xIgogICBpZD0ic3ZnMSIKICAgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIKICAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogICB4bWxuczpzdmc9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcwogICAgIGlkPSJkZWZzMSIgLz48ZwogICAgaWQ9ImxheWVyMSI+PHBhdGgKICAgICAgIHN0eWxlPSJmaWxsOiMwMDAwMDA7c3Ryb2tlOiMwMDAwMDA7c3Ryb2tlLXdpZHRoOjEuMzIyOTI7c3Ryb2tlLWRhc2hhcnJheTpub25lO3N0cm9rZS1vcGFjaXR5OjEiCiAgICAgICBkPSJtIDU4LjMyOTY5OSwxMDcuMDI0ODcgYyAtMS4xMTk3OTMsLTAuMjQ2NCAtMi4yMDQxMTgsLTAuNzY0MDUgLTQuNjMwMjA4LC0yLjIxMDQyIC0xLjM4MjQ0OCwtMC44MjQxNyAtNi42MjExOTgsLTMuOTE3OTIgLTExLjY0MTY2NywtNi44NzQ5OTYgQyAyMi4zMDgwODEsODYuMzA2Nzg1IDIxLjQ4Njk2MSw4NS44MDExMjcgMjAuNTI4NTA5LDg0LjY4MTM5MiAxOC43MDQ3MjMsODIuNTUwNzA4IDE4Ljc3NDQ5MSw4My41NDk4OTQgMTguNzc0NDkxLDU5LjU2MDk1IGMgMCwtMjQuOTQ4ODk0IC0wLjEzOTg1OSwtMjMuNDI1MTk1IDIuMzc4NDgxLC0yNS45MTI0MTggMS4wMTc0MzEsLTEuMDA0ODU5IDIuOTAzOTUzLC0yLjI3OTM3IDYuMDk1OTA0LC00LjExODMxNiAyLjU0MjM2OSwtMS40NjQ3MSA4LjU1MTU1MiwtNC45Njc2MTIgMTMuMzUzNzQsLTcuNzg0MjI3IDE3Ljg5NzUyOCwtMTAuNDk3Mzk0IDE2LjkyOTc1NywtMTAuMDI2MjEgMTkuOTg5MTU3LC05LjczMjI0IDEuODE2OTYzLDAuMTc0NTg3IDEuOTI4OTUxLDAuMjM1MzczIDE4LjY0MDAxLDEwLjExNzYyOCAyLjc2NDg5NiwxLjYzNTA1IDcuODI1MDUyLDQuNjE1NjI5IDExLjI0NDc5MSw2LjYyMzUwOSA2LjUwOTg0OCwzLjgyMjIyIDcuNDIwMjk2LDQuNDQ4OTY1IDguNDA4OTEyLDUuNzg4NjMxIDEuNDE3MDM0LDEuOTIwMTk1IDEuNDA2ODE0LDEuNzM4MjU5IDEuNDA0MDU0LDI1LjAwMDcyIC0wLjAwMiwxOS4xODMwNzEgLTAuMDQ5NSwyMS42NzE1MjYgLTAuNDMzNTQ0LDIyLjgyNzYyNCAtMC44MjM0MSwyLjQ3OTA3MyAtMS45Nzg3OTQsMy4zNDY2NzEgLTEzLjM0ODE3MiwxMC4wMjM0MDQgLTUuNzQ4MDcyLDMuMzc1NTg5IC0xMi43MTMyMjksNy40NzUxNDkgLTE1LjQ3ODEyNSw5LjExMDEyNSAtMi43NjQ4OTUsMS42MzQ5OCAtNS44NjA1MiwzLjQ2MDc3IC02Ljg3OTE2Niw0LjA1NzMgLTIuMzM2NTExLDEuMzY4MyAtNC4xNjI3MTksMS44MjcwNCAtNS44MjA4MzQsMS40NjIxOCB6IE0gNTcuNjAzNjE4LDU4Ljk5Nzc5MiBDIDU2LjM4NjcwOCw1OC4yNDQxMyA0MC4zNDgxNDcsNDguODE1Njg5IDMwLjE1MTU3NCw0Mi44NTk4MTIgTCAyMi4wODE3ODMsMzguMTQ2MiAyMi4wMDY0NTMsNTkuMTE0NTU0IGMgLTAuMDQxNDMsMTEuNTMyNTk1IC0wLjAwNjksMjEuMzUxODAzIDAuMDc2NjcsMjEuODIwNDYyIDAuMDgzNiwwLjQ2ODY1OSAwLjQ0NzA1NiwxLjIwMjc1IDAuODA3NjY4LDEuNjMxMzE0IDAuNjQzNjc4LDAuNzY0OTY3IDEuMzc2MTksMS4yMjQ2MzEgMTAuMTcxMjAyLDYuMzgyNTk4IDIuNDAxMDk0LDEuNDA4MTU4IDguNjA4MjQzLDUuMDY4MjIyIDEzLjc5MzY2Niw4LjEzMzQ3NyA1LjE4NTQyMywzLjA2NTI1NSA5Ljc2OTMyOSw1Ljc1MjAxNSAxMC4xODY0NTksNS45NzA1NzUgbCAwLjc1ODQxNywwLjM5NzM5IDAuMDY3NjcsLTIyLjEyMzM5OSBjIDAuMDUzNjEsLTE3LjUyNTc2OSAtMC4wMDE0LC0yMi4xNjYxNyAtMC4yNjQ1ODMsLTIyLjMyOTE3OSB6IG0gLTguNjA0MjA0LDMzLjc0NDI0MiBjIC00LjY1MzQ4OSwtMi4yOTM4MyAtNi41MDE4OTUsLTEwLjYzOTA4OSAtMi41NzQ3ODIsLTExLjYyNDczMSAyLjU4MzQ0NywtMC42NDg0MDQgNi4yNDQ5MjIsMy4wOTU2NjMgNi45ODYxOTIsNy4xNDM3OCAwLjY4OTA4MSwzLjc2MzEwOCAtMS40NTMxODIsNS45MzkxNDEgLTQuNDExNDEsNC40ODA5NTEgeiBNIDMwLjI2OTEsNjAuMTM2OTk1IGMgLTMuNjA1NjE2LC0xLjYzNzcyIC01Ljg2NjA1NiwtOC4wNzI2MjIgLTMuNzU0NDYxLC0xMC42ODgwMDIgMi45OTY3ODksLTMuNzExNzY0IDkuOTEwMDg1LDQuMjQ0NzA1IDguMDEwMzU3LDkuMjE5MDcxIC0wLjcyMzcwNywxLjg5NTAwMSAtMi4xOTc3NDksMi40MDM3NyAtNC4yNTU4OTYsMS40Njg5MzEgeiBtIDM4LjEyMTUxNSwzOS4yNDk0OTkgYyAzLjYzNDMwOSwtMi4xNTAzMTMgOC4yNzQ3MDksLTQuODg1MDAxIDEwLjMxMjAwMSwtNi4wNzcwODkgMTIuMTc0NDI4LC03LjEyMzY2NiAxNi41MDMxODgsLTkuNzkwOTk5IDE3LjM5NjM1NCwtMTAuNzE5NDMyIDAuOTc2OTI4LC0xLjAxNTUwMyAwLjk5MjYxOSwtMS4wNjUwOTUgMS4wMjAxOTIsLTMuMjI0NDIzIDAuMTE3ODU5LC05LjIyOTc2IDAuMTEwNDMyLC0zOS42MjAxMyAtMC4wMDk5LC00MC4zMTgzMiBsIC0wLjE1MDM5NiwtMC44NzMyNDYgLTYuNDgyMjkyLDMuODEyNzc5IGMgLTMuNTY1MjYsMi4wOTcwMjggLTExLjYzMTc0NCw2LjgxNjQwNSAtMTcuOTI1NTIsMTAuNDg3NTAzIGwgLTExLjQ0MzIzLDYuNjc0NzI1IFYgODEuMzUyMDcgYyAwLDE3Ljg5MDU3NCAwLjA2NTU1LDIyLjE3NzkyIDAuMzM3NDc5LDIyLjA3MzU3IDAuMTg1NjEzLC0wLjA3MTIgMy4zMTEwMDMsLTEuODg4ODQgNi45NDUzMTIsLTQuMDM5MTQ2IHogbSAtMS40MDU3MTYsLTUuMjc5MjQ2IGMgLTMuNTE1MzEyLC0xLjU0MDE0NyAtMC43NjA5ODgsLTkuOTU2NTMyIDMuNjk1MjgsLTExLjI5MTY2MiAwLjg1NTk2MSwtMC4yNTY0NTIgMS4xODE3MzksLTAuMjM1NzE0IDEuOTM0MjM4LDAuMTIzMTI4IDEuMzE1OTg3LDAuNjI3NTUgMS44MTY1OTIsMS43NzAyOCAxLjY1NTM3NCwzLjc3ODcxNiAtMC4zNzIyMzIsNC42MzcyMTkgLTQuMzUyMzMyLDguNjc0NjQ2IC03LjI4NDg5Miw3LjM4OTgxOCB6IE0gODUuNjM2NjE4LDgyLjMyNzcyOSBjIC0xLjQ5MjI2MiwtMS4xNzM4MTMgLTEuNTg1MTE3LC0zLjgzODI5OSAtMC4yMzQzNTYsLTYuNzI0ODEgMS44NzMzODUsLTQuMDAzMzMyIDUuMjcyNjgzLC01Ljc2NDAyNiA3LjE4OTM3OSwtMy43MjM3OTcgMS42MzM3OTQsMS43MzkwOTQgMC44MjYxMDQsNi4yMDk5OTMgLTEuNjI2NTAzLDkuMDAzMzU3IC0xLjYzNzEyNywxLjg2NDU4NSAtMy45ODU2MzEsMi41MDE1NjggLTUuMzI4NTIsMS40NDUyNSB6IG0gLTkuNTI1LC01LjgyMDgzMyBjIC0yLjEyOTcxMiwtMS42NzUyMzEgLTEuMTgxNDk2LC02Ljc0NDQxNyAxLjgwNDQwMSwtOS42NDYzNzcgMi45Mzc5MiwtMi44NTUzMzEgNS45NDU5NzIsLTEuODQwMDk2IDUuOTQ1OTcyLDIuMDA2OCAwLDQuOTQ5MDUzIC00Ljk1NzkzNCw5LjgzNjExIC03Ljc1MDM3Myw3LjYzOTU3NyB6IG0gLTkuMjE3MDM1LC01LjkzODUwMSBjIC0xLjY5NzY4NywtMC45NTM1MjcgLTEuOTIwODgyLC0zLjk2Mzc0MiAtMC41MTQ0MDUsLTYuOTM3NzM3IDEuODM4OTIzLC0zLjg4ODQwMSA0LjkzOTc5NywtNS42MTg1MzcgNi45MDgzNTIsLTMuODU0NTIxIDEuOTA0NjI5LDEuNzA2NzMzIDEuNDA5NDI2LDUuNjQxODA4IC0xLjExMzQ4Niw4Ljg0ODE4NyAtMS40NzQ1MjEsMS44NzM5NzUgLTMuODQ4ODkyLDIuNzQ4MTMgLTUuMjgwNDYxLDEuOTQ0MDcxIHogTSA4Ni4yNjg3NDcsNTkuMjQzMDcgYyAtMS45NTkyMDksLTEuMDA2ODc2IC0yLjMyODg4NCwtMy43OTg0MDkgLTAuOTA1NzQ5LC02LjgzOTU4IDEuNDAyMDA0LC0yLjk5NjAxMiAzLjQyNDE1LC00LjczMjA0MSA1LjUxMTkzOCwtNC43MzIwNDEgMS4xOTI5OCwwIDIuMTAwOTAzLDAuODU0MzQ4IDIuNTA1NzcsMi4zNTc5MDcgMC44MDQ2MDEsMi45ODgwNjMgLTEuNTc5MDQ5LDcuNjczMTUyIC00LjYwMjU0MSw5LjA0NjM0MyAtMS4yNzQ2MzcsMC41Nzg5MDcgLTEuNjU4Nzg0LDAuNjA0NTI5IC0yLjUwOTQxOCwwLjE2NzM3MSB6IE0gNjEuNDQ1MDM5LDU1LjM4NTcxIGMgMC45MDU5MzgsLTAuNTU5MzQ0IDguNzMxMzc5LC01LjE2MjcxIDE3LjM4OTg2OSwtMTAuMjI5NzAxIDguNjU4NDg5LC01LjA2Njk5MiAxNS45MDMwMTIsLTkuMzU3ODA5IDE2LjA5ODkzOSwtOS41MzUxNSAwLjQwNjY4LC0wLjM2ODEgLTAuMjE0ODY0LC0wLjc1MTU5MSAtMjAuNTgwMjEyLC0xMi42OTc5MiAtMTIuMDIzMDA1LC03LjA1MjcwNSAtMTMuODIxODcsLTguMDIyMjIgLTE0LjkzMjg3MiwtOC4wNDgyMSAtMC43MzYwNjcsLTAuMDE3MjIgLTIuNzc1OTYxLDEuMDgxOTcxIC0xMS4zMzkzMzQsNi4xMTAxNiAtNC4yNTg4NjgsMi41MDA2OTcgLTkuNDEwMjcxLDUuNTIxMDM5IC0xMS40NDc1NjMsNi43MTE4NzEgLTYuOTUzODczLDQuMDY0NjU5IC0xMi40MzUxNTMsNy4zMjcwNjkgLTEyLjY1MDg3NSw3LjUyOTY5IC0wLjExODUwMiwwLjExMTMwNiAxLjM2OTc3OSwxLjEzMTE2NiAzLjMwNzI5MiwyLjI2NjM1NSAxLjkzNzUxMiwxLjEzNTE5IDUuNzg0OTM3LDMuMzk2MzcyIDguNTQ5ODMzLDUuMDI0ODQ5IDIwLjAyMDI1MiwxMS43OTE1ODggMjMuNTcxMTQ3LDEzLjg2NTc4NiAyMy43NTI4MzksMTMuODc0ODM3IDAuMTEyNzA4LDAuMDA1NiAwLjk0NjE0NSwtMC40NDc0MzcgMS44NTIwODQsLTEuMDA2NzgxIHogTSA1Ni42MDk5MDgsMzguODI3MDM1IGMgLTUuMjY3ODYzLC0xLjQ2MTk3MyAtNS44OTEwNjIsLTUuNDQ2MTE0IC0xLjE5MDYyNSwtNy42MTE3MTMgMS4xMjAzNzUsLTAuNTE2MTgzIDEuNzQ4MjUzLC0wLjYwODE0OSA0LjEwMTA0MSwtMC42MDA2ODYgMy4yODg4OTksMC4wMTA0MyA0Ljk2ODU4MSwwLjU5OTQ5IDYuNDgwMDgxLDIuMjcyNTM5IDEuNDM1MDcxLDEuNTg4NDUzIDEuMTc1ODgxLDMuMjI5ODA1IC0wLjc0OTE0MSw0Ljc0NDAyOCAtMS43NjA2ODksMS4zODQ5NTggLTUuODk3MjUxLDEuOTU3Mzk1IC04LjY0MTM1NiwxLjE5NTgzMiB6IgogICAgICAgaWQ9InBhdGgxIgogICAgICAgIC8+PC9nPjwvc3ZnPgo=',
            items: [
                {
                    type: 'button',
                    command: 'insertEasyChanceRoll',
                    label: 'Easy'
                },
                {
                    type: 'button',
                    command: 'insertMediumChanceRoll',
                    label: 'Medium'
                },
                {
                    type: 'button',
                    command: 'insertHardChanceRoll',
                    label: 'Hard'
                }
            ]
        }
    ]
}

this.editorExtensions = {
    twine: {
        '^2.9.0': {
            'references': {
                parsePassageText(text) {
                    return getPassageReferences(text)
                }
            },
            'codeMirror': {
                'commands': {
                    insertEasyCombat,
                    insertMediumCombat,
                    insertMediumWithFatal,
                    insertHardCombat,
                    insertHardWithFatal,
                    insertIncreaseVigourAction,
                    insertDecreasePsiAction,
                    insertRestoreAgilityAction,
                    insertYouDieAction,
                    insertEasyChanceRoll,
                    insertMediumChanceRoll,
                    insertHardChanceRoll
                },
                mode() {
                    return {
                        startState() {
                            return {}
                        },
                        token(stream, state) {
                            return parseToken(stream, state)
                        }
                    }
                },
                toolbar(editor, environment) {
                    return bbToolbar()
                }
            }
        }
    }
}