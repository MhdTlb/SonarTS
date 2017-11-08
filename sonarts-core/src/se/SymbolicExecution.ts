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
import { build as buildCfg } from "../cfg/builder";
import { ControlFlowGraph, CfgBlock } from "../cfg/cfg";
import { applyExecutors } from "./executors";
import { ProgramState } from "./programStates";

export class SymbolicExecution {
  private readonly cfg: ControlFlowGraph;
  private readonly program: ts.Program;

  constructor(statements: ts.NodeArray<ts.Statement>, program: ts.Program) {
    this.cfg = buildCfg(statements)!;
    this.program = program;
  }

  public execute(callback: SECallback) {
    const programState: ProgramState = ProgramState.empty();
    this.visitBlock(this.cfg.start, programState, callback);
  }

  private readonly visitBlock = (block: CfgBlock, programState: ProgramState, callback: SECallback) => {
    for (const element of block.getElements()) {
      programState = this.executeProgramNode(element, programState);
      callback(element, programState);
    }
  };

  private readonly executeProgramNode = (element: ts.Node, state: ProgramState): ProgramState => {
    return applyExecutors(element, state, this.program);
  };
}

export interface SECallback {
  (node: ts.Node, programState: ProgramState): void;
}
