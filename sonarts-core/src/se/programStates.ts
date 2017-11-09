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
import { SymbolicValue } from "./symbolicValues";
import { inspect } from "util";

type SymbolicValues = Map<ts.Symbol, SymbolicValue>;
type ExpressionStack = SymbolicValue[];

export class ProgramState {
  private readonly symbolicValues: SymbolicValues;
  private readonly expressionStack: ExpressionStack;

  public static empty() {
    return new ProgramState(new Map(), []);
  }

  private constructor(symbolicValues: SymbolicValues, expressionStack: ExpressionStack) {
    this.symbolicValues = symbolicValues;
    this.expressionStack = expressionStack;
  }

  sv(symbol: ts.Symbol): SymbolicValue | undefined {
    return this.symbolicValues.get(symbol);
  }

  setSV(symbol: ts.Symbol, sv: SymbolicValue) {
    const newSymbolicValues = new Map(this.symbolicValues);
    newSymbolicValues.set(symbol, sv);
    return new ProgramState(newSymbolicValues, this.expressionStack);
  }

  pushSV(sv: SymbolicValue): ProgramState {
    const newExpressionStack = [...this.expressionStack, sv];
    return new ProgramState(this.symbolicValues, newExpressionStack);
  }

  popSV(): [SymbolicValue, ProgramState] {
    const newExpressionStack = [...this.expressionStack];
    const sv = newExpressionStack.pop();
    if (!sv) {
      throw new Error("Nothing in the expression stack");
    }
    return [sv, new ProgramState(this.symbolicValues, newExpressionStack)];
  }

  toString() {
    const prettyEntries = new Map<string, SymbolicValue>();
    this.symbolicValues.forEach((value, key) => {
      prettyEntries.set(key.name, value);
    });
    return inspect(prettyEntries);
  }
}
