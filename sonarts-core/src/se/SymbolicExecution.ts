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
  private readonly programNodes = new Map<ts.Node, Set<ProgramState>>();

  constructor(statements: ts.NodeArray<ts.Statement>, program: ts.Program) {
    this.cfg = buildCfg(statements)!;
    this.program = program;
  }

  public execute(callback: SECallback) {
    const programState: ProgramState = ProgramState.empty();
    this.visitBlock(this.cfg.start, programState);
    this.processCallbacks(callback);
  }

  private readonly visitBlock = (block: CfgBlock, programState: ProgramState) => {
    for (const programPoint of block.getElements()) {
      programState = applyExecutors(programPoint, programState, this.program);
      if (!this.programNodes.has(programPoint)) {
        this.programNodes.set(programPoint, new Set());
      }
      this.programNodes.get(programPoint)!.add(programState);
    }
    for (const successor of block.getSuccessors()) {
      this.visitBlock(successor, programState);
    }
  };

  private readonly processCallbacks= (...callbacks: SECallback[]) => {
    this.programNodes.forEach((programStates, programPoint) => {
      callbacks.forEach(callback => callback(programPoint, [...programStates]));
    });
  }
}

export interface SECallback {
  (node: ts.Node, programStates: ProgramState[]): void;
}
