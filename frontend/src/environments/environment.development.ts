abstract class DebugModel {
    static dataProgs = {
      0: {"rvs":[[[[2,0.020833333333333332],[3,0.041666666666666664],[4,0.0625],[5,0.08333333333333333],[6,0.10416666666666667],[7,0.125],[8,0.125],[9,0.125],[10,0.10416666666666667],[11,0.08333333333333333],[12,0.0625],[13,0.041666666666666664],[14,0.020833333333333332]],"1d6 + 1d8, basically"],[[[1,0.020833333333333332],[2,0.0625],[3,0.10416666666666667],[4,0.14583333333333334],[5,0.1875],[6,0.22916666666666666],[7,0.125],[8,0.125]],"highest 1 of 1d6 and 1d8"],[[[1,0.020833333333333332],[2,0.0625],[3,0.10416666666666667],[4,0.14583333333333334],[5,0.1875],[6,0.22916666666666666],[7,0.125],[8,0.125]],"highest 1, pool 2, skill 7"],[[[1,0.015625],[2,0.046875],[3,0.078125],[4,0.109375],[5,0.140625],[6,0.171875],[7,0.203125],[8,0.234375]],"highest 1 of 2d8"],[[[2,0.003472222222222222],[3,0.010416666666666666],[4,0.024305555555555556],[5,0.041666666666666664],[6,0.06597222222222222],[7,0.09375],[8,0.12152777777777778],[9,0.1388888888888889],[10,0.14583333333333334],[11,0.13541666666666666],[12,0.1111111111111111],[13,0.06944444444444445],[14,0.03819444444444445]],"highest 2 of 1d6 and 2d8"],[[[2,0.003472222222222222],[3,0.010416666666666666],[4,0.024305555555555556],[5,0.041666666666666664],[6,0.06597222222222222],[7,0.09375],[8,0.12152777777777778],[9,0.1388888888888889],[10,0.14583333333333334],[11,0.13541666666666666],[12,0.1111111111111111],[13,0.06944444444444445],[14,0.03819444444444445]],"highest 2, pool 3, skill 7"],[[[2,0.0022675736961451248],[3,0.006802721088435374],[4,0.015873015873015872],[5,0.027210884353741496],[6,0.04308390022675737],[7,0.061224489795918366],[8,0.08390022675736962],[9,0.10430839002267574],[10,0.12018140589569161],[11,0.12698412698412698],[12,0.12471655328798185],[13,0.1111111111111111],[14,0.08843537414965986],[15,0.05442176870748299],[16,0.02947845804988662]],"highest 2, pool 3, skill 8"],[[[2,0.00007233796296296296],[3,0.0003616898148148148],[4,0.002242476851851852],[5,0.005787037037037037],[6,0.015263310185185185],[7,0.029296875],[8,0.05627893518518518],[9,0.08912037037037036],[10,0.13425925925925927],[11,0.1681857638888889],[12,0.18909143518518517],[13,0.15046296296296297],[14,0.1127025462962963],[15,0.03125],[16,0.015625]],"highest 2, pool 5, skill 7"]],"result":"1d6 + 1d8, basically 8.0 ± 2.86\n 2:  2.08  ██\n 3:  4.17  ███\n 4:  6.25  █████\n 5:  8.33  ██████\n 6: 10.42  ████████\n 7: 12.50  ██████████\n 8: 12.50  ██████████\n 9: 12.50  ██████████\n10: 10.42  ████████\n11:  8.33  ██████\n12:  6.25  █████\n13:  4.17  ███\n14:  2.08  ██\n----------------------------------------------------------------------------------------\nhighest 1 of 1d6 and 1d8 5.23 ± 1.81\n1:  2.08  ██\n2:  6.25  █████\n3: 10.42  ████████\n4: 14.58  ████████████\n5: 18.75  ███████████████\n6: 22.92  ██████████████████\n7: 12.50  ██████████\n8: 12.50  ██████████\n----------------------------------------------------------------------------------------\nhighest 1, pool 2, skill 7 5.23 ± 1.81\n1:  2.08  ██\n2:  6.25  █████\n3: 10.42  ████████\n4: 14.58  ████████████\n5: 18.75  ███████████████\n6: 22.92  ██████████████████\n7: 12.50  ██████████\n8: 12.50  ██████████\n----------------------------------------------------------------------------------------\nhighest 1 of 2d8 5.81 ± 1.88\n1:  1.56  █\n2:  4.69  ████\n3:  7.81  ██████\n4: 10.94  █████████\n5: 14.06  ███████████\n6: 17.19  ██████████████\n7: 20.31  ████████████████\n8: 23.44  ███████████████████\n----------------------------------------------------------------------------------------\nhighest 2 of 1d6 and 2d8 9.34 ± 2.56\n 2:  0.35  \n 3:  1.04  █\n 4:  2.43  ██\n 5:  4.17  ███\n 6:  6.60  █████\n 7:  9.38  ███████\n 8: 12.15  █████████\n 9: 13.89  ███████████\n10: 14.58  ███████████\n11: 13.54  ███████████\n12: 11.11  █████████\n13:  6.94  █████\n14:  3.82  ███\n----------------------------------------------------------------------------------------\nhighest 2, pool 3, skill 7 9.34 ± 2.56\n 2:  0.35  \n 3:  1.04  █\n 4:  2.43  ██\n 5:  4.17  ███\n 6:  6.60  █████\n 7:  9.38  ███████\n 8: 12.15  █████████\n 9: 13.89  ███████████\n10: 14.58  ███████████\n11: 13.54  ███████████\n12: 11.11  █████████\n13:  6.94  █████\n14:  3.82  ███\n----------------------------------------------------------------------------------------\nhighest 2, pool 3, skill 8 10.59 ± 2.92\n 2:  0.23  \n 3:  0.68  █\n 4:  1.59  █\n 5:  2.72  ██\n 6:  4.31  ███\n 7:  6.12  █████\n 8:  8.39  ███████\n 9: 10.43  ████████\n10: 12.02  █████████\n11: 12.70  ██████████\n12: 12.47  ██████████\n13: 11.11  █████████\n14:  8.84  ███████\n15:  5.44  ████\n16:  2.95  ██\n----------------------------------------------------------------------------------------\nhighest 2, pool 5, skill 7 11.3 ± 2.19\n 2:  0.01  \n 3:  0.04  \n 4:  0.22  \n 5:  0.58  \n 6:  1.53  █\n 7:  2.93  ██\n 8:  5.63  ████\n 9:  8.91  ███████\n10: 13.43  ██████████\n11: 16.82  █████████████\n12: 18.91  ███████████████\n13: 15.05  ████████████\n14: 11.27  █████████\n15:  3.12  ██\n16:  1.56  █\n----------------------------------------------------------------------------------------","parsed":"@max_func_depth()\n@anydice_casting()\ndef X_upper_X(X: int, D: int):\n  Y = X // 2\n  return roll(Y, D)\n\n@max_func_depth()\n@anydice_casting()\ndef X_smaller_X(X: int, D: int):\n  Y = X // 2\n  Z = X - Y\n  E = D - 2\n  return roll(Z, E)\n\n@max_func_depth()\n@anydice_casting()\ndef X_lower_X(X: int, D: int):\n  Y = X // 2\n  Z = X - Y\n  return roll(Z, D)\n\n@max_func_depth()\n@anydice_casting()\ndef highest_X_of_X_and_X(N: int, B: Seq, L: Seq):\n  J = 1\n  K = 1\n  SUM = 0\n  for I in get_seq([myrange(1, N)]):\n    BC = (J @ B)\n    LC = (K @ L)\n    if BC >= LC:\n      SUM = SUM + BC\n      J = J + 1\n    else:\n      SUM = SUM + LC\n      K = K + 1\n    \n  return SUM\n\n@max_func_depth()\n@anydice_casting()\ndef highest_X_of_X_skill_X(N: int, P: int, S: int):\n  if S // 2 == 0:\n    SFINAL = S\n    B = X_lower_X(P, SFINAL)\n  else:\n    SFINAL = S + 1\n    B = X_smaller_X(P, SFINAL)\n  \n  A = X_upper_X(P, SFINAL)\n  return highest_X_of_X_and_X(N, A, B)\n\noutput(X_upper_X(2, 8) + X_smaller_X(2, 8), named=f\"1d6 + 1d8, basically\")\noutput(highest_X_of_X_and_X(1, X_upper_X(2, 8), X_smaller_X(2, 8)), named=f\"highest 1 of 1d6 and 1d8\")\noutput(highest_X_of_X_skill_X(1, 2, 7), named=f\"highest 1, pool 2, skill 7\")\noutput(highest_X_of_X(1, roll(2, 8)), named=f\"highest 1 of 2d8\")\noutput(highest_X_of_X_and_X(2, X_upper_X(3, 8), X_smaller_X(3, 8)), named=f\"highest 2 of 1d6 and 2d8\")\noutput(highest_X_of_X_skill_X(2, 3, 7), named=f\"highest 2, pool 3, skill 7\")\noutput(highest_X_of_X_skill_X(2, 3, 8), named=f\"highest 2, pool 3, skill 8\")\noutput(highest_X_of_X_skill_X(2, 5, 7), named=f\"highest 2, pool 5, skill 7\")\n","time":395,"key":2},
    }
}

export const environment = {
    production: false,
    debugData: DebugModel,
};
