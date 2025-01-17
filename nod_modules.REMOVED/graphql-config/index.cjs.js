'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

const tslib = require('tslib');
const path = require('path');
const minimatch = _interopDefault(require('minimatch'));
const cosmiconfig = require('cosmiconfig');
const loadTs = _interopDefault(require('@endemolshinegroup/cosmiconfig-typescript-loader'));
const cosmiconfigTomlLoader = require('cosmiconfig-toml-loader');
const stringEnvInterpolation = require('string-env-interpolation');
const graphqlFileLoader = require('@graphql-tools/graphql-file-loader');
const urlLoader = require('@graphql-tools/url-loader');
const jsonFileLoader = require('@graphql-tools/json-file-loader');
const load = require('@graphql-tools/load');
const merge = require('@graphql-tools/merge');
const graphql = require('graphql');

function ExtendableBuiltin(cls) {
    function ExtendableBuiltin() {
        cls.apply(this, arguments);
    }
    ExtendableBuiltin.prototype = Object.create(cls.prototype);
    Object.setPrototypeOf(ExtendableBuiltin, cls);
    return ExtendableBuiltin;
}
function composeMessage() {
    var lines = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        lines[_i] = arguments[_i];
    }
    return lines.join('\n');
}
var ConfigNotFoundError = /** @class */ (function (_super) {
    tslib.__extends(ConfigNotFoundError, _super);
    function ConfigNotFoundError(message) {
        var _this = _super.call(this, message) || this;
        _this.name = _this.constructor.name;
        _this.message = message;
        return _this;
    }
    return ConfigNotFoundError;
}(ExtendableBuiltin(Error)));
var ConfigEmptyError = /** @class */ (function (_super) {
    tslib.__extends(ConfigEmptyError, _super);
    function ConfigEmptyError(message) {
        var _this = _super.call(this, message) || this;
        _this.name = _this.constructor.name;
        _this.message = message;
        return _this;
    }
    return ConfigEmptyError;
}(ExtendableBuiltin(Error)));
var ConfigInvalidError = /** @class */ (function (_super) {
    tslib.__extends(ConfigInvalidError, _super);
    function ConfigInvalidError(message) {
        var _this = _super.call(this, message) || this;
        _this.name = _this.constructor.name;
        _this.message = message;
        return _this;
    }
    return ConfigInvalidError;
}(ExtendableBuiltin(Error)));
var ProjectNotFoundError = /** @class */ (function (_super) {
    tslib.__extends(ProjectNotFoundError, _super);
    function ProjectNotFoundError(message) {
        var _this = _super.call(this, message) || this;
        _this.name = _this.constructor.name;
        _this.message = message;
        return _this;
    }
    return ProjectNotFoundError;
}(ExtendableBuiltin(Error)));
var LoadersMissingError = /** @class */ (function (_super) {
    tslib.__extends(LoadersMissingError, _super);
    function LoadersMissingError(message) {
        var _this = _super.call(this, message) || this;
        _this.name = _this.constructor.name;
        _this.message = message;
        return _this;
    }
    return LoadersMissingError;
}(ExtendableBuiltin(Error)));
var LoaderNoResultError = /** @class */ (function (_super) {
    tslib.__extends(LoaderNoResultError, _super);
    function LoaderNoResultError(message) {
        var _this = _super.call(this, message) || this;
        _this.name = _this.constructor.name;
        _this.message = message;
        return _this;
    }
    return LoaderNoResultError;
}(ExtendableBuiltin(Error)));
var ExtensionMissingError = /** @class */ (function (_super) {
    tslib.__extends(ExtensionMissingError, _super);
    function ExtensionMissingError(message) {
        var _this = _super.call(this, message) || this;
        _this.name = _this.constructor.name;
        _this.message = message;
        return _this;
    }
    return ExtensionMissingError;
}(ExtendableBuiltin(Error)));

var legacySearchPlaces = [
    '.graphqlconfig',
    '.graphqlconfig.json',
    '.graphqlconfig.yaml',
    '.graphqlconfig.yml',
];
function isLegacyConfig(filepath) {
    filepath = filepath.toLowerCase();
    return legacySearchPlaces.some(function (name) { return filepath.endsWith(name); });
}
function transformContent(content) {
    return stringEnvInterpolation.env(content);
}
var createCustomLoader = function (loader) {
    return function (filepath, content) {
        return loader(filepath, transformContent(content));
    };
};
function createCosmiConfig(moduleName, _a) {
    var legacy = _a.legacy;
    var options = prepareCosmiconfig(moduleName, {
        legacy: legacy,
    });
    return cosmiconfig.cosmiconfig(moduleName, options);
}
function createCosmiConfigSync(moduleName, _a) {
    var legacy = _a.legacy;
    var options = prepareCosmiconfig(moduleName, {
        legacy: legacy,
    });
    return cosmiconfig.cosmiconfigSync(moduleName, options);
}
function prepareCosmiconfig(moduleName, _a) {
    var legacy = _a.legacy;
    var loadYaml = createCustomLoader(cosmiconfig.defaultLoaders['.yaml']);
    var loadTomlCustom = createCustomLoader(cosmiconfigTomlLoader.loadToml);
    var loadJson = createCustomLoader(cosmiconfig.defaultLoaders['.json']);
    var searchPlaces = [
        "#.config.ts",
        "#.config.js",
        '#.config.json',
        '#.config.yaml',
        '#.config.yml',
        '#.config.toml',
        '.#rc',
        '.#rc.ts',
        '.#rc.js',
        '.#rc.json',
        '.#rc.yml',
        '.#rc.yaml',
        '.#rc.toml',
    ];
    if (legacy) {
        searchPlaces.push.apply(searchPlaces, legacySearchPlaces);
    }
    // We need to wrap loaders in order to access and transform file content (as string)
    // Cosmiconfig has transform option but at this point config is not a string but an object
    return {
        searchPlaces: searchPlaces.map(function (place) { return place.replace('#', moduleName); }),
        loaders: {
            '.ts': loadTs,
            '.js': cosmiconfig.defaultLoaders['.js'],
            '.json': loadJson,
            '.yaml': loadYaml,
            '.yml': loadYaml,
            '.toml': loadTomlCustom,
            noExt: loadYaml,
        },
    };
}

var cwd = typeof process !== 'undefined' ? process.cwd() : undefined;
function findConfig(_a) {
    var _b = _a.rootDir, rootDir = _b === void 0 ? cwd : _b, _c = _a.legacy, legacy = _c === void 0 ? true : _c, configName = _a.configName;
    return tslib.__awaiter(this, void 0, void 0, function () {
        var _d, _e;
        return tslib.__generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    validate({ rootDir: rootDir });
                    _d = resolve;
                    _e = {
                        rootDir: rootDir
                    };
                    return [4 /*yield*/, createCosmiConfig(configName, { legacy: legacy }).search(rootDir)];
                case 1: return [2 /*return*/, _d.apply(void 0, [(_e.result = _f.sent(),
                            _e)])];
            }
        });
    });
}
function findConfigSync(_a) {
    var _b = _a.rootDir, rootDir = _b === void 0 ? cwd : _b, _c = _a.legacy, legacy = _c === void 0 ? true : _c, configName = _a.configName;
    validate({ rootDir: rootDir });
    return resolve({
        rootDir: rootDir,
        result: createCosmiConfigSync(configName, { legacy: legacy }).search(rootDir),
    });
}
//
function validate(_a) {
    var rootDir = _a.rootDir;
    if (!rootDir) {
        throw new Error("Defining a root directory is required");
    }
}
function resolve(_a) {
    var result = _a.result, rootDir = _a.rootDir;
    if (!result) {
        throw new ConfigNotFoundError(composeMessage("GraphQL Config file is not available in the provided config directory: " + rootDir, "Please check the config directory."));
    }
    if (result.isEmpty) {
        throw new ConfigEmptyError(composeMessage("GraphQL Config file is empty.", "Please check " + result.filepath));
    }
    return {
        config: result.config,
        filepath: result.filepath,
    };
}

function getConfig(_a) {
    var filepath = _a.filepath, configName = _a.configName, _b = _a.legacy, legacy = _b === void 0 ? true : _b;
    return tslib.__awaiter(this, void 0, void 0, function () {
        var _c, _d;
        return tslib.__generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    validate$1({ filepath: filepath });
                    _c = resolve$1;
                    _d = {};
                    return [4 /*yield*/, createCosmiConfig(configName, { legacy: legacy }).load(filepath)];
                case 1: return [2 /*return*/, _c.apply(void 0, [(_d.result = _e.sent(),
                            _d.filepath = filepath,
                            _d)])];
            }
        });
    });
}
function getConfigSync(_a) {
    var filepath = _a.filepath, configName = _a.configName, _b = _a.legacy, legacy = _b === void 0 ? true : _b;
    validate$1({ filepath: filepath });
    return resolve$1({
        result: createCosmiConfigSync(configName, { legacy: legacy }).load(filepath),
        filepath: filepath,
    });
}
//
function resolve$1(_a) {
    var result = _a.result, filepath = _a.filepath;
    if (!result) {
        throw new ConfigNotFoundError(composeMessage("GraphQL Config file is not available: " + filepath, "Please check the config filepath."));
    }
    if (result.isEmpty) {
        throw new ConfigEmptyError(composeMessage("GraphQL Config file is empty.", "Please check " + result.filepath));
    }
    return {
        config: result.config,
        filepath: result.filepath,
    };
}
function validate$1(_a) {
    var filepath = _a.filepath;
    if (!filepath) {
        throw new Error("Defining a file path is required");
    }
}

function isMultipleProjectConfig(config) {
    return typeof config.projects === 'object';
}
function isSingleProjectConfig(config) {
    return typeof config.schema !== 'undefined';
}
function isLegacyProjectConfig(config) {
    return (typeof config.schemaPath !== 'undefined' ||
        typeof config.includes !== 'undefined' ||
        typeof config.excludes !== 'undefined');
}
function useMiddleware(fns) {
    return function (input) {
        if (fns.length) {
            return fns.reduce(function (obj, cb) { return cb(obj); }, input);
        }
        return input;
    };
}

var GraphQLProjectConfig = /** @class */ (function () {
    function GraphQLProjectConfig(_a) {
        var filepath = _a.filepath, name = _a.name, config = _a.config, extensionsRegistry = _a.extensionsRegistry;
        this.filepath = filepath;
        this.dirpath = path.dirname(filepath);
        this.name = name;
        if (isLegacyProjectConfig(config)) {
            this.extensions = config.extensions || {};
            this.schema = config.schemaPath;
            this.include = config.includes;
            this.exclude = config.excludes;
            this.isLegacy = true;
        }
        else {
            this.extensions = config.extensions || {};
            this.schema = config.schema;
            this.documents = config.documents;
            this.include = config.include;
            this.exclude = config.exclude;
            this.isLegacy = false;
        }
        this._extensionsRegistry = extensionsRegistry;
    }
    GraphQLProjectConfig.prototype.hasExtension = function (name) {
        return !!this.extensions[name];
    };
    GraphQLProjectConfig.prototype.extension = function (name) {
        if (this.isLegacy) {
            var extension_1 = this.extensions[name];
            if (!extension_1) {
                throw new ExtensionMissingError("Project " + this.name + " is missing " + name + " extension");
            }
            return extension_1;
        }
        var extension = this._extensionsRegistry.get(name);
        if (!extension) {
            throw new ExtensionMissingError("Project " + this.name + " is missing " + name + " extension");
        }
        return tslib.__assign(tslib.__assign({}, this.extensions[name]), { schema: this.schema, documents: this.documents, include: this.include, exclude: this.exclude });
    };
    GraphQLProjectConfig.prototype.getSchema = function (out) {
        return tslib.__awaiter(this, void 0, void 0, function () {
            return tslib.__generator(this, function (_a) {
                return [2 /*return*/, this.loadSchema(this.schema, out)];
            });
        });
    };
    GraphQLProjectConfig.prototype.getSchemaSync = function (out) {
        return this.loadSchemaSync(this.schema, out);
    };
    // Get Documents
    GraphQLProjectConfig.prototype.getDocuments = function () {
        return tslib.__awaiter(this, void 0, void 0, function () {
            return tslib.__generator(this, function (_a) {
                if (!this.documents) {
                    return [2 /*return*/, []];
                }
                return [2 /*return*/, this.loadDocuments(this.documents)];
            });
        });
    };
    GraphQLProjectConfig.prototype.getDocumentsSync = function () {
        if (!this.documents) {
            return [];
        }
        return this.loadDocumentsSync(this.documents);
    };
    GraphQLProjectConfig.prototype.loadSchema = function (pointer, out, options) {
        return tslib.__awaiter(this, void 0, void 0, function () {
            return tslib.__generator(this, function (_a) {
                return [2 /*return*/, this._extensionsRegistry.loaders.schema.loadSchema(pointer, out, options)];
            });
        });
    };
    GraphQLProjectConfig.prototype.loadSchemaSync = function (pointer, out, options) {
        return this._extensionsRegistry.loaders.schema.loadSchemaSync(pointer, out, options);
    };
    // Load Documents
    GraphQLProjectConfig.prototype.loadDocuments = function (pointer, options) {
        return tslib.__awaiter(this, void 0, void 0, function () {
            return tslib.__generator(this, function (_a) {
                if (!pointer) {
                    return [2 /*return*/, []];
                }
                return [2 /*return*/, this._extensionsRegistry.loaders.documents.loadDocuments(pointer, options)];
            });
        });
    };
    GraphQLProjectConfig.prototype.loadDocumentsSync = function (pointer, options) {
        if (!pointer) {
            return [];
        }
        return this._extensionsRegistry.loaders.documents.loadDocumentsSync(pointer, options);
    };
    // Rest
    GraphQLProjectConfig.prototype.match = function (filepath) {
        var _this = this;
        var isSchemaOrDocument = [this.schema, this.documents].some(function (pointer) {
            return match(filepath, _this.dirpath, pointer);
        });
        if (isSchemaOrDocument) {
            return true;
        }
        var isExcluded = this.exclude
            ? match(filepath, this.dirpath, this.exclude)
            : false;
        if (isExcluded) {
            return false;
        }
        var isIncluded = this.include
            ? match(filepath, this.dirpath, this.include)
            : false;
        if (isIncluded) {
            return true;
        }
        return false;
    };
    return GraphQLProjectConfig;
}());
// XXX: it works but uses nodejs - expose normalization of file and dir paths in config
function match(filepath, dirpath, pointer) {
    if (!pointer) {
        return false;
    }
    if (Array.isArray(pointer)) {
        return pointer.some(function (p) { return match(filepath, dirpath, p); });
    }
    if (typeof pointer === 'string') {
        var normalizedFilepath = path.normalize(path.isAbsolute(filepath) ? path.relative(dirpath, filepath) : filepath);
        return minimatch(normalizedFilepath, path.normalize(pointer), { dot: true });
    }
    if (typeof pointer === 'object') {
        return match(filepath, dirpath, Object.keys(pointer)[0]);
    }
    return false;
}

var LoadersRegistry = /** @class */ (function () {
    function LoadersRegistry(_a) {
        var cwd = _a.cwd;
        this._loaders = [];
        this._middlewares = [];
        this.cwd = cwd;
    }
    LoadersRegistry.prototype.register = function (loader) {
        if (!this._loaders.some(function (l) { return l.loaderId() === loader.loaderId(); })) {
            this._loaders.push(loader);
        }
    };
    LoadersRegistry.prototype.override = function (loaders) {
        this._loaders = loaders;
    };
    LoadersRegistry.prototype.use = function (middleware) {
        this._middlewares.push(middleware);
    };
    LoadersRegistry.prototype.loadTypeDefs = function (pointer, options) {
        return tslib.__awaiter(this, void 0, void 0, function () {
            return tslib.__generator(this, function (_a) {
                return [2 /*return*/, load.loadTypedefs(pointer, tslib.__assign({ loaders: this._loaders, cwd: this.cwd }, options))];
            });
        });
    };
    LoadersRegistry.prototype.loadTypeDefsSync = function (pointer, options) {
        return load.loadTypedefsSync(pointer, this.createOptions(options));
    };
    LoadersRegistry.prototype.loadDocuments = function (pointer, options) {
        return tslib.__awaiter(this, void 0, void 0, function () {
            return tslib.__generator(this, function (_a) {
                return [2 /*return*/, load.loadDocuments(pointer, this.createOptions(options))];
            });
        });
    };
    LoadersRegistry.prototype.loadDocumentsSync = function (pointer, options) {
        return load.loadDocumentsSync(pointer, this.createOptions(options));
    };
    LoadersRegistry.prototype.loadSchema = function (pointer, out, options) {
        return tslib.__awaiter(this, void 0, void 0, function () {
            var loadSchemaOptions, schemaDoc, _a;
            return tslib.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        out = out || 'GraphQLSchema';
                        loadSchemaOptions = this.createOptions(options);
                        if (out === 'GraphQLSchema' && !this._middlewares.length) {
                            return [2 /*return*/, load.loadSchema(pointer, loadSchemaOptions)];
                        }
                        _a = this.transformSchemaSources;
                        return [4 /*yield*/, load.loadTypedefs(pointer, tslib.__assign({ filterKinds: load.OPERATION_KINDS }, loadSchemaOptions))];
                    case 1:
                        schemaDoc = _a.apply(this, [_b.sent()]);
                        // TODO: TS screams about `out` not being compatible with SchemaOutput
                        return [2 /*return*/, this.castSchema(schemaDoc, out)];
                }
            });
        });
    };
    LoadersRegistry.prototype.loadSchemaSync = function (pointer, out, options) {
        out = out || 'GraphQLSchema';
        var loadSchemaOptions = this.createOptions(options);
        if (out === 'GraphQLSchema' && !this._middlewares.length) {
            return load.loadSchemaSync(pointer, loadSchemaOptions);
        }
        var schemaDoc = this.transformSchemaSources(load.loadTypedefsSync(pointer, tslib.__assign({ filterKinds: load.OPERATION_KINDS }, loadSchemaOptions)));
        return this.castSchema(schemaDoc, out);
    };
    LoadersRegistry.prototype.createOptions = function (options) {
        return tslib.__assign({ loaders: this._loaders, cwd: this.cwd }, options);
    };
    LoadersRegistry.prototype.transformSchemaSources = function (sources) {
        var documents = sources.map(function (source) { return source.document; });
        var document = merge.mergeTypeDefs(documents);
        return useMiddleware(this._middlewares)(document);
    };
    LoadersRegistry.prototype.castSchema = function (doc, out) {
        if (out === 'DocumentNode') {
            return doc;
        }
        if (out === 'GraphQLSchema') {
            return graphql.buildASTSchema(doc);
        }
        return graphql.print(doc);
    };
    return LoadersRegistry;
}());

var GraphQLExtensionsRegistry = /** @class */ (function () {
    function GraphQLExtensionsRegistry(_a) {
        var cwd = _a.cwd;
        this._extensions = {};
        this.loaders = {
            schema: new LoadersRegistry({ cwd: cwd }),
            documents: new LoadersRegistry({ cwd: cwd }),
        };
        // schema
        this.loaders.schema.register(new graphqlFileLoader.GraphQLFileLoader());
        this.loaders.schema.register(new urlLoader.UrlLoader());
        this.loaders.schema.register(new jsonFileLoader.JsonFileLoader());
        // documents
        this.loaders.documents.register(new graphqlFileLoader.GraphQLFileLoader());
    }
    GraphQLExtensionsRegistry.prototype.register = function (extensionFn) {
        var extension = extensionFn({
            logger: {},
            loaders: this.loaders,
        });
        this._extensions[extension.name] = extension;
    };
    GraphQLExtensionsRegistry.prototype.has = function (extensionName) {
        return !!this._extensions[extensionName];
    };
    GraphQLExtensionsRegistry.prototype.get = function (extensionName) {
        return this._extensions[extensionName];
    };
    GraphQLExtensionsRegistry.prototype.names = function () {
        return Object.keys(this._extensions);
    };
    GraphQLExtensionsRegistry.prototype.forEach = function (cb) {
        for (var extensionName in this._extensions) {
            cb(this._extensions[extensionName]);
        }
    };
    return GraphQLExtensionsRegistry;
}());

var EndpointsExtension = function () {
    return {
        name: 'endpoints',
    };
};

var cwd$1 = typeof process !== 'undefined' ? process.cwd() : undefined;
var defaultConfigName = 'graphql';
var defaultLoadConfigOptions = {
    rootDir: cwd$1,
    extensions: [],
    throwOnMissing: true,
    throwOnEmpty: true,
    configName: defaultConfigName,
    legacy: true,
};
function loadConfig(options) {
    return tslib.__awaiter(this, void 0, void 0, function () {
        var _a, filepath, configName, rootDir, extensions, throwOnEmpty, throwOnMissing, legacy, found, _b, error_1;
        return tslib.__generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _a = tslib.__assign(tslib.__assign({}, defaultLoadConfigOptions), options), filepath = _a.filepath, configName = _a.configName, rootDir = _a.rootDir, extensions = _a.extensions, throwOnEmpty = _a.throwOnEmpty, throwOnMissing = _a.throwOnMissing, legacy = _a.legacy;
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 6, , 7]);
                    if (!filepath) return [3 /*break*/, 3];
                    return [4 /*yield*/, getConfig({
                            filepath: filepath,
                            configName: configName,
                            legacy: legacy,
                        })];
                case 2:
                    _b = _c.sent();
                    return [3 /*break*/, 5];
                case 3: return [4 /*yield*/, findConfig({
                        rootDir: rootDir,
                        configName: configName,
                        legacy: legacy,
                    })];
                case 4:
                    _b = _c.sent();
                    _c.label = 5;
                case 5:
                    found = _b;
                    return [2 /*return*/, new GraphQLConfig(found, extensions)];
                case 6:
                    error_1 = _c.sent();
                    return [2 /*return*/, handleError(error_1, { throwOnMissing: throwOnMissing, throwOnEmpty: throwOnEmpty })];
                case 7: return [2 /*return*/];
            }
        });
    });
}
function loadConfigSync(options) {
    var _a = tslib.__assign(tslib.__assign({}, defaultLoadConfigOptions), options), filepath = _a.filepath, configName = _a.configName, rootDir = _a.rootDir, extensions = _a.extensions, throwOnEmpty = _a.throwOnEmpty, throwOnMissing = _a.throwOnMissing, legacy = _a.legacy;
    try {
        var found = filepath
            ? getConfigSync({
                filepath: filepath,
                configName: configName,
                legacy: legacy,
            })
            : findConfigSync({
                rootDir: rootDir,
                configName: configName,
                legacy: legacy,
            });
        return new GraphQLConfig(found, extensions);
    }
    catch (error) {
        return handleError(error, { throwOnMissing: throwOnMissing, throwOnEmpty: throwOnEmpty });
    }
}
function handleError(error, options) {
    if ((!options.throwOnMissing && error instanceof ConfigNotFoundError) ||
        (!options.throwOnEmpty && error instanceof ConfigEmptyError)) {
        return;
    }
    throw error;
}
var GraphQLConfig = /** @class */ (function () {
    function GraphQLConfig(raw, extensions) {
        var _this = this;
        this._rawConfig = raw.config;
        this.filepath = raw.filepath;
        this.dirpath = path.dirname(raw.filepath);
        this.extensions = new GraphQLExtensionsRegistry({ cwd: this.dirpath });
        // Register Endpoints
        this.extensions.register(EndpointsExtension);
        extensions.forEach(function (extension) {
            _this.extensions.register(extension);
        });
        this.projects = {};
        if (isMultipleProjectConfig(this._rawConfig)) {
            for (var projectName in this._rawConfig.projects) {
                var config = this._rawConfig.projects[projectName];
                this.projects[projectName] = new GraphQLProjectConfig({
                    filepath: this.filepath,
                    name: projectName,
                    config: config,
                    extensionsRegistry: this.extensions,
                });
            }
        }
        else if (isSingleProjectConfig(this._rawConfig)) {
            this.projects['default'] = new GraphQLProjectConfig({
                filepath: this.filepath,
                name: 'default',
                config: this._rawConfig,
                extensionsRegistry: this.extensions,
            });
        }
        else if (isLegacyProjectConfig(this._rawConfig)) {
            this.projects['default'] = new GraphQLProjectConfig({
                filepath: this.filepath,
                name: 'default',
                config: this._rawConfig,
                extensionsRegistry: this.extensions,
            });
        }
    }
    GraphQLConfig.prototype.getProject = function (name) {
        if (!name) {
            return this.getDefault();
        }
        var project = this.projects[name];
        if (!project) {
            throw new ProjectNotFoundError("Project '" + name + "' not found");
        }
        return project;
    };
    GraphQLConfig.prototype.getProjectForFile = function (filepath) {
        // Looks for a project that includes the file or the file is a part of schema or documents
        for (var projectName in this.projects) {
            if (this.projects.hasOwnProperty(projectName)) {
                var project = this.projects[projectName];
                if (project.match(filepath)) {
                    return project;
                }
            }
        }
        // The file doesn't match any of the project
        // Looks for a first project that has no `include` and `exclude`
        for (var projectName in this.projects) {
            if (this.projects.hasOwnProperty(projectName)) {
                var project = this.projects[projectName];
                if (!project.include && !project.exclude) {
                    return project;
                }
            }
        }
        throw new ProjectNotFoundError("File '" + filepath + "' doesn't match any project");
    };
    GraphQLConfig.prototype.getDefault = function () {
        return this.getProject('default');
    };
    GraphQLConfig.prototype.isLegacy = function () {
        return isLegacyConfig(this.filepath);
    };
    return GraphQLConfig;
}());

exports.ConfigEmptyError = ConfigEmptyError;
exports.ConfigInvalidError = ConfigInvalidError;
exports.ConfigNotFoundError = ConfigNotFoundError;
exports.ExtensionMissingError = ExtensionMissingError;
exports.GraphQLConfig = GraphQLConfig;
exports.GraphQLProjectConfig = GraphQLProjectConfig;
exports.LoaderNoResultError = LoaderNoResultError;
exports.LoadersMissingError = LoadersMissingError;
exports.ProjectNotFoundError = ProjectNotFoundError;
exports.composeMessage = composeMessage;
exports.loadConfig = loadConfig;
exports.loadConfigSync = loadConfigSync;
//# sourceMappingURL=index.cjs.js.map
