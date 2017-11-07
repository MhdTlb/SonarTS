function b(x: number) {
  if (x) return 1;
}

function d(x: string) {
  if (x) return 1;
}

function e(x: boolean) {
  if (x) return 1;
}

function c(x: number[]) {
  if (x) return 1;
  //  ^ {{Change this condition so that it does not always evaluate to "true"; some subsequent code is never executed.}}
}

function f(x: null) {
  if (x) return 1;
}

function g(x: undefined) {
  if (x) return 1;
}

function i(x: void) {
  if (x) return 1;
}

function j(x: number[] | null) {
  if (x) return 1;
}

function k(x: number[] & null) {
  if (x) return 1;
}

function l(x: number[]) {
  return x ? 1 : 2;
  //     ^ {{Change this condition so that it does not always evaluate to "true"; some subsequent code is never executed.}}
}

function m(x: number) {
  return x ? 1 : 2;
}

export default 1;
