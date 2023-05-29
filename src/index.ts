import * as path from "path";
import { cruise, IReporterOutput } from "dependency-cruiser";
import {
  ICruiseResult,
  IDependency,
  IModule,
} from "dependency-cruiser/types/cruise-result";

type DependencyRelation = {
  caller: IModule;
  callee: IDependency;
};

async function run() {
  const rootPath = getRootPath();

  const result: IReporterOutput = await cruise([rootPath]);
  const output = result.output as ICruiseResult;

  output.modules
    .filter((module) => !module.source.includes("/node_modules/"))
    .reduce(getDependencyRelations, [])
    .filter(({ callee }) => {
      return (
        callee.dependencyTypes[0] === "npm" ||
        callee.dependencyTypes[0] === "core"
      );
    })
    .map(({ caller, callee }) => ({
      caller: path.resolve(caller.source),
      callee: resolveCallee(callee),
    }))
    .forEach((item) => console.log(JSON.stringify(item)));
}

const flag = "--root";

export function getRootPath(): string {
  const index = process.argv.findIndex((arg) => arg === flag);
  if (index === -1 || process.argv.length < index + 2) {
    throw new Error(`Usage: ${flag} <rootPath>`);
  }

  return process.argv[index + 1];
}

function getDependencyRelations(
  list: DependencyRelation[],
  module: IModule
): DependencyRelation[] {
  return [
    ...list,
    ...module.dependencies.map((dep) => ({ caller: module, callee: dep })),
  ];
}

function resolveCallee(callee: IDependency): string {
  return callee.dependencyTypes[0] === "core"
    ? callee.module
    : removeAfterNodeModules(callee.resolved);
}

function removeAfterNodeModules(value: string): string {
  return value.slice(value.indexOf("/node_modules/") + "/node_modules/".length);
}

run().catch(console.error);
