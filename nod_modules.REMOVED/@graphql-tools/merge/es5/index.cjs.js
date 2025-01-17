'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const tslib = require('tslib');
const utils = require('@graphql-tools/utils/es5');
const graphql = require('graphql');
const schema = require('@graphql-tools/schema/es5');

/**
 * Deep merges multiple resolver definition objects into a single definition.
 * @param resolversDefinitions Resolver definitions to be merged
 * @param options Additional options
 *
 * ```js
 * const { mergeResolvers } = require('@graphql-tools/merge/es5');
 * const clientResolver = require('./clientResolver');
 * const productResolver = require('./productResolver');
 *
 * const resolvers = mergeResolvers([
 *  clientResolver,
 *  productResolver,
 * ]);
 * ```
 *
 * If you don't want to manually create the array of resolver objects, you can
 * also use this function along with loadFiles:
 *
 * ```js
 * const path = require('path');
 * const { mergeResolvers } = require('@graphql-tools/merge/es5');
 * const { loadFilesSync } = require('@graphql-tools/load-files/es5');
 *
 * const resolversArray = loadFilesSync(path.join(__dirname, './resolvers'));
 *
 * const resolvers = mergeResolvers(resolversArray)
 * ```
 */
function mergeResolvers(resolversDefinitions, options) {
    var e_1, _a, e_2, _b;
    if (!resolversDefinitions || resolversDefinitions.length === 0) {
        return {};
    }
    if (resolversDefinitions.length === 1) {
        var singleDefinition = resolversDefinitions[0];
        if (Array.isArray(singleDefinition)) {
            return mergeResolvers(singleDefinition);
        }
        return singleDefinition;
    }
    var resolversFactories = new Array();
    var resolvers = new Array();
    try {
        for (var resolversDefinitions_1 = tslib.__values(resolversDefinitions), resolversDefinitions_1_1 = resolversDefinitions_1.next(); !resolversDefinitions_1_1.done; resolversDefinitions_1_1 = resolversDefinitions_1.next()) {
            var resolversDefinition = resolversDefinitions_1_1.value;
            if (Array.isArray(resolversDefinition)) {
                resolversDefinition = mergeResolvers(resolversDefinition);
            }
            if (typeof resolversDefinition === 'function') {
                resolversFactories.push(resolversDefinition);
            }
            else if (typeof resolversDefinition === 'object') {
                resolvers.push(resolversDefinition);
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (resolversDefinitions_1_1 && !resolversDefinitions_1_1.done && (_a = resolversDefinitions_1.return)) _a.call(resolversDefinitions_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    var result = {};
    if (resolversFactories.length) {
        result = (function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var resultsOfFactories = resolversFactories.map(function (factory) { return factory.apply(void 0, tslib.__spreadArray([], tslib.__read(args))); });
            return resolvers.concat(resultsOfFactories).reduce(utils.mergeDeep, {});
        });
    }
    else {
        result = resolvers.reduce(utils.mergeDeep, {});
    }
    if (options && options.exclusions) {
        try {
            for (var _c = tslib.__values(options.exclusions), _d = _c.next(); !_d.done; _d = _c.next()) {
                var exclusion = _d.value;
                var _e = tslib.__read(exclusion.split('.'), 2), typeName = _e[0], fieldName = _e[1];
                if (!fieldName || fieldName === '*') {
                    delete result[typeName];
                }
                else if (result[typeName]) {
                    delete result[typeName][fieldName];
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_d && !_d.done && (_b = _c.return)) _b.call(_c);
            }
            finally { if (e_2) throw e_2.error; }
        }
    }
    return result;
}

function mergeArguments(args1, args2, config) {
    var result = deduplicateArguments([].concat(args2, args1).filter(function (a) { return a; }));
    if (config && config.sort) {
        result.sort(utils.compareNodes);
    }
    return result;
}
function deduplicateArguments(args) {
    return args.reduce(function (acc, current) {
        var dup = acc.find(function (arg) { return arg.name.value === current.name.value; });
        if (!dup) {
            return acc.concat([current]);
        }
        return acc;
    }, []);
}

var commentsRegistry = {};
function resetComments() {
    commentsRegistry = {};
}
function collectComment(node) {
    var entityName = node.name.value;
    pushComment(node, entityName);
    switch (node.kind) {
        case 'EnumTypeDefinition':
            node.values.forEach(function (value) {
                pushComment(value, entityName, value.name.value);
            });
            break;
        case 'ObjectTypeDefinition':
        case 'InputObjectTypeDefinition':
        case 'InterfaceTypeDefinition':
            if (node.fields) {
                node.fields.forEach(function (field) {
                    pushComment(field, entityName, field.name.value);
                    if (isFieldDefinitionNode(field) && field.arguments) {
                        field.arguments.forEach(function (arg) {
                            pushComment(arg, entityName, field.name.value, arg.name.value);
                        });
                    }
                });
            }
            break;
    }
}
function pushComment(node, entity, field, argument) {
    var comment = graphql.getDescription(node, { commentDescriptions: true });
    if (typeof comment !== 'string' || comment.length === 0) {
        return;
    }
    var keys = [entity];
    if (field) {
        keys.push(field);
        if (argument) {
            keys.push(argument);
        }
    }
    var path = keys.join('.');
    if (!commentsRegistry[path]) {
        commentsRegistry[path] = [];
    }
    commentsRegistry[path].push(comment);
}
function printComment(comment) {
    return '\n# ' + comment.replace(/\n/g, '\n# ');
}
/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
/**
 * NOTE: ==> This file has been modified just to add comments to the printed AST
 * This is a temp measure, we will move to using the original non modified printer.js ASAP.
 */
// import { visit, VisitFn } from 'graphql/language/visitor';
/**
 * Given maybeArray, print an empty string if it is null or empty, otherwise
 * print all items together separated by separator if provided
 */
function join(maybeArray, separator) {
    return maybeArray ? maybeArray.filter(function (x) { return x; }).join(separator || '') : '';
}
function addDescription(cb) {
    return function (node, _key, _parent, path, ancestors) {
        var keys = [];
        var parent = path.reduce(function (prev, key) {
            if (['fields', 'arguments', 'values'].includes(key)) {
                keys.push(prev.name.value);
            }
            return prev[key];
        }, ancestors[0]);
        var key = tslib.__spreadArray(tslib.__spreadArray([], tslib.__read(keys)), [parent.name.value]).join('.');
        var items = [];
        if (commentsRegistry[key]) {
            items.push.apply(items, tslib.__spreadArray([], tslib.__read(commentsRegistry[key])));
        }
        return join(tslib.__spreadArray(tslib.__spreadArray([], tslib.__read(items.map(printComment))), [node.description, cb(node)]), '\n');
    };
}
function indent(maybeString) {
    return maybeString && "  " + maybeString.replace(/\n/g, '\n  ');
}
/**
 * Given array, print each item on its own line, wrapped in an
 * indented "{ }" block.
 */
function block(array) {
    return array && array.length !== 0 ? "{\n" + indent(join(array, '\n')) + "\n}" : '';
}
/**
 * If maybeString is not null or empty, then wrap with start and end, otherwise
 * print an empty string.
 */
function wrap(start, maybeString, end) {
    return maybeString ? start + maybeString + (end || '') : '';
}
/**
 * Print a block string in the indented block form by adding a leading and
 * trailing blank line. However, if a block string starts with whitespace and is
 * a single-line, adding a leading blank line would strip that whitespace.
 */
function printBlockString(value, isDescription) {
    var escaped = value.replace(/"""/g, '\\"""');
    return (value[0] === ' ' || value[0] === '\t') && value.indexOf('\n') === -1
        ? "\"\"\"" + escaped.replace(/"$/, '"\n') + "\"\"\""
        : "\"\"\"\n" + (isDescription ? escaped : indent(escaped)) + "\n\"\"\"";
}
/**
 * Converts an AST into a string, using one set of reasonable
 * formatting rules.
 */
function printWithComments(ast) {
    return graphql.visit(ast, {
        leave: {
            Name: function (node) { return node.value; },
            Variable: function (node) { return "$" + node.name; },
            // Document
            Document: function (node) {
                return node.definitions
                    .map(function (defNode) { return defNode + "\n" + (defNode[0] === '#' ? '' : '\n'); })
                    .join('')
                    .trim() + "\n";
            },
            OperationTypeDefinition: function (node) { return node.operation + ": " + node.type; },
            VariableDefinition: function (_a) {
                var variable = _a.variable, type = _a.type, defaultValue = _a.defaultValue;
                return variable + ": " + type + wrap(' = ', defaultValue);
            },
            SelectionSet: function (_a) {
                var selections = _a.selections;
                return block(selections);
            },
            Field: function (_a) {
                var alias = _a.alias, name = _a.name, args = _a.arguments, directives = _a.directives, selectionSet = _a.selectionSet;
                return join([wrap('', alias, ': ') + name + wrap('(', join(args, ', '), ')'), join(directives, ' '), selectionSet], '  ');
            },
            Argument: addDescription(function (_a) {
                var name = _a.name, value = _a.value;
                return name + ": " + value;
            }),
            // Value
            IntValue: function (_a) {
                var value = _a.value;
                return value;
            },
            FloatValue: function (_a) {
                var value = _a.value;
                return value;
            },
            StringValue: function (_a, key) {
                var value = _a.value, isBlockString = _a.block;
                return isBlockString ? printBlockString(value, key === 'description') : JSON.stringify(value);
            },
            BooleanValue: function (_a) {
                var value = _a.value;
                return (value ? 'true' : 'false');
            },
            NullValue: function () { return 'null'; },
            EnumValue: function (_a) {
                var value = _a.value;
                return value;
            },
            ListValue: function (_a) {
                var values = _a.values;
                return "[" + join(values, ', ') + "]";
            },
            ObjectValue: function (_a) {
                var fields = _a.fields;
                return "{" + join(fields, ', ') + "}";
            },
            ObjectField: function (_a) {
                var name = _a.name, value = _a.value;
                return name + ": " + value;
            },
            // Directive
            Directive: function (_a) {
                var name = _a.name, args = _a.arguments;
                return "@" + name + wrap('(', join(args, ', '), ')');
            },
            // Type
            NamedType: function (_a) {
                var name = _a.name;
                return name;
            },
            ListType: function (_a) {
                var type = _a.type;
                return "[" + type + "]";
            },
            NonNullType: function (_a) {
                var type = _a.type;
                return type + "!";
            },
            // Type System Definitions
            SchemaDefinition: function (_a) {
                var directives = _a.directives, operationTypes = _a.operationTypes;
                return join(['schema', join(directives, ' '), block(operationTypes)], ' ');
            },
            ScalarTypeDefinition: addDescription(function (_a) {
                var name = _a.name, directives = _a.directives;
                return join(['scalar', name, join(directives, ' ')], ' ');
            }),
            ObjectTypeDefinition: addDescription(function (_a) {
                var name = _a.name, interfaces = _a.interfaces, directives = _a.directives, fields = _a.fields;
                return join(['type', name, wrap('implements ', join(interfaces, ' & ')), join(directives, ' '), block(fields)], ' ');
            }),
            FieldDefinition: addDescription(function (_a) {
                var name = _a.name, args = _a.arguments, type = _a.type, directives = _a.directives;
                return name + wrap('(', join(args, ', '), ')') + ": " + type + wrap(' ', join(directives, ' '));
            }),
            InputValueDefinition: addDescription(function (_a) {
                var name = _a.name, type = _a.type, defaultValue = _a.defaultValue, directives = _a.directives;
                return join([name + ": " + type, wrap('= ', defaultValue), join(directives, ' ')], ' ');
            }),
            InterfaceTypeDefinition: addDescription(function (_a) {
                var name = _a.name, directives = _a.directives, fields = _a.fields;
                return join(['interface', name, join(directives, ' '), block(fields)], ' ');
            }),
            UnionTypeDefinition: addDescription(function (_a) {
                var name = _a.name, directives = _a.directives, types = _a.types;
                return join(['union', name, join(directives, ' '), types && types.length !== 0 ? "= " + join(types, ' | ') : ''], ' ');
            }),
            EnumTypeDefinition: addDescription(function (_a) {
                var name = _a.name, directives = _a.directives, values = _a.values;
                return join(['enum', name, join(directives, ' '), block(values)], ' ');
            }),
            EnumValueDefinition: addDescription(function (_a) {
                var name = _a.name, directives = _a.directives;
                return join([name, join(directives, ' ')], ' ');
            }),
            InputObjectTypeDefinition: addDescription(function (_a) {
                var name = _a.name, directives = _a.directives, fields = _a.fields;
                return join(['input', name, join(directives, ' '), block(fields)], ' ');
            }),
            ScalarTypeExtension: function (_a) {
                var name = _a.name, directives = _a.directives;
                return join(['extend scalar', name, join(directives, ' ')], ' ');
            },
            ObjectTypeExtension: function (_a) {
                var name = _a.name, interfaces = _a.interfaces, directives = _a.directives, fields = _a.fields;
                return join(['extend type', name, wrap('implements ', join(interfaces, ' & ')), join(directives, ' '), block(fields)], ' ');
            },
            InterfaceTypeExtension: function (_a) {
                var name = _a.name, directives = _a.directives, fields = _a.fields;
                return join(['extend interface', name, join(directives, ' '), block(fields)], ' ');
            },
            UnionTypeExtension: function (_a) {
                var name = _a.name, directives = _a.directives, types = _a.types;
                return join(['extend union', name, join(directives, ' '), types && types.length !== 0 ? "= " + join(types, ' | ') : ''], ' ');
            },
            EnumTypeExtension: function (_a) {
                var name = _a.name, directives = _a.directives, values = _a.values;
                return join(['extend enum', name, join(directives, ' '), block(values)], ' ');
            },
            InputObjectTypeExtension: function (_a) {
                var name = _a.name, directives = _a.directives, fields = _a.fields;
                return join(['extend input', name, join(directives, ' '), block(fields)], ' ');
            },
            DirectiveDefinition: addDescription(function (_a) {
                var name = _a.name, args = _a.arguments, locations = _a.locations;
                return "directive @" + name + wrap('(', join(args, ', '), ')') + " on " + join(locations, ' | ');
            }),
        },
    });
}
function isFieldDefinitionNode(node) {
    return node.kind === 'FieldDefinition';
}

function directiveAlreadyExists(directivesArr, otherDirective) {
    return !!directivesArr.find(function (directive) { return directive.name.value === otherDirective.name.value; });
}
function nameAlreadyExists(name, namesArr) {
    return namesArr.some(function (_a) {
        var value = _a.value;
        return value === name.value;
    });
}
function mergeArguments$1(a1, a2) {
    var e_1, _a;
    var result = tslib.__spreadArray([], tslib.__read(a2));
    var _loop_1 = function (argument) {
        var existingIndex = result.findIndex(function (a) { return a.name.value === argument.name.value; });
        if (existingIndex > -1) {
            var existingArg = result[existingIndex];
            if (existingArg.value.kind === 'ListValue') {
                var source = existingArg.value.values;
                var target = argument.value.values;
                // merge values of two lists
                existingArg.value.values = deduplicateLists(source, target, function (targetVal, source) {
                    var value = targetVal.value;
                    return !value || !source.some(function (sourceVal) { return sourceVal.value === value; });
                });
            }
            else {
                existingArg.value = argument.value;
            }
        }
        else {
            result.push(argument);
        }
    };
    try {
        for (var a1_1 = tslib.__values(a1), a1_1_1 = a1_1.next(); !a1_1_1.done; a1_1_1 = a1_1.next()) {
            var argument = a1_1_1.value;
            _loop_1(argument);
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (a1_1_1 && !a1_1_1.done && (_a = a1_1.return)) _a.call(a1_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    return result;
}
function deduplicateDirectives(directives) {
    return directives
        .map(function (directive, i, all) {
        var firstAt = all.findIndex(function (d) { return d.name.value === directive.name.value; });
        if (firstAt !== i) {
            var dup = all[firstAt];
            directive.arguments = mergeArguments$1(directive.arguments, dup.arguments);
            return null;
        }
        return directive;
    })
        .filter(function (d) { return d; });
}
function mergeDirectives(d1, d2, config) {
    var e_2, _a;
    if (d1 === void 0) { d1 = []; }
    if (d2 === void 0) { d2 = []; }
    var reverseOrder = config && config.reverseDirectives;
    var asNext = reverseOrder ? d1 : d2;
    var asFirst = reverseOrder ? d2 : d1;
    var result = deduplicateDirectives(tslib.__spreadArray([], tslib.__read(asNext)));
    var _loop_2 = function (directive) {
        if (directiveAlreadyExists(result, directive)) {
            var existingDirectiveIndex = result.findIndex(function (d) { return d.name.value === directive.name.value; });
            var existingDirective = result[existingDirectiveIndex];
            result[existingDirectiveIndex].arguments = mergeArguments$1(directive.arguments || [], existingDirective.arguments || []);
        }
        else {
            result.push(directive);
        }
    };
    try {
        for (var asFirst_1 = tslib.__values(asFirst), asFirst_1_1 = asFirst_1.next(); !asFirst_1_1.done; asFirst_1_1 = asFirst_1.next()) {
            var directive = asFirst_1_1.value;
            _loop_2(directive);
        }
    }
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (asFirst_1_1 && !asFirst_1_1.done && (_a = asFirst_1.return)) _a.call(asFirst_1);
        }
        finally { if (e_2) throw e_2.error; }
    }
    return result;
}
function validateInputs(node, existingNode) {
    var printedNode = graphql.print(node);
    var printedExistingNode = graphql.print(existingNode);
    // eslint-disable-next-line
    var leaveInputs = new RegExp('(directive @w*d*)|( on .*$)', 'g');
    var sameArguments = printedNode.replace(leaveInputs, '') === printedExistingNode.replace(leaveInputs, '');
    if (!sameArguments) {
        throw new Error("Unable to merge GraphQL directive \"" + node.name.value + "\". \nExisting directive:  \n\t" + printedExistingNode + " \nReceived directive: \n\t" + printedNode);
    }
}
function mergeDirective(node, existingNode) {
    if (existingNode) {
        validateInputs(node, existingNode);
        return tslib.__assign(tslib.__assign({}, node), { locations: tslib.__spreadArray(tslib.__spreadArray([], tslib.__read(existingNode.locations)), tslib.__read(node.locations.filter(function (name) { return !nameAlreadyExists(name, existingNode.locations); }))) });
    }
    return node;
}
function deduplicateLists(source, target, filterFn) {
    return source.concat(target.filter(function (val) { return filterFn(val, source); }));
}

function mergeEnumValues(first, second, config) {
    var e_1, _a, e_2, _b;
    if (config === null || config === void 0 ? void 0 : config.consistentEnumMerge) {
        var reversed = first;
        first = second;
        second = reversed;
    }
    var enumValueMap = new Map();
    try {
        for (var first_1 = tslib.__values(first), first_1_1 = first_1.next(); !first_1_1.done; first_1_1 = first_1.next()) {
            var firstValue = first_1_1.value;
            enumValueMap.set(firstValue.name.value, firstValue);
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (first_1_1 && !first_1_1.done && (_a = first_1.return)) _a.call(first_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    try {
        for (var second_1 = tslib.__values(second), second_1_1 = second_1.next(); !second_1_1.done; second_1_1 = second_1.next()) {
            var secondValue = second_1_1.value;
            var enumValue = secondValue.name.value;
            if (enumValueMap.has(enumValue)) {
                var firstValue = enumValueMap.get(enumValue);
                firstValue.description = secondValue.description || firstValue.description;
                firstValue.directives = mergeDirectives(secondValue.directives, firstValue.directives);
            }
            else {
                enumValueMap.set(enumValue, secondValue);
            }
        }
    }
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (second_1_1 && !second_1_1.done && (_b = second_1.return)) _b.call(second_1);
        }
        finally { if (e_2) throw e_2.error; }
    }
    var result = tslib.__spreadArray([], tslib.__read(enumValueMap.values()));
    if (config && config.sort) {
        result.sort(utils.compareNodes);
    }
    return result;
}

function mergeEnum(e1, e2, config) {
    if (e2) {
        return {
            name: e1.name,
            description: e1['description'] || e2['description'],
            kind: (config && config.convertExtensions) || e1.kind === 'EnumTypeDefinition' || e2.kind === 'EnumTypeDefinition'
                ? 'EnumTypeDefinition'
                : 'EnumTypeExtension',
            loc: e1.loc,
            directives: mergeDirectives(e1.directives, e2.directives, config),
            values: mergeEnumValues(e1.values, e2.values, config),
        };
    }
    return config && config.convertExtensions
        ? tslib.__assign(tslib.__assign({}, e1), { kind: 'EnumTypeDefinition' }) : e1;
}

function isStringTypes(types) {
    return typeof types === 'string';
}
function isSourceTypes(types) {
    return types instanceof graphql.Source;
}
function isGraphQLType(definition) {
    return definition.kind === 'ObjectTypeDefinition';
}
function isGraphQLTypeExtension(definition) {
    return definition.kind === 'ObjectTypeExtension';
}
function isGraphQLEnum(definition) {
    return definition.kind === 'EnumTypeDefinition';
}
function isGraphQLEnumExtension(definition) {
    return definition.kind === 'EnumTypeExtension';
}
function isGraphQLUnion(definition) {
    return definition.kind === 'UnionTypeDefinition';
}
function isGraphQLUnionExtension(definition) {
    return definition.kind === 'UnionTypeExtension';
}
function isGraphQLScalar(definition) {
    return definition.kind === 'ScalarTypeDefinition';
}
function isGraphQLScalarExtension(definition) {
    return definition.kind === 'ScalarTypeExtension';
}
function isGraphQLInputType(definition) {
    return definition.kind === 'InputObjectTypeDefinition';
}
function isGraphQLInputTypeExtension(definition) {
    return definition.kind === 'InputObjectTypeExtension';
}
function isGraphQLInterface(definition) {
    return definition.kind === 'InterfaceTypeDefinition';
}
function isGraphQLInterfaceExtension(definition) {
    return definition.kind === 'InterfaceTypeExtension';
}
function isGraphQLDirective(definition) {
    return definition.kind === 'DirectiveDefinition';
}
function extractType(type) {
    var visitedType = type;
    while (visitedType.kind === 'ListType' || visitedType.kind === 'NonNullType') {
        visitedType = visitedType.type;
    }
    return visitedType;
}
function isSchemaDefinition(node) {
    return node.kind === 'SchemaDefinition';
}
function isWrappingTypeNode(type) {
    return type.kind !== graphql.Kind.NAMED_TYPE;
}
function isListTypeNode(type) {
    return type.kind === graphql.Kind.LIST_TYPE;
}
function isNonNullTypeNode(type) {
    return type.kind === graphql.Kind.NON_NULL_TYPE;
}
function printTypeNode(type) {
    if (isListTypeNode(type)) {
        return "[" + printTypeNode(type.type) + "]";
    }
    if (isNonNullTypeNode(type)) {
        return printTypeNode(type.type) + "!";
    }
    return type.name.value;
}

function fieldAlreadyExists(fieldsArr, otherField, config) {
    var result = fieldsArr.find(function (field) { return field.name.value === otherField.name.value; });
    if (result && !(config === null || config === void 0 ? void 0 : config.ignoreFieldConflicts)) {
        var t1 = extractType(result.type);
        var t2 = extractType(otherField.type);
        if (t1.name.value !== t2.name.value) {
            throw new Error("Field \"" + otherField.name.value + "\" already defined with a different type. Declared as \"" + t1.name.value + "\", but you tried to override with \"" + t2.name.value + "\"");
        }
    }
    return !!result;
}
function mergeFields(type, f1, f2, config) {
    var e_1, _a;
    var result = tslib.__spreadArray([], tslib.__read(f2));
    var _loop_1 = function (field) {
        if (fieldAlreadyExists(result, field, config)) {
            var existing = result.find(function (f) { return f.name.value === field.name.value; });
            if (!(config === null || config === void 0 ? void 0 : config.ignoreFieldConflicts)) {
                if (config === null || config === void 0 ? void 0 : config.throwOnConflict) {
                    preventConflicts(type, existing, field);
                }
                else {
                    preventConflicts(type, existing, field);
                }
                if (isNonNullTypeNode(field.type) && !isNonNullTypeNode(existing.type)) {
                    existing.type = field.type;
                }
            }
            existing.arguments = mergeArguments(field['arguments'] || [], existing.arguments || [], config);
            existing.directives = mergeDirectives(field.directives, existing.directives, config);
            existing.description = field.description || existing.description;
        }
        else {
            result.push(field);
        }
    };
    try {
        for (var f1_1 = tslib.__values(f1), f1_1_1 = f1_1.next(); !f1_1_1.done; f1_1_1 = f1_1.next()) {
            var field = f1_1_1.value;
            _loop_1(field);
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (f1_1_1 && !f1_1_1.done && (_a = f1_1.return)) _a.call(f1_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    if (config && config.sort) {
        result.sort(utils.compareNodes);
    }
    if (config && config.exclusions) {
        return result.filter(function (field) { return !config.exclusions.includes(type.name.value + "." + field.name.value); });
    }
    return result;
}
function preventConflicts(type, a, b, ignoreNullability) {
    var aType = printTypeNode(a.type);
    var bType = printTypeNode(b.type);
    if (utils.isNotEqual(aType, bType)) {
        if (safeChangeForFieldType(a.type, b.type) === false) {
            throw new Error("Field '" + type.name.value + "." + a.name.value + "' changed type from '" + aType + "' to '" + bType + "'");
        }
    }
}
function safeChangeForFieldType(oldType, newType, ignoreNullability) {
    // both are named
    if (!isWrappingTypeNode(oldType) && !isWrappingTypeNode(newType)) {
        return oldType.toString() === newType.toString();
    }
    // new is non-null
    if (isNonNullTypeNode(newType)) {
        var ofType = isNonNullTypeNode(oldType) ? oldType.type : oldType;
        return safeChangeForFieldType(ofType, newType.type);
    }
    // old is non-null
    if (isNonNullTypeNode(oldType)) {
        return safeChangeForFieldType(newType, oldType);
    }
    // old is list
    if (isListTypeNode(oldType)) {
        return ((isListTypeNode(newType) && safeChangeForFieldType(oldType.type, newType.type)) ||
            (isNonNullTypeNode(newType) && safeChangeForFieldType(oldType, newType['type'])));
    }
    return false;
}

function mergeInputType(node, existingNode, config) {
    if (existingNode) {
        try {
            return {
                name: node.name,
                description: node['description'] || existingNode['description'],
                kind: (config && config.convertExtensions) ||
                    node.kind === 'InputObjectTypeDefinition' ||
                    existingNode.kind === 'InputObjectTypeDefinition'
                    ? 'InputObjectTypeDefinition'
                    : 'InputObjectTypeExtension',
                loc: node.loc,
                fields: mergeFields(node, node.fields, existingNode.fields, config),
                directives: mergeDirectives(node.directives, existingNode.directives, config),
            };
        }
        catch (e) {
            throw new Error("Unable to merge GraphQL input type \"" + node.name.value + "\": " + e.message);
        }
    }
    return config && config.convertExtensions
        ? tslib.__assign(tslib.__assign({}, node), { kind: 'InputObjectTypeDefinition' }) : node;
}

function mergeInterface(node, existingNode, config) {
    if (existingNode) {
        try {
            return {
                name: node.name,
                description: node['description'] || existingNode['description'],
                kind: (config && config.convertExtensions) ||
                    node.kind === 'InterfaceTypeDefinition' ||
                    existingNode.kind === 'InterfaceTypeDefinition'
                    ? 'InterfaceTypeDefinition'
                    : 'InterfaceTypeExtension',
                loc: node.loc,
                fields: mergeFields(node, node.fields, existingNode.fields, config),
                directives: mergeDirectives(node.directives, existingNode.directives, config),
            };
        }
        catch (e) {
            throw new Error("Unable to merge GraphQL interface \"" + node.name.value + "\": " + e.message);
        }
    }
    return config && config.convertExtensions
        ? tslib.__assign(tslib.__assign({}, node), { kind: 'InterfaceTypeDefinition' }) : node;
}

function alreadyExists(arr, other) {
    return !!arr.find(function (i) { return i.name.value === other.name.value; });
}
function mergeNamedTypeArray(first, second, config) {
    var result = tslib.__spreadArray(tslib.__spreadArray([], tslib.__read(second)), tslib.__read(first.filter(function (d) { return !alreadyExists(second, d); })));
    if (config && config.sort) {
        result.sort(utils.compareNodes);
    }
    return result;
}

function mergeType(node, existingNode, config) {
    if (existingNode) {
        try {
            return {
                name: node.name,
                description: node['description'] || existingNode['description'],
                kind: (config && config.convertExtensions) ||
                    node.kind === 'ObjectTypeDefinition' ||
                    existingNode.kind === 'ObjectTypeDefinition'
                    ? 'ObjectTypeDefinition'
                    : 'ObjectTypeExtension',
                loc: node.loc,
                fields: mergeFields(node, node.fields, existingNode.fields, config),
                directives: mergeDirectives(node.directives, existingNode.directives, config),
                interfaces: mergeNamedTypeArray(node.interfaces, existingNode.interfaces, config),
            };
        }
        catch (e) {
            throw new Error("Unable to merge GraphQL type \"" + node.name.value + "\": " + e.message);
        }
    }
    return config && config.convertExtensions
        ? tslib.__assign(tslib.__assign({}, node), { kind: 'ObjectTypeDefinition' }) : node;
}

function mergeScalar(node, existingNode, config) {
    if (existingNode) {
        return {
            name: node.name,
            description: node['description'] || existingNode['description'],
            kind: (config && config.convertExtensions) ||
                node.kind === 'ScalarTypeDefinition' ||
                existingNode.kind === 'ScalarTypeDefinition'
                ? 'ScalarTypeDefinition'
                : 'ScalarTypeExtension',
            loc: node.loc,
            directives: mergeDirectives(node.directives, existingNode.directives, config),
        };
    }
    return config && config.convertExtensions
        ? tslib.__assign(tslib.__assign({}, node), { kind: 'ScalarTypeDefinition' }) : node;
}

function mergeUnion(first, second, config) {
    if (second) {
        return {
            name: first.name,
            description: first['description'] || second['description'],
            directives: mergeDirectives(first.directives, second.directives, config),
            kind: (config && config.convertExtensions) ||
                first.kind === 'UnionTypeDefinition' ||
                second.kind === 'UnionTypeDefinition'
                ? 'UnionTypeDefinition'
                : 'UnionTypeExtension',
            loc: first.loc,
            types: mergeNamedTypeArray(first.types, second.types, config),
        };
    }
    return config && config.convertExtensions
        ? tslib.__assign(tslib.__assign({}, first), { kind: 'UnionTypeDefinition' }) : first;
}

function mergeGraphQLNodes(nodes, config) {
    return nodes.reduce(function (prev, nodeDefinition) {
        var node = nodeDefinition;
        if (node && node.name && node.name.value) {
            var name_1 = node.name.value;
            if (config && config.commentDescriptions) {
                collectComment(node);
            }
            if (config &&
                config.exclusions &&
                (config.exclusions.includes(name_1 + '.*') || config.exclusions.includes(name_1))) {
                delete prev[name_1];
            }
            else if (isGraphQLType(nodeDefinition) || isGraphQLTypeExtension(nodeDefinition)) {
                prev[name_1] = mergeType(nodeDefinition, prev[name_1], config);
            }
            else if (isGraphQLEnum(nodeDefinition) || isGraphQLEnumExtension(nodeDefinition)) {
                prev[name_1] = mergeEnum(nodeDefinition, prev[name_1], config);
            }
            else if (isGraphQLUnion(nodeDefinition) || isGraphQLUnionExtension(nodeDefinition)) {
                prev[name_1] = mergeUnion(nodeDefinition, prev[name_1], config);
            }
            else if (isGraphQLScalar(nodeDefinition) || isGraphQLScalarExtension(nodeDefinition)) {
                prev[name_1] = mergeScalar(nodeDefinition, prev[name_1], config);
            }
            else if (isGraphQLInputType(nodeDefinition) || isGraphQLInputTypeExtension(nodeDefinition)) {
                prev[name_1] = mergeInputType(nodeDefinition, prev[name_1], config);
            }
            else if (isGraphQLInterface(nodeDefinition) || isGraphQLInterfaceExtension(nodeDefinition)) {
                prev[name_1] = mergeInterface(nodeDefinition, prev[name_1], config);
            }
            else if (isGraphQLDirective(nodeDefinition)) {
                prev[name_1] = mergeDirective(nodeDefinition, prev[name_1]);
            }
        }
        return prev;
    }, {});
}

function mergeTypeDefs(types, config) {
    resetComments();
    var doc = {
        kind: graphql.Kind.DOCUMENT,
        definitions: mergeGraphQLTypes(types, tslib.__assign({ useSchemaDefinition: true, forceSchemaDefinition: false, throwOnConflict: false, commentDescriptions: false }, config)),
    };
    var result;
    if (config && config.commentDescriptions) {
        result = printWithComments(doc);
    }
    else {
        result = doc;
    }
    resetComments();
    return result;
}
function mergeGraphQLTypes(types, config) {
    resetComments();
    var allNodes = types
        .map(function (type) {
        if (Array.isArray(type)) {
            type = mergeTypeDefs(type);
        }
        if (graphql.isSchema(type)) {
            return utils.getDocumentNodeFromSchema(type);
        }
        else if (isStringTypes(type) || isSourceTypes(type)) {
            return graphql.parse(type);
        }
        return type;
    })
        .map(function (ast) { return ast.definitions; })
        .reduce(function (defs, newDef) {
        if (newDef === void 0) { newDef = []; }
        return tslib.__spreadArray(tslib.__spreadArray([], tslib.__read(defs)), tslib.__read(newDef));
    }, []);
    // XXX: right now we don't handle multiple schema definitions
    var schemaDef = allNodes.filter(isSchemaDefinition).reduce(function (def, node) {
        node.operationTypes
            .filter(function (op) { return op.type.name.value; })
            .forEach(function (op) {
            def[op.operation] = op.type.name.value;
        });
        return def;
    }, {
        query: null,
        mutation: null,
        subscription: null,
    });
    var mergedNodes = mergeGraphQLNodes(allNodes, config);
    var allTypes = Object.keys(mergedNodes);
    if (config && config.sort) {
        allTypes.sort(typeof config.sort === 'function' ? config.sort : undefined);
    }
    if (config && config.useSchemaDefinition) {
        var queryType = schemaDef.query ? schemaDef.query : allTypes.find(function (t) { return t === 'Query'; });
        var mutationType = schemaDef.mutation ? schemaDef.mutation : allTypes.find(function (t) { return t === 'Mutation'; });
        var subscriptionType = schemaDef.subscription ? schemaDef.subscription : allTypes.find(function (t) { return t === 'Subscription'; });
        schemaDef = {
            query: queryType,
            mutation: mutationType,
            subscription: subscriptionType,
        };
    }
    var schemaDefinition = utils.createSchemaDefinition(schemaDef, {
        force: config.forceSchemaDefinition,
    });
    if (!schemaDefinition) {
        return Object.values(mergedNodes);
    }
    return tslib.__spreadArray(tslib.__spreadArray([], tslib.__read(Object.values(mergedNodes))), [graphql.parse(schemaDefinition).definitions[0]]);
}

function travelSchemaPossibleExtensions(schema, hooks) {
    var e_1, _a, e_2, _b, e_3, _c, e_4, _d, e_5, _e, e_6, _f, e_7, _g;
    hooks.onSchema(schema);
    var typesMap = schema.getTypeMap();
    try {
        for (var _h = tslib.__values(Object.entries(typesMap)), _j = _h.next(); !_j.done; _j = _h.next()) {
            var _k = tslib.__read(_j.value, 2), type = _k[1];
            var isPredefinedScalar = graphql.isScalarType(type) && graphql.isSpecifiedScalarType(type);
            var isIntrospection = graphql.isIntrospectionType(type);
            if (isPredefinedScalar || isIntrospection) {
                continue;
            }
            if (graphql.isObjectType(type)) {
                hooks.onObjectType(type);
                var fields = type.getFields();
                try {
                    for (var _l = (e_2 = void 0, tslib.__values(Object.entries(fields))), _m = _l.next(); !_m.done; _m = _l.next()) {
                        var _o = tslib.__read(_m.value, 2), field = _o[1];
                        hooks.onObjectField(type, field);
                        var args = field.args || [];
                        try {
                            for (var args_1 = (e_3 = void 0, tslib.__values(args)), args_1_1 = args_1.next(); !args_1_1.done; args_1_1 = args_1.next()) {
                                var arg = args_1_1.value;
                                hooks.onObjectFieldArg(type, field, arg);
                            }
                        }
                        catch (e_3_1) { e_3 = { error: e_3_1 }; }
                        finally {
                            try {
                                if (args_1_1 && !args_1_1.done && (_c = args_1.return)) _c.call(args_1);
                            }
                            finally { if (e_3) throw e_3.error; }
                        }
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (_m && !_m.done && (_b = _l.return)) _b.call(_l);
                    }
                    finally { if (e_2) throw e_2.error; }
                }
            }
            else if (graphql.isInterfaceType(type)) {
                hooks.onInterface(type);
                var fields = type.getFields();
                try {
                    for (var _p = (e_4 = void 0, tslib.__values(Object.entries(fields))), _q = _p.next(); !_q.done; _q = _p.next()) {
                        var _r = tslib.__read(_q.value, 2), field = _r[1];
                        hooks.onInterfaceField(type, field);
                        var args = field.args || [];
                        try {
                            for (var args_2 = (e_5 = void 0, tslib.__values(args)), args_2_1 = args_2.next(); !args_2_1.done; args_2_1 = args_2.next()) {
                                var arg = args_2_1.value;
                                hooks.onInterfaceFieldArg(type, field, arg);
                            }
                        }
                        catch (e_5_1) { e_5 = { error: e_5_1 }; }
                        finally {
                            try {
                                if (args_2_1 && !args_2_1.done && (_e = args_2.return)) _e.call(args_2);
                            }
                            finally { if (e_5) throw e_5.error; }
                        }
                    }
                }
                catch (e_4_1) { e_4 = { error: e_4_1 }; }
                finally {
                    try {
                        if (_q && !_q.done && (_d = _p.return)) _d.call(_p);
                    }
                    finally { if (e_4) throw e_4.error; }
                }
            }
            else if (graphql.isInputObjectType(type)) {
                hooks.onInputType(type);
                var fields = type.getFields();
                try {
                    for (var _s = (e_6 = void 0, tslib.__values(Object.entries(fields))), _t = _s.next(); !_t.done; _t = _s.next()) {
                        var _u = tslib.__read(_t.value, 2), field = _u[1];
                        hooks.onInputFieldType(type, field);
                    }
                }
                catch (e_6_1) { e_6 = { error: e_6_1 }; }
                finally {
                    try {
                        if (_t && !_t.done && (_f = _s.return)) _f.call(_s);
                    }
                    finally { if (e_6) throw e_6.error; }
                }
            }
            else if (graphql.isUnionType(type)) {
                hooks.onUnion(type);
            }
            else if (graphql.isScalarType(type)) {
                hooks.onScalar(type);
            }
            else if (graphql.isEnumType(type)) {
                hooks.onEnum(type);
                try {
                    for (var _v = (e_7 = void 0, tslib.__values(type.getValues())), _w = _v.next(); !_w.done; _w = _v.next()) {
                        var value = _w.value;
                        hooks.onEnumValue(type, value);
                    }
                }
                catch (e_7_1) { e_7 = { error: e_7_1 }; }
                finally {
                    try {
                        if (_w && !_w.done && (_g = _v.return)) _g.call(_v);
                    }
                    finally { if (e_7) throw e_7.error; }
                }
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (_j && !_j.done && (_a = _h.return)) _a.call(_h);
        }
        finally { if (e_1) throw e_1.error; }
    }
}
function mergeExtensions(extensions) {
    return extensions.reduce(function (result, extensionObj) { return [result, extensionObj].reduce(utils.mergeDeep, {}); }, {});
}
function applyExtensionObject(obj, extensions) {
    if (!obj) {
        return;
    }
    obj.extensions = [obj.extensions || {}, extensions || {}].reduce(utils.mergeDeep, {});
}
function applyExtensions(schema, extensions) {
    var e_8, _a, e_9, _b, e_10, _c, e_11, _d, e_12, _e;
    applyExtensionObject(schema, extensions.schemaExtensions);
    try {
        for (var _f = tslib.__values(Object.entries(extensions.types || {})), _g = _f.next(); !_g.done; _g = _f.next()) {
            var _h = tslib.__read(_g.value, 2), typeName = _h[0], data = _h[1];
            var type = schema.getType(typeName);
            if (type) {
                applyExtensionObject(type, data.extensions);
                if (data.type === 'object' || data.type === 'interface') {
                    try {
                        for (var _j = (e_9 = void 0, tslib.__values(Object.entries(data.fields))), _k = _j.next(); !_k.done; _k = _j.next()) {
                            var _l = tslib.__read(_k.value, 2), fieldName = _l[0], fieldData = _l[1];
                            var field = type.getFields()[fieldName];
                            if (field) {
                                applyExtensionObject(field, fieldData.extensions);
                                var _loop_1 = function (arg, argData) {
                                    applyExtensionObject(field.args.find(function (a) { return a.name === arg; }), argData);
                                };
                                try {
                                    for (var _m = (e_10 = void 0, tslib.__values(Object.entries(fieldData.arguments))), _o = _m.next(); !_o.done; _o = _m.next()) {
                                        var _p = tslib.__read(_o.value, 2), arg = _p[0], argData = _p[1];
                                        _loop_1(arg, argData);
                                    }
                                }
                                catch (e_10_1) { e_10 = { error: e_10_1 }; }
                                finally {
                                    try {
                                        if (_o && !_o.done && (_c = _m.return)) _c.call(_m);
                                    }
                                    finally { if (e_10) throw e_10.error; }
                                }
                            }
                        }
                    }
                    catch (e_9_1) { e_9 = { error: e_9_1 }; }
                    finally {
                        try {
                            if (_k && !_k.done && (_b = _j.return)) _b.call(_j);
                        }
                        finally { if (e_9) throw e_9.error; }
                    }
                }
                else if (data.type === 'input') {
                    try {
                        for (var _q = (e_11 = void 0, tslib.__values(Object.entries(data.fields))), _r = _q.next(); !_r.done; _r = _q.next()) {
                            var _s = tslib.__read(_r.value, 2), fieldName = _s[0], fieldData = _s[1];
                            var field = type.getFields()[fieldName];
                            applyExtensionObject(field, fieldData.extensions);
                        }
                    }
                    catch (e_11_1) { e_11 = { error: e_11_1 }; }
                    finally {
                        try {
                            if (_r && !_r.done && (_d = _q.return)) _d.call(_q);
                        }
                        finally { if (e_11) throw e_11.error; }
                    }
                }
                else if (data.type === 'enum') {
                    try {
                        for (var _t = (e_12 = void 0, tslib.__values(Object.entries(data.values))), _u = _t.next(); !_u.done; _u = _t.next()) {
                            var _v = tslib.__read(_u.value, 2), valueName = _v[0], valueData = _v[1];
                            var value = type.getValue(valueName);
                            applyExtensionObject(value, valueData);
                        }
                    }
                    catch (e_12_1) { e_12 = { error: e_12_1 }; }
                    finally {
                        try {
                            if (_u && !_u.done && (_e = _t.return)) _e.call(_t);
                        }
                        finally { if (e_12) throw e_12.error; }
                    }
                }
            }
        }
    }
    catch (e_8_1) { e_8 = { error: e_8_1 }; }
    finally {
        try {
            if (_g && !_g.done && (_a = _f.return)) _a.call(_f);
        }
        finally { if (e_8) throw e_8.error; }
    }
    return schema;
}
function extractExtensionsFromSchema(schema) {
    var result = {
        schemaExtensions: {},
        types: {},
    };
    travelSchemaPossibleExtensions(schema, {
        onSchema: function (schema) { return (result.schemaExtensions = schema.extensions || {}); },
        onObjectType: function (type) { return (result.types[type.name] = { fields: {}, type: 'object', extensions: type.extensions || {} }); },
        onObjectField: function (type, field) {
            return (result.types[type.name].fields[field.name] = {
                arguments: {},
                extensions: field.extensions || {},
            });
        },
        onObjectFieldArg: function (type, field, arg) {
            return (result.types[type.name].fields[field.name].arguments[arg.name] = arg.extensions || {});
        },
        onInterface: function (type) {
            return (result.types[type.name] = { fields: {}, type: 'interface', extensions: type.extensions || {} });
        },
        onInterfaceField: function (type, field) {
            return (result.types[type.name].fields[field.name] = {
                arguments: {},
                extensions: field.extensions || {},
            });
        },
        onInterfaceFieldArg: function (type, field, arg) {
            return (result.types[type.name].fields[field.name].arguments[arg.name] =
                arg.extensions || {});
        },
        onEnum: function (type) { return (result.types[type.name] = { values: {}, type: 'enum', extensions: type.extensions || {} }); },
        onEnumValue: function (type, value) {
            return (result.types[type.name].values[value.name] = value.extensions || {});
        },
        onScalar: function (type) { return (result.types[type.name] = { type: 'scalar', extensions: type.extensions || {} }); },
        onUnion: function (type) { return (result.types[type.name] = { type: 'union', extensions: type.extensions || {} }); },
        onInputType: function (type) { return (result.types[type.name] = { fields: {}, type: 'input', extensions: type.extensions || {} }); },
        onInputFieldType: function (type, field) {
            return (result.types[type.name].fields[field.name] = { extensions: field.extensions || {} });
        },
    });
    return result;
}

var defaultResolverValidationOptions = {
    requireResolversForArgs: 'ignore',
    requireResolversForNonScalar: 'ignore',
    requireResolversForAllFields: 'ignore',
    requireResolversForResolveType: 'ignore',
    requireResolversToMatchSchema: 'ignore',
};
/**
 * Synchronously merges multiple schemas, typeDefinitions and/or resolvers into a single schema.
 * @param config Configuration object
 */
function mergeSchemas(config) {
    var e_1, _a;
    var typeDefs = mergeTypes(config);
    var extractedResolvers = [];
    var extractedExtensions = [];
    try {
        for (var _b = tslib.__values(config.schemas), _c = _b.next(); !_c.done; _c = _b.next()) {
            var schema = _c.value;
            extractedResolvers.push(utils.getResolversFromSchema(schema));
            extractedExtensions.push(extractExtensionsFromSchema(schema));
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        }
        finally { if (e_1) throw e_1.error; }
    }
    extractedResolvers.push.apply(extractedResolvers, tslib.__spreadArray([], tslib.__read(ensureResolvers(config))));
    var resolvers = mergeResolvers(extractedResolvers, config);
    var extensions = mergeExtensions(extractedExtensions);
    return makeSchema({ resolvers: resolvers, typeDefs: typeDefs, extensions: extensions }, config);
}
/**
 * Synchronously merges multiple schemas, typeDefinitions and/or resolvers into a single schema.
 * @param config Configuration object
 */
function mergeSchemasAsync(config) {
    return tslib.__awaiter(this, void 0, void 0, function () {
        var _a, typeDefs, resolvers, extensions;
        var _this = this;
        return tslib.__generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, Promise.all([
                        mergeTypes(config),
                        Promise.all(config.schemas.map(function (schema) { return tslib.__awaiter(_this, void 0, void 0, function () { return tslib.__generator(this, function (_a) {
                            return [2 /*return*/, utils.getResolversFromSchema(schema)];
                        }); }); })).then(function (extractedResolvers) {
                            return mergeResolvers(tslib.__spreadArray(tslib.__spreadArray([], tslib.__read(extractedResolvers)), tslib.__read(ensureResolvers(config))), config);
                        }),
                        Promise.all(config.schemas.map(function (schema) { return tslib.__awaiter(_this, void 0, void 0, function () { return tslib.__generator(this, function (_a) {
                            return [2 /*return*/, extractExtensionsFromSchema(schema)];
                        }); }); })).then(function (extractedExtensions) {
                            return mergeExtensions(extractedExtensions);
                        }),
                    ])];
                case 1:
                    _a = tslib.__read.apply(void 0, [_b.sent(), 3]), typeDefs = _a[0], resolvers = _a[1], extensions = _a[2];
                    return [2 /*return*/, makeSchema({ resolvers: resolvers, typeDefs: typeDefs, extensions: extensions }, config)];
            }
        });
    });
}
function mergeTypes(_a) {
    var schemas = _a.schemas, typeDefs = _a.typeDefs, config = tslib.__rest(_a, ["schemas", "typeDefs"]);
    return mergeTypeDefs(tslib.__spreadArray(tslib.__spreadArray([], tslib.__read(schemas)), tslib.__read((typeDefs ? utils.asArray(typeDefs) : []))), config);
}
function ensureResolvers(config) {
    return config.resolvers ? utils.asArray(config.resolvers) : [];
}
function makeSchema(_a, config) {
    var resolvers = _a.resolvers, typeDefs = _a.typeDefs, extensions = _a.extensions;
    var schema$1 = typeof typeDefs === 'string' ? graphql.buildSchema(typeDefs, config) : graphql.buildASTSchema(typeDefs, config);
    // add resolvers
    if (resolvers) {
        schema$1 = schema.addResolversToSchema({
            schema: schema$1,
            resolvers: resolvers,
            resolverValidationOptions: tslib.__assign(tslib.__assign({}, defaultResolverValidationOptions), (config.resolverValidationOptions || {})),
        });
    }
    // use logger
    if (config.logger) {
        schema$1 = schema.addErrorLoggingToSchema(schema$1, config.logger);
    }
    // use schema directives
    if (config.schemaDirectives) {
        utils.SchemaDirectiveVisitor.visitSchemaDirectives(schema$1, config.schemaDirectives);
    }
    // extensions
    applyExtensions(schema$1, extensions);
    return schema$1;
}

exports.applyExtensions = applyExtensions;
exports.collectComment = collectComment;
exports.extractExtensionsFromSchema = extractExtensionsFromSchema;
exports.extractType = extractType;
exports.isGraphQLDirective = isGraphQLDirective;
exports.isGraphQLEnum = isGraphQLEnum;
exports.isGraphQLEnumExtension = isGraphQLEnumExtension;
exports.isGraphQLInputType = isGraphQLInputType;
exports.isGraphQLInputTypeExtension = isGraphQLInputTypeExtension;
exports.isGraphQLInterface = isGraphQLInterface;
exports.isGraphQLInterfaceExtension = isGraphQLInterfaceExtension;
exports.isGraphQLScalar = isGraphQLScalar;
exports.isGraphQLScalarExtension = isGraphQLScalarExtension;
exports.isGraphQLType = isGraphQLType;
exports.isGraphQLTypeExtension = isGraphQLTypeExtension;
exports.isGraphQLUnion = isGraphQLUnion;
exports.isGraphQLUnionExtension = isGraphQLUnionExtension;
exports.isListTypeNode = isListTypeNode;
exports.isNonNullTypeNode = isNonNullTypeNode;
exports.isSchemaDefinition = isSchemaDefinition;
exports.isSourceTypes = isSourceTypes;
exports.isStringTypes = isStringTypes;
exports.isWrappingTypeNode = isWrappingTypeNode;
exports.mergeArguments = mergeArguments;
exports.mergeDirective = mergeDirective;
exports.mergeDirectives = mergeDirectives;
exports.mergeEnum = mergeEnum;
exports.mergeEnumValues = mergeEnumValues;
exports.mergeExtensions = mergeExtensions;
exports.mergeFields = mergeFields;
exports.mergeGraphQLNodes = mergeGraphQLNodes;
exports.mergeGraphQLTypes = mergeGraphQLTypes;
exports.mergeInputType = mergeInputType;
exports.mergeInterface = mergeInterface;
exports.mergeNamedTypeArray = mergeNamedTypeArray;
exports.mergeResolvers = mergeResolvers;
exports.mergeScalar = mergeScalar;
exports.mergeSchemas = mergeSchemas;
exports.mergeSchemasAsync = mergeSchemasAsync;
exports.mergeType = mergeType;
exports.mergeTypeDefs = mergeTypeDefs;
exports.mergeUnion = mergeUnion;
exports.printComment = printComment;
exports.printTypeNode = printTypeNode;
exports.printWithComments = printWithComments;
exports.pushComment = pushComment;
exports.resetComments = resetComments;
exports.travelSchemaPossibleExtensions = travelSchemaPossibleExtensions;
//# sourceMappingURL=index.cjs.js.map
