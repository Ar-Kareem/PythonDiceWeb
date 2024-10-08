from dice_calc import randvar

from dice_calc import funclib
from dice_calc.parser.parse_and_exec import pipeline

print(pipeline(to_parse='''

output (1d20 + 1d4 + 2) > 18


''', do_exec=True))
