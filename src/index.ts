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
  const result: IReporterOutput = await cruise([
    "/Users/byron1st/Workspace/research/references/fabric-gateway-v2/src",
  ]);
  const output = result.output as ICruiseResult;

  output.modules
    .filter((module) => !module.source.includes("/node_modules/"))
    .reduce(getDependencyRelations, [])
    .map(({ caller, callee }) => ({
      caller: path.resolve(caller.source),
      callee: resolveCallee(callee),
    }))
    .forEach((item) => console.log(JSON.stringify(item)));
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
    : callee.dependencyTypes[0] === "npm"
    ? removeAfterNodeModules(callee.resolved)
    : path.resolve(callee.resolved);
}

function removeAfterNodeModules(value: string): string {
  return value.slice(value.indexOf("/node_modules/") + "/node_modules/".length);
}

run().then(console.log).catch(console.error);
