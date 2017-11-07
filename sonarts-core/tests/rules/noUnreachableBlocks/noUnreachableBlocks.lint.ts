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
