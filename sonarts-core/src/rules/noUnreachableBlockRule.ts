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
import * as tslint from "tslint";
import * as ts from "typescript";
import * as tsutils from "tsutils";
import { SonarRuleMetaData } from "../sonarRule";
import { descendants, is } from "../utils/navigation";
import { SymbolicExecution } from "../se/SymbolicExecution";

const { isTypeFlagSet } = tslint;

export class Rule extends tslint.Rules.TypedRule {
  public static metadata: SonarRuleMetaData = {
    ruleName: "no-unreachable-block",
    description: "Conditionally executed blocks should be reachable",
    rationale: tslint.Utils.dedent`
      Conditional expressions which are always "true" or "false" can lead to dead code. Such code is always buggy and 
      should never be used in production.`,
    optionsDescription: "",
    options: null,
    rspecKey: "RSPEC-2583",
    type: "functionality",
    typescriptOnly: false,
  };

  public static getMessage(value: string) {
    return `This condition always evaluates to "${value}".`;
  }

  public applyWithProgram(sourceFile: ts.SourceFile, program: ts.Program): tslint.RuleFailure[] {
    return program.getCompilerOptions().strict
      ? this.applyWithWalker(new Walker(sourceFile, this.getOptions(), program))
      : [];
  }
}

class Walker extends tslint.ProgramAwareRuleWalker {
  private readonly FALSY_VALUES = ['""', "false", "0"];

  protected visitFunctionDeclaration(node: ts.FunctionDeclaration) {
    const { body } = node;
    if (body) {
      const se = new SymbolicExecution(body.statements, this.getProgram());
      se.execute((node, programStates) => {
        if (
          tsutils.isBinaryExpression(node) &&
          node.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken &&
          tsutils.isIdentifier(node.left) &&
          tsutils.isIdentifier(node.right)
        ) {
          const leftSymbol = this.getProgram()
            .getTypeChecker()
            .getSymbolAtLocation(node.left);
          const rightSymbol = this.getProgram()
            .getTypeChecker()
            .getSymbolAtLocation(node.right);
          if (programStates.every(programState => programState.sv(leftSymbol) === programState.sv(rightSymbol))) {
            this.addFailureAtNode(node, Rule.getMessage("true"));
          }
        }
      });
    }
    super.visitFunctionDeclaration(node);
  }

  protected visitIfStatement(ifStatement: ts.IfStatement) {
    const result = this.evaluateExpression(ifStatement.expression);
    if (result !== undefined) {
      this.addFailureAtNode(ifStatement.expression, Rule.getMessage(String(result)));
    }
    super.visitIfStatement(ifStatement);
  }

  protected visitConditionalExpression(expression: ts.ConditionalExpression) {
    const result = this.evaluateExpression(expression.condition);
    if (result !== undefined) {
      this.addFailureAtNode(expression.condition, Rule.getMessage(String(result)));
    }
    super.visitConditionalExpression(expression);
  }

  evaluateExpression(condition: ts.Expression): boolean | undefined {
    const type = this.getTypeChecker().getTypeAtLocation(condition);

    // we know *nothing* about class properties
    if (this.containsKind(condition, ts.SyntaxKind.PropertyAccessExpression)) {
      return undefined;
    }

    if (this.isAlwaysTruthy(type)) {
      return true;
    }
    if (this.isAlwaysFalsy(type)) {
      return false;
    }

    return undefined;
  }

  isIdentifier(expression: ts.Expression): expression is ts.Identifier {
    return expression.kind === ts.SyntaxKind.Identifier;
  }

  isAlwaysTruthy = (type: ts.Type): boolean => {
    if (this.isUnionOrIntersectionType(type)) {
      return type.types.every(this.isAlwaysTruthy);
    }
    if (this.isLiteralType(type)) {
      return this.getTypeChecker().typeToString(type) === "true";
    }
    return !this.isAny(type) && !isTypeFlagSet(type, ts.TypeFlags.PossiblyFalsy);
  };

  isAlwaysFalsy = (type: ts.Type): boolean => {
    if (this.isUnionOrIntersectionType(type)) {
      return type.types.every(this.isAlwaysFalsy);
    }
    if (this.isLiteralType(type)) {
      ts.FlowFlags;
      return this.FALSY_VALUES.includes(this.getTypeChecker().typeToString(type));
    }
    return isTypeFlagSet(type, ts.TypeFlags.Undefined | ts.TypeFlags.Null | ts.TypeFlags.Void);
  };

  isAny(type: ts.Type) {
    return isTypeFlagSet(type, ts.TypeFlags.Any);
  }

  isUnionOrIntersectionType(type: ts.Type): type is ts.UnionType {
    return isTypeFlagSet(type, ts.TypeFlags.UnionOrIntersection);
  }

  isLiteralType(type: ts.Type) {
    return isTypeFlagSet(type, ts.TypeFlags.Literal);
  }

  containsKind(condition: ts.Expression, kind: ts.SyntaxKind) {
    return is(condition, kind) || descendants(condition).some(x => is(x, kind));
  }
}
