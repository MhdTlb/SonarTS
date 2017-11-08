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
import { build as buildCfg } from "../cfg/builder";
import { ControlFlowGraph, CfgBlock } from "../cfg/cfg";

export class SymbolicExecution {
  private readonly cfg: ControlFlowGraph;

  constructor(statements: ts.NodeArray<ts.Statement>, private readonly program: ts.Program) {
    this.cfg = buildCfg(statements)!;
  }

  public execute(callback: SECallback) {
    const programState: ProgramState = ProgramState.empty();
    this.visitBlockAndSuccessors(this.cfg.start, programState, callback);
  }

  private readonly visitBlockAndSuccessors = (block: CfgBlock, programState: ProgramState, callback: SECallback) => {
    for (const element of block.getElements()) {
      programState = this.executeProgramNode(element, programState);
      callback(element, programState);
    }
  };

  private readonly executeProgramNode = (element: ts.Node, currentState: ProgramState): ProgramState => {
    if (
      tsutils.isVariableDeclaration(element) &&
      element.initializer !== undefined &&
      tsutils.isNumericLiteral(element.initializer)
    ) {
      const symbol = this.program.getTypeChecker().getSymbolAtLocation(element.name);
      const sv = createLiteralSymbolicValue(element.initializer.text);
      return currentState.setSV(symbol, sv);
    }
    return currentState;
  };
}

export interface SECallback {
  (node: ts.Node, programState: ProgramState): void;
}

export interface LiteralSymbolicValue {
  type: "literal";
  value: string;
}

export type SymbolicValue = LiteralSymbolicValue;

export class ProgramState {
  public static empty() {
    return new ProgramState(new Map());
  }

  private readonly symbolicValues = new Map<ts.Symbol, SymbolicValue>();

  private constructor(symbolicValues: Map<ts.Symbol, SymbolicValue>) {
    this.symbolicValues = symbolicValues;
  }

  sv = (symbol: ts.Symbol): SymbolicValue | undefined => {
    return this.symbolicValues.get(symbol);
  };

  setSV = (symbol: ts.Symbol, sv: SymbolicValue) => {
    const newSymbolicValues = new Map<ts.Symbol, SymbolicValue>();
    this.symbolicValues.forEach((value, key) => newSymbolicValues.set(key, value));
    newSymbolicValues.set(symbol, sv);
    return new ProgramState(newSymbolicValues);
  };
}

function createLiteralSymbolicValue(value: string): LiteralSymbolicValue {
  return { type: "literal", value };
}