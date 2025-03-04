import path from "path";
import { State } from "../../state";
import { Paths } from "../../util";
import fs from "fs-extra";
import { buildSync, Command, Definition } from "./definition";

export const DotnetHandler: Definition = (opts: any) => {
  const dir = State.Function.artifactsPath(
    opts.root,
    path.join(opts.id, opts.srcPath)
  );
  const target = path.join(
    dir,
    path.basename(opts.handler).split(":")[0] + ".dll"
  );
  const cmd: Command = {
    command: "dotnet",
    args: [
      "publish",
      "--output",
      dir,
      "--configuration",
      "Release",
      "--framework",
      "netcoreapp3.1",
      "/p:GenerateRuntimeConfigurationFiles=true",
      "/clp:ForceConsoleColor",
      // warnings are not reported for repeated builds by default and this flag
      // does a clean before build. It takes a little longer to run, but the
      // warnings are consistently printed on each build.
      //"/target:Rebuild",
      "--self-contained",
      "false",
      // do not print "Build Engine version"
      "-nologo",
      // only print errors
      "--verbosity",
      process.env.DEBUG ? "minimal" : "quiet",
    ],
    env: {},
  };
  return {
    build: async () => {
      fs.removeSync(dir);
      fs.mkdirpSync(dir);
      buildSync(opts, cmd);
    },
    bundle: () => {
      fs.removeSync(dir);
      fs.mkdirpSync(dir);
      buildSync(opts, cmd);
      return {
        handler: opts.handler,
        directory: dir,
      };
    },
    run: {
      command: "dotnet",
      args: [
        "exec",
        path.join(
          Paths.OWN_PATH,
          "../src/",
          "runtime",
          "shells",
          "dotnet-bootstrap",
          "release",
          "dotnet-bootstrap.dll"
        ),
        target,
        opts.handler,
      ],
      env: {},
    },
    watcher: {
      include: [
        path.join(opts.srcPath, "**/*.cs"),
        path.join(opts.srcPath, "**/*.csx"),
      ],
      ignore: [],
    },
  };
};
