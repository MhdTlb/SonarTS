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

export class ProgramState {
  public static empty() {
    return new ProgramState(new Map());
  }

  private readonly symbolicValues = new Map<ts.Symbol, SymbolicValue>();

  private constructor(symbolicValues: Map<ts.Symbol, SymbolicValue>) {
    this.symbolicValues = symbolicValues;
  }

  readonly sv = (symbol: ts.Symbol): SymbolicValue | undefined => {
    return this.symbolicValues.get(symbol);
  };

  readonly setSV = (symbol: ts.Symbol, sv: SymbolicValue) => {
    const newSymbolicValues = new Map<ts.Symbol, SymbolicValue>();
    this.symbolicValues.forEach((value, key) => newSymbolicValues.set(key, value));
    newSymbolicValues.set(symbol, sv);
    return new ProgramState(newSymbolicValues);
  };

  public toString(): string {
    const prettyEntries = new Map<string, SymbolicValue>();
    this.symbolicValues.forEach((value, key) => {
      prettyEntries.set(key.name, value);
    });
    return inspect(prettyEntries);
  }
}
