


export const EXAMPLE_PROGS: {[key: number]: {name: string, prog: string}} = {
    9999: {
        "name": "Rolling String RV",
        "prog":"{\"DiceCode\":\"A: {1d2, \\\"water\\\", \\\"fire\\\"}\\n\\noutput(A)\\noutput(2dA)\\noutput(3dA)\\n\"}"
    },
    9998: {
        "name": "Setting default display type",
        "prog": "{\"DiceCode\":\"A: 3d6\\nB: 4d6\\n\\noutput A\\noutput B\\noutput A+B\\n\\noutput 0 named \\\"DISPLAY Graph At least\\\"\"}"
    },
    9997: {
        "name": "Example GUI",
        "prog": "{\"DiceCode\":\"LVL: 2\\nMM: LVL+1\\n\\nRESIST: 0\\n\\nif RESIST = 0 {\\n  output (MMd4+MM) named \\\"LVL [LVL] Magic Missle\\\"\\n} else if RESIST = 1 {\\n  output (MMd4+MM)/2 named \\\"LVL [LVL] Magic Missle with resist\\\"\\n}\\n\",\"GUI Editor\":\"<dropdown var=\\\"LVL\\\" label=\\\"Spell Level\\\">\\n  <option label=\\\"level 1\\\" value=\\\"1\\\"></option>\\n  <option label=\\\"level 2\\\" value=\\\"2\\\"></option>\\n  <option label=\\\"level 3\\\" value=\\\"3\\\"></option>\\n  <option label=\\\"level 4\\\" value=\\\"4\\\"></option>\\n  <option label=\\\"level 5\\\" value=\\\"5\\\"></option>\\n</dropdown>\\n\\n<checkbox label=\\\"Resists Force Damage\\\" var=\\\"RESIST\\\"></checkbox>\\n\"}"
    }
}