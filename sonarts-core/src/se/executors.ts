/*
 * SonarTS
 * Copyright (C) 2017-2017 SonarSource SA
 * mailto:info AT sonarsource DOT com
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program; if not, write to the Free Software Foundation,
 * Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */
import * as ts from "typescript";
import * as tsutils from "tsutils";
import { createLiteralSymbolicValue, createUnknownSymbolicValue, createUndefinedSymbolicValue } from "./symbolicValues";
import { ProgramState } from "./programStates";

interface Executor {
  (element: ts.Node, state: ProgramState, program: ts.Program): ProgramState;
}

const identifierExecutor: Executor = (element, state, program) => {
  if (tsutils.isIdentifier(element)) {
    const symbol = program.getTypeChecker().getSymbolAtLocation(element);
    const sv = state.sv(symbol) || createUnknownSymbolicValue();
    return state.pushSV(sv);
  }
  return state;
};

const literalExecutor: Executor = (element, state, _program) => {
  if (tsutils.isNumericLiteral(element)) {
    const sv = createLiteralSymbolicValue(element.text);
    return state.pushSV(sv);
  }
  return state;
};

const variableDeclarationExecutor: Executor = (element, state, program) => {
  if (tsutils.isVariableDeclaration(element) && tsutils.isIdentifier(element.name)) {
    return assign(element.name, element.initializer, state, program);
  } else if (!!element.parent && tsutils.isVariableDeclaration(element.parent) && element.parent.name === element) {
    return variableDeclarationExecutor(element.parent, state, program);
  }
  return state;
};

const assignmentExecutor: Executor = (element, state, program) => {
  if (
    tsutils.isBinaryExpression(element) &&
    element.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
    tsutils.isIdentifier(element.left)
  ) {
    return assign(element.left, element.right, state, program);
  }

  return state;
};

function assign(
  variableIdentifier: ts.Identifier,
  value: ts.Expression | undefined,
  state: ProgramState,
  program: ts.Program,
) {
  const { getSymbolAtLocation } = program.getTypeChecker();
  const variable = getSymbolAtLocation(variableIdentifier);
  let valueSV;
  if (value) {
    [valueSV, state] = state.popSV();
  } else {
    valueSV = createUndefinedSymbolicValue();
  }
  return state.pushSV(valueSV).setSV(variable, valueSV);
}

const EXECUTORS: Executor[] = [literalExecutor, identifierExecutor, variableDeclarationExecutor, assignmentExecutor];

/** Apply all executor. Only one must match. */
export function applyExecutors(element: ts.Node, state: ProgramState, program: ts.Program): ProgramState {
  let changed = false;
  let newState = state;
  EXECUTORS.forEach(executor => {
    newState = executor(element, newState, program);
    if (changed && newState !== state) {
      throw new Error("Two or more executors executed");
    }
  });
  return newState;
}
