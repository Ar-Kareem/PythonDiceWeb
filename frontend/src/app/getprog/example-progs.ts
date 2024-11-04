


export const EXAMPLE_PROGS: {[key: number]: {name: string, prog: string}} = {
    9999: {
        "name": "Rolling String RV",
        "prog":"{\"DiceCode\":\"A: {1d2, \\\"water\\\", \\\"fire\\\"}\\n\\noutput(A)\\noutput(2dA)\\noutput(3dA)\\n\"}"
    },
    9998: {
        "name": "Setting default display type",
        "prog": "{\"DiceCode\":\"A: 3d6\\nB: 4d6\\n\\noutput A\\noutput B\\noutput A+B\\n\\noutput 0 named \\\"DISPLAY Graph At least\\\"\"}"
    },
}