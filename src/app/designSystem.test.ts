import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

const projectRoot = resolve(import.meta.dirname, '../..');

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);

    return entry.isDirectory()
      ? sourceFiles(path)
      : /\.(tsx?|css)$/.test(path) && !path.includes('.test.')
        ? [path]
        : [];
  });
}

describe('관리자 디자인 시스템 경계', () => {
  it('모든 화면의 기본 제어 부품과 import는 Astryx를 기준으로 유지한다', () => {
    const violations: string[] = [];

    const nativeControls = new Set([
      'button',
      'input',
      'select',
      'textarea',
      'table',
      'dialog',
      'progress',
      'a',
      'h1',
      'h2',
      'h3',
    ]);

    for (const file of sourceFiles(resolve(projectRoot, 'src')).filter((file) =>
      file.endsWith('.tsx')
    )) {
      const source = ts.createSourceFile(
        file,
        readFileSync(file, 'utf8'),
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX
      );

      const visit = (node: ts.Node) => {
        if (
          ts.isImportDeclaration(node) &&
          ts.isStringLiteral(node.moduleSpecifier)
        ) {
          const module = node.moduleSpecifier.text;

          if (module === 'antd' || module.startsWith('@ant-design/'))
            violations.push(`${file}: ${module}`);
        }

        if (
          (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) &&
          nativeControls.has(node.tagName.getText(source))
        )
          violations.push(`${file}: ${node.tagName.getText(source)}`);
        ts.forEachChild(node, visit);
      };

      visit(source);
    }

    expect(violations).toEqual([]);
  });

  it('모든 소스와 CSS에 이전 Ant Design 변수·선택자를 남기지 않는다', () => {
    const violations = sourceFiles(resolve(projectRoot, 'src')).flatMap(
      (file) => {
        const legacyStyles =
          readFileSync(file, 'utf8').match(/--ant-[\w-]+|\.ant-[\w-]+/g) ?? [];

        return legacyStyles.map((style) => `${file}: ${style}`);
      }
    );

    expect(violations).toEqual([]);
  });

  it('기존 UI 의존성을 제거하고 Tailwind와 Astryx를 함께 사용한다', () => {
    const manifest = JSON.parse(
      readFileSync(resolve(projectRoot, 'package.json'), 'utf8')
    ) as {
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
    };

    expect(manifest.dependencies).toHaveProperty('@astryxdesign/core');
    expect(manifest.dependencies).not.toHaveProperty('antd');
    expect(manifest.dependencies).not.toHaveProperty('@ant-design/cssinjs');
    expect(manifest.devDependencies).toHaveProperty('tailwindcss');
  });
});
