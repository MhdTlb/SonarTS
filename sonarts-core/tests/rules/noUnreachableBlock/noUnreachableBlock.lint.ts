function alwaysTrueIf(x: number[], y: {}) {
  if (x) return 1;
  //  ^ {{This condition always evaluates to "true".}}
  if (!!y) return 1;
  //  ^^^ {{This condition always evaluates to "true".}}  
}

function alwaysFalseIf(x: {}, y: undefined, z: null, w: void, u: undefined | null) {
  if (!x) return 1;
//    ^^ {{This condition always evaluates to "false".}}
  if (y) return 1;
//    ^ {{This condition always evaluates to "false".}}
  if (z) return 1;
//    ^ {{This condition always evaluates to "false".}}
  if (w) return 1;
//    ^ {{This condition always evaluates to "false".}}
  if (u) return 1;
//    ^ {{This condition always evaluates to "false".}}
  if ("") return 1;
//    ^^ {{This condition always evaluates to "false".}}
  if (0) return 1;
//    ^ {{This condition always evaluates to "false".}}
  if (NaN) return 1; // FN
}

function alwaysFalseIfByConstraint(x: string) {
  if (x === "") {
    if (x) {
//      ^ {{This condition always evaluates to "false".}}
    }
  }
}

function alwaysTrueTernary(x: number[]) {
  if (x) return 1;
//    ^ {{This condition always evaluates to "true".}}
}

function l(x: number[]) {
  return x ? 1 : 2;
//       ^ {{This condition always evaluates to "true".}}
}

function b(x: number) {
  if (x) return 1;
}

function d(x: string) {
  if (x) return 1;
}

function e(x: boolean) {
  if (x) return 1;
}

function j(x: number[] | null) {
  if (x) return 1;
}

function k(x: number[] & null) {
  if (x) return 1;
}

function m(x: number) {
  return x ? 1 : 2;
}

function n(x: any) {
  return x ? 1 : 2;
}

export default 1;
