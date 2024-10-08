from dice_calc import randvar
randvar.RV([1, 2, 3], [1, 2, 1]).output()

from dice_calc import funclib
from dice_calc.parser.parse_and_exec import pipeline

print(pipeline(to_parse='output 3d6', do_exec=True))
