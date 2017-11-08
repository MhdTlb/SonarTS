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
import { is } from "../../src/utils/navigation";
import { parseString } from "../../src/utils/parser";
import { SymbolicExecution, SECallback, ProgramState, LiteralSymbolicValue } from "../../src/se/SymbolicExecution";
import { identifier } from "babel-types";
import { join } from "path";

describe("Variable Declaration", () => {
  it("creates unknown symbolic value", () => {
    expect.assertions(1);
    run(`let x = foo(); _inspect(x);`, (node, programState, inspectedSymbols) => {
      expect(programState.sv(inspectedSymbols.get("x"))).toEqual({ type: "unknown" });
    });
  });

  it("creates literal symbolic value", () => {
    expect.assertions(1);
    run(`let x = 0; _inspect(x);`, (node, programState, inspectedSymbols) => {
      expect(programState.sv(inspectedSymbols.get("x"))).toEqual({ type: "literal", value: "0" });
    });
  });

  it("initializes with already known symbolic value", () => {
    expect.assertions(1);
    run(`let x = foo(); let y = x; _inspect(x, y);`, (node, programState, inspectedSymbols) => {
      expect(programState.sv(inspectedSymbols.get("x"))).toBe(programState.sv(inspectedSymbols.get("y")));
    });
  });
});

describe("Assignment", () => {
  it("assigns already known symbolic value", () => {
    expect.assertions(1);
    run(`let x = foo(); y = x; _inspect(x, y);`, (node, programState, inspectedSymbols) => {
      expect(programState.sv(inspectedSymbols.get("x"))).toBe(programState.sv(inspectedSymbols.get("y")));
    });
  });
});

function run(source: string, callback: SETestCallback) {
  const filename = "filename.ts";
  const host: ts.CompilerHost = {
    ...ts.createCompilerHost({ strict: true }),
    getSourceFile: () => ts.createSourceFile(filename, source, ts.ScriptTarget.Latest),
    getCanonicalFileName: () => filename,
  };
  const program = ts.createProgram([], { strict: true }, host);
  const sourceFile = program.getSourceFiles()[0];

  const se = new SymbolicExecution(sourceFile.statements, program);

  se.execute((node, programState) => {
    const map = isInspectNode(node, program);
    if (map) {
      callback(node, programState, map);
    }
  });
}

function isInspectNode(node: ts.Node, program: ts.Program): Map<string, ts.Symbol> | undefined {
  if (tsutils.isCallExpression(node) && tsutils.isIdentifier(node.expression) && node.expression.text === "_inspect") {
    const inspectedSymbols = new Map<string, ts.Symbol>();
    const identifiers = node.arguments.filter(tsutils.isIdentifier);
    identifiers.forEach(identifier =>
      inspectedSymbols.set(identifier.text, program.getTypeChecker().getSymbolAtLocation(identifier)),
    );
    return inspectedSymbols;
  }
  return undefined;
}

interface SETestCallback {
  (node: ts.Node, programState: ProgramState, inspectedSymbos: Map<string, ts.Symbol>): void;
}
