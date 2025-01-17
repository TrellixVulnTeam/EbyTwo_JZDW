"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isPluginRequired = isPluginRequired;
exports.default = exports.getPolyfillPlugins = exports.getModulesPluginNames = exports.transformIncludesAndExcludes = void 0;

var _semver = require("semver");

var _debug = require("./debug");

var _getOptionSpecificExcludes = _interopRequireDefault(require("./get-option-specific-excludes"));

var _filterItems = require("./filter-items");

var _moduleTransformations = _interopRequireDefault(require("./module-transformations"));

var _normalizeOptions = _interopRequireDefault(require("./normalize-options"));

var _shippedProposals = require("../data/shipped-proposals");

var _pluginsCompatData = require("./plugins-compat-data");

var _overlappingPlugins = _interopRequireDefault(require("@babel/compat-data/overlapping-plugins"));

var _regenerator = _interopRequireDefault(require("./polyfills/regenerator"));

var _babelPolyfill = _interopRequireDefault(require("./polyfills/babel-polyfill"));

var _babelPluginPolyfillCorejs = _interopRequireDefault(require("babel-plugin-polyfill-corejs2"));

var _babelPluginPolyfillCorejs2 = _interopRequireDefault(require("babel-plugin-polyfill-corejs3"));

var _babelPluginPolyfillRegenerator = _interopRequireDefault(require("babel-plugin-polyfill-regenerator"));

var _helperCompilationTargets = _interopRequireWildcard(require("@babel/helper-compilation-targets"));

var _availablePlugins = _interopRequireDefault(require("./available-plugins"));

var _helperPluginUtils = require("@babel/helper-plugin-utils");

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function isPluginRequired(targets, support) {
  return (0, _helperCompilationTargets.isRequired)("fake-name", targets, {
    compatData: {
      "fake-name": support
    }
  });
}

function filterStageFromList(list, stageList) {
  return Object.keys(list).reduce((result, item) => {
    if (!stageList.has(item)) {
      result[item] = list[item];
    }

    return result;
  }, {});
}

const pluginLists = {
  withProposals: {
    withoutBugfixes: _pluginsCompatData.plugins,
    withBugfixes: Object.assign({}, _pluginsCompatData.plugins, _pluginsCompatData.pluginsBugfixes)
  },
  withoutProposals: {
    withoutBugfixes: filterStageFromList(_pluginsCompatData.plugins, _shippedProposals.proposalPlugins),
    withBugfixes: filterStageFromList(Object.assign({}, _pluginsCompatData.plugins, _pluginsCompatData.pluginsBugfixes), _shippedProposals.proposalPlugins)
  }
};

function getPluginList(proposals, bugfixes) {
  if (proposals) {
    if (bugfixes) return pluginLists.withProposals.withBugfixes;else return pluginLists.withProposals.withoutBugfixes;
  } else {
    if (bugfixes) return pluginLists.withoutProposals.withBugfixes;else return pluginLists.withoutProposals.withoutBugfixes;
  }
}

const getPlugin = pluginName => {
  const plugin = _availablePlugins.default[pluginName];

  if (!plugin) {
    throw new Error(`Could not find plugin "${pluginName}". Ensure there is an entry in ./available-plugins.js for it.`);
  }

  return plugin;
};

const transformIncludesAndExcludes = opts => {
  return opts.reduce((result, opt) => {
    const target = opt.match(/^(es|es6|es7|esnext|web)\./) ? "builtIns" : "plugins";
    result[target].add(opt);
    return result;
  }, {
    all: opts,
    plugins: new Set(),
    builtIns: new Set()
  });
};

exports.transformIncludesAndExcludes = transformIncludesAndExcludes;

const getModulesPluginNames = ({
  modules,
  transformations,
  shouldTransformESM,
  shouldTransformDynamicImport,
  shouldTransformExportNamespaceFrom,
  shouldParseTopLevelAwait
}) => {
  const modulesPluginNames = [];

  if (modules !== false && transformations[modules]) {
    if (shouldTransformESM) {
      modulesPluginNames.push(transformations[modules]);
    }

    if (shouldTransformDynamicImport && shouldTransformESM && modules !== "umd") {
      modulesPluginNames.push("proposal-dynamic-import");
    } else {
      if (shouldTransformDynamicImport) {
        console.warn("Dynamic import can only be supported when transforming ES modules" + " to AMD, CommonJS or SystemJS. Only the parser plugin will be enabled.");
      }

      modulesPluginNames.push("syntax-dynamic-import");
    }
  } else {
    modulesPluginNames.push("syntax-dynamic-import");
  }

  if (shouldTransformExportNamespaceFrom) {
    modulesPluginNames.push("proposal-export-namespace-from");
  } else {
    modulesPluginNames.push("syntax-export-namespace-from");
  }

  if (shouldParseTopLevelAwait) {
    modulesPluginNames.push("syntax-top-level-await");
  }

  return modulesPluginNames;
};

exports.getModulesPluginNames = getModulesPluginNames;

const getPolyfillPlugins = ({
  useBuiltIns,
  corejs,
  polyfillTargets,
  include,
  exclude,
  proposals,
  shippedProposals,
  regenerator,
  debug
}) => {
  const polyfillPlugins = [];

  if (useBuiltIns === "usage" || useBuiltIns === "entry") {
    const pluginOptions = {
      method: `${useBuiltIns}-global`,
      version: corejs ? corejs.toString() : undefined,
      targets: polyfillTargets,
      include,
      exclude,
      proposals,
      shippedProposals,
      debug
    };

    if (corejs) {
      if (useBuiltIns === "usage") {
        if (corejs.major === 2) {
          polyfillPlugins.push([_babelPluginPolyfillCorejs.default, pluginOptions], [_babelPolyfill.default, {
            usage: true
          }]);
        } else {
          polyfillPlugins.push([_babelPluginPolyfillCorejs2.default, pluginOptions], [_babelPolyfill.default, {
            usage: true,
            deprecated: true
          }]);
        }

        if (regenerator) {
          polyfillPlugins.push([_babelPluginPolyfillRegenerator.default, {
            method: "usage-global",
            debug
          }]);
        }
      } else {
        if (corejs.major === 2) {
          polyfillPlugins.push([_babelPolyfill.default, {
            regenerator
          }], [_babelPluginPolyfillCorejs.default, pluginOptions]);
        } else {
          polyfillPlugins.push([_babelPluginPolyfillCorejs2.default, pluginOptions], [_babelPolyfill.default, {
            deprecated: true
          }]);

          if (!regenerator) {
            polyfillPlugins.push([_regenerator.default, pluginOptions]);
          }
        }
      }
    }
  }

  return polyfillPlugins;
};

exports.getPolyfillPlugins = getPolyfillPlugins;

function getLocalTargets(optionsTargets, ignoreBrowserslistConfig, configPath, browserslistEnv) {
  if (optionsTargets != null && optionsTargets.esmodules && optionsTargets.browsers) {
    console.warn(`
@babel/preset-env: esmodules and browsers targets have been specified together.
\`browsers\` target, \`${optionsTargets.browsers.toString()}\` will be ignored.
`);
  }

  return (0, _helperCompilationTargets.default)(optionsTargets, {
    ignoreBrowserslistConfig,
    configPath,
    browserslistEnv
  });
}

function supportsStaticESM(caller) {
  return !!(caller != null && caller.supportsStaticESM);
}

function supportsDynamicImport(caller) {
  return !!(caller != null && caller.supportsDynamicImport);
}

function supportsExportNamespaceFrom(caller) {
  return !!(caller != null && caller.supportsExportNamespaceFrom);
}

function supportsTopLevelAwait(caller) {
  return !!(caller != null && caller.supportsTopLevelAwait);
}

var _default = (0, _helperPluginUtils.declare)((api, opts) => {
  api.assertVersion(7);
  const babelTargets = api.targets();
  const {
    bugfixes,
    configPath,
    debug,
    exclude: optionsExclude,
    forceAllTransforms,
    ignoreBrowserslistConfig,
    include: optionsInclude,
    loose,
    modules,
    shippedProposals,
    spec,
    targets: optionsTargets,
    useBuiltIns,
    corejs: {
      version: corejs,
      proposals
    },
    browserslistEnv
  } = (0, _normalizeOptions.default)(opts);
  let targets = babelTargets;

  if (opts.targets || opts.configPath || opts.browserslistEnv || opts.ignoreBrowserslistConfig) {
    {
      var hasUglifyTarget = false;

      if (optionsTargets != null && optionsTargets.uglify) {
        hasUglifyTarget = true;
        delete optionsTargets.uglify;
        console.warn(`
The uglify target has been deprecated. Set the top level
option \`forceAllTransforms: true\` instead.
`);
      }
    }
    targets = getLocalTargets(optionsTargets, ignoreBrowserslistConfig, configPath, browserslistEnv);
  }

  const transformTargets = forceAllTransforms || hasUglifyTarget ? {} : targets;
  const include = transformIncludesAndExcludes(optionsInclude);
  const exclude = transformIncludesAndExcludes(optionsExclude);
  const compatData = getPluginList(shippedProposals, bugfixes);
  const shouldSkipExportNamespaceFrom = modules === "auto" && (api.caller == null ? void 0 : api.caller(supportsExportNamespaceFrom)) || modules === false && !(0, _helperCompilationTargets.isRequired)("proposal-export-namespace-from", transformTargets, {
    compatData,
    includes: include.plugins,
    excludes: exclude.plugins
  });
  const modulesPluginNames = getModulesPluginNames({
    modules,
    transformations: _moduleTransformations.default,
    shouldTransformESM: modules !== "auto" || !(api.caller != null && api.caller(supportsStaticESM)),
    shouldTransformDynamicImport: modules !== "auto" || !(api.caller != null && api.caller(supportsDynamicImport)),
    shouldTransformExportNamespaceFrom: !shouldSkipExportNamespaceFrom,
    shouldParseTopLevelAwait: !api.caller || api.caller(supportsTopLevelAwait)
  });
  const pluginNames = (0, _helperCompilationTargets.filterItems)(compatData, include.plugins, exclude.plugins, transformTargets, modulesPluginNames, (0, _getOptionSpecificExcludes.default)({
    loose
  }), _shippedProposals.pluginSyntaxMap);
  (0, _filterItems.removeUnnecessaryItems)(pluginNames, _overlappingPlugins.default);
  const polyfillPlugins = getPolyfillPlugins({
    useBuiltIns,
    corejs,
    polyfillTargets: targets,
    include: include.builtIns,
    exclude: exclude.builtIns,
    proposals,
    shippedProposals,
    regenerator: pluginNames.has("transform-regenerator"),
    debug
  });
  const pluginUseBuiltIns = useBuiltIns !== false;
  const plugins = Array.from(pluginNames).map(pluginName => {
    if (pluginName === "proposal-class-properties" || pluginName === "proposal-private-methods" || pluginName === "proposal-private-property-in-object") {
      return [getPlugin(pluginName), {
        loose: loose ? "#__internal__@babel/preset-env__prefer-true-but-false-is-ok-if-it-prevents-an-error" : "#__internal__@babel/preset-env__prefer-false-but-true-is-ok-if-it-prevents-an-error"
      }];
    }

    return [getPlugin(pluginName), {
      spec,
      loose,
      useBuiltIns: pluginUseBuiltIns
    }];
  }).concat(polyfillPlugins);

  if (debug) {
    console.log("@babel/preset-env: `DEBUG` option");
    console.log("\nUsing targets:");
    console.log(JSON.stringify((0, _helperCompilationTargets.prettifyTargets)(targets), null, 2));
    console.log(`\nUsing modules transform: ${modules.toString()}`);
    console.log("\nUsing plugins:");
    pluginNames.forEach(pluginName => {
      (0, _debug.logPluginOrPolyfill)(pluginName, targets, _pluginsCompatData.plugins);
    });

    if (!useBuiltIns) {
      console.log("\nUsing polyfills: No polyfills were added, since the `useBuiltIns` option was not set.");
    }
  }

  return {
    plugins
  };
});

exports.default = _default;