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
import { Program, CompilerOptions, createProgram, createCompilerHost } from "typescript";

let strictProgram: Program;
let oldCompilerOptions: CompilerOptions;

export default function getStrictProgram(oldProgram: Program) {
  const compilerOptions = oldProgram.getCompilerOptions();
  if (isStrict(compilerOptions)) {
    return oldProgram;
  }
  if (!strictProgram || JSON.stringify(compilerOptions) !== JSON.stringify(oldCompilerOptions)) {
    strictProgram = makeStrict(oldProgram);
  }
  return strictProgram;
}

function isStrict(compilerOptions: CompilerOptions) {
  return compilerOptions.strict;
}

function makeStrict(oldProgram: Program) {
  oldCompilerOptions = oldProgram.getCompilerOptions();
  const strictCompilerOptions = { ...oldCompilerOptions, strict: true };
  const host = createCompilerHost(strictCompilerOptions, true);
  return createProgram(oldProgram.getRootFileNames(), strictCompilerOptions, host);
}
