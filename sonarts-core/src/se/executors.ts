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
import { createLiteralSymbolicValue, createUnknownSymbolicValue } from "./symbolicValues";
import { ProgramState } from "./programStates";

interface Executor {
  (element: ts.Node, state: ProgramState, program: ts.Program): ProgramState;
}

const variableDeclarationExecutor: Executor = (element, state, program) => {
  if (tsutils.isVariableDeclaration(element)) {
    const { getSymbolAtLocation } = program.getTypeChecker();
    const symbol = getSymbolAtLocation(element.name);

    if (element.initializer !== undefined && tsutils.isNumericLiteral(element.initializer)) {
      const sv = createLiteralSymbolicValue(element.initializer.text);
      return state.setSV(symbol, sv);
    }

    if (element.initializer !== undefined && tsutils.isIdentifier(element.initializer)) {
      const initializerSymbol = getSymbolAtLocation(element.initializer);
      const sv = state.sv(initializerSymbol);
      return sv ? state.setSV(symbol, sv) : state;
    }

    const sv = createUnknownSymbolicValue();
    return state.setSV(symbol, sv);
  }

  return state;
};

const binaryExpressionExecutor: Executor = (element, state, program) => {
  if (
    tsutils.isBinaryExpression(element) &&
    element.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
    tsutils.isIdentifier(element.left) &&
    tsutils.isIdentifier(element.right)
  ) {
    const { getSymbolAtLocation } = program.getTypeChecker();
    const leftSymbol = getSymbolAtLocation(element.left);
    const rightSymbol = getSymbolAtLocation(element.right);
    const rightSV = state.sv(rightSymbol);
    return rightSV ? state.setSV(leftSymbol, rightSV) : state;
  }

  return state;
};

const EXECUTORS: Executor[] = [variableDeclarationExecutor, binaryExpressionExecutor];

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
