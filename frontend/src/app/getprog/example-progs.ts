


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
    },
    9996: {
        "name": "Simple DiceCode",
        "prog": "{\"DiceCode\":\"\\\\ example code \\\\ \\noutput 1d20 named \\\"Just D20\\\"\\noutput 3 @ 4d20 named \\\"3rd of 4D20\\\"\\n\\nfunction: dmg D:n saveroll S:n savetarget T:n {\\n  if S >= T {\\n    result: D/2\\n  } else {\\n    result: D\\n  }\\n}\\n\\noutput [dmg 4d6 saveroll d20+4 savetarget 16] named \\\"Lvl 4 Fireball, +4DEX vs 16DC\\\"\"}",
    },
    9995: {
        "name": "Simple Python",
        "prog": "{\"Python\":\"output(roll(1, 20), named=f\\\"Just D20\\\")\\noutput((3 @ roll(4, 20)), named=f\\\"3rd of 4D20\\\")\\n@max_func_depth()\\n@anydice_casting()\\ndef dmg_X_saveroll_X_savetarget_X(D: int, S: int, T: int):\\n  if S >= T:\\n    return D // 2\\n  else:\\n    return D\\n  \\noutput(dmg_X_saveroll_X_savetarget_X(roll(4, 6), roll(20) + 4, 16), named=f\\\"Lvl 4 Fireball, +4DEX vs 16DC\\\")\\n\"}"
    }
}