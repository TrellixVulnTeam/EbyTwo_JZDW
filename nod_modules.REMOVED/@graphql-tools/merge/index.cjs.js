'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const utils = require('@graphql-tools/utils');
const graphql = require('graphql');
const schema = require('@graphql-tools/schema');

/**
 * Deep merges multiple resolver definition objects into a single definition.
 * @param resolversDefinitions Resolver definitions to be merged
 * @param options Additional options
 *
 * ```js
 * const { mergeResolvers } = require('@graphql-tools/merge');
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
 * const { mergeResolvers } = require('@graphql-tools/merge');
 * const { loadFilesSync } = require('@graphql-tools/load-files');
 *
 * const resolversArray = loadFilesSync(path.join(__dirname, './resolvers'));
 *
 * const resolvers = mergeResolvers(resolversArray)
 * ```
 */
function mergeResolvers(resolversDefinitions, options) {
    if (!resolversDefinitions || resolversDefinitions.length === 0) {
        return {};
    }
    if (resolversDefinitions.length === 1) {
        const singleDefinition = resolversDefinitions[0];
        if (Array.isArray(singleDefinition)) {
            return mergeResolvers(singleDefinition);
        }
        return singleDefinition;
    }
    const resolversFactories = new Array();
    const resolvers = new Array();
    for (let resolversDefinition of resolversDefinitions) {
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
    let result = {};
    if (resolversFactories.length) {
        result = ((...args) => {
            const resultsOfFactories = resolversFactories.map(factory => factory(...args));
            return resolvers.concat(resultsOfFactories).reduce(utils.mergeDeep, {});
        });
    }
    else {
        result = resolvers.reduce(utils.mergeDeep, {});
    }
    if (options && options.exclusions) {
        for (const exclusion of options.exclusions) {
            const [typeName, fieldName] = exclusion.split('.');
            if (!fieldName || fieldName === '*') {
                delete result[typeName];
            }
            else if (result[typeName]) {
                delete result[typeName][fieldName];
            }
        }
    }
    return result;
}

function mergeArguments(args1, args2, config) {
    const result = deduplicateArguments([].concat(args2, args1).filter(a => a));
    if (config && config.sort) {
        result.sort(utils.compareNodes);
    }
    return result;
}
function deduplicateArguments(args) {
    return args.reduce((acc, current) => {
        const dup = acc.find(arg => arg.name.value === current.name.value);
        if (!dup) {
            return acc.concat([current]);
        }
        return acc;
    }, []);
}

let commentsRegistry = {};
function resetComments() {
    commentsRegistry = {};
}
function collectComment(node) {
    const entityName = node.name.value;
    pushComment(node, entityName);
    switch (node.kind) {
        case 'EnumTypeDefinition':
            node.values.forEach(value => {
                pushComment(value, entityName, value.name.value);
            });
            break;
        case 'ObjectTypeDefinition':
        case 'InputObjectTypeDefinition':
        case 'InterfaceTypeDefinition':
            if (node.fields) {
                node.fields.forEach((field) => {
                    pushComment(field, entityName, field.name.value);
                    if (isFieldDefinitionNode(field) && field.arguments) {
                        field.arguments.forEach(arg => {
                            pushComment(arg, entityName, field.name.value, arg.name.value);
                        });
                    }
                });
            }
            break;
    }
}
function pushComment(node, entity, field, argument) {
    const comment = graphql.getDescription(node, { commentDescriptions: true });
    if (typeof comment !== 'string' || comment.length === 0) {
        return;
    }
    const keys = [entity];
    if (field) {
        keys.push(field);
        if (argument) {
            keys.push(argument);
        }
    }
    const path = keys.join('.');
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
    return maybeArray ? maybeArray.filter(x => x).join(separator || '') : '';
}
function addDescription(cb) {
    return (node, _key, _parent, path, ancestors) => {
        const keys = [];
        const parent = path.reduce((prev, key) => {
            if (['fields', 'arguments', 'values'].includes(key)) {
                keys.push(prev.name.value);
            }
            return prev[key];
        }, ancestors[0]);
        const key = [...keys, parent.name.value].join('.');
        const items = [];
        if (commentsRegistry[key]) {
            items.push(...commentsRegistry[key]);
        }
        return join([...items.map(printComment), node.description, cb(node)], '\n');
    };
}
function indent(maybeString) {
    return maybeString && `  ${maybeString.replace(/\n/g, '\n  ')}`;
}
/**
 * Given array, print each item on its own line, wrapped in an
 * indented "{ }" block.
 */
function block(array) {
    return array && array.length !== 0 ? `{\n${indent(join(array, '\n'))}\n}` : '';
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
    const escaped = value.replace(/"""/g, '\\"""');
    return (value[0] === ' ' || value[0] === '\t') && value.indexOf('\n') === -1
        ? `"""${escaped.replace(/"$/, '"\n')}"""`
        : `"""\n${isDescription ? escaped : indent(escaped)}\n"""`;
}
/**
 * Converts an AST into a string, using one set of reasonable
 * formatting rules.
 */
function printWithComments(ast) {
    return graphql.visit(ast, {
        leave: {
            Name: node => node.value,
            Variable: node => `$${node.name}`,
            // Document
            Document: node => `${node.definitions
                .map(defNode => `${defNode}\n${defNode[0] === '#' ? '' : '\n'}`)
                .join('')
                .trim()}\n`,
            OperationTypeDefinition: node => `${node.operation}: ${node.type}`,
            VariableDefinition: ({ variable, type, defaultValue }) => `${variable}: ${type}${wrap(' = ', defaultValue)}`,
            SelectionSet: ({ selections }) => block(selections),
            Field: ({ alias, name, arguments: args, directives, selectionSet }) => join([wrap('', alias, ': ') + name + wrap('(', join(args, ', '), ')'), join(directives, ' '), selectionSet], '  '),
            Argument: addDescription(({ name, value }) => `${name}: ${value}`),
            // Value
            IntValue: ({ value }) => value,
            FloatValue: ({ value }) => value,
            StringValue: ({ value, block: isBlockString }, key) => isBlockString ? printBlockString(value, key === 'description') : JSON.stringify(value),
            BooleanValue: ({ value }) => (value ? 'true' : 'false'),
            NullValue: () => 'null',
            EnumValue: ({ value }) => value,
            ListValue: ({ values }) => `[${join(values, ', ')}]`,
            ObjectValue: ({ fields }) => `{${join(fields, ', ')}}`,
            ObjectField: ({ name, value }) => `${name}: ${value}`,
            // Directive
            Directive: ({ name, arguments: args }) => `@${name}${wrap('(', join(args, ', '), ')')}`,
            // Type
            NamedType: ({ name }) => name,
            ListType: ({ type }) => `[${type}]`,
            NonNullType: ({ type }) => `${type}!`,
            // Type System Definitions
            SchemaDefinition: ({ directives, operationTypes }) => join(['schema', join(directives, ' '), block(operationTypes)], ' '),
            ScalarTypeDefinition: addDescription(({ name, directives }) => join(['scalar', name, join(directives, ' ')], ' ')),
            ObjectTypeDefinition: addDescription(({ name, interfaces, directives, fields }) => join(['type', name, wrap('implements ', join(interfaces, ' & ')), join(directives, ' '), block(fields)], ' ')),
            FieldDefinition: addDescription(({ name, arguments: args, type, directives }) => `${name + wrap('(', join(args, ', '), ')')}: ${type}${wrap(' ', join(directives, ' '))}`),
            InputValueDefinition: addDescription(({ name, type, defaultValue, directives }) => join([`${name}: ${type}`, wrap('= ', defaultValue), join(directives, ' ')], ' ')),
            InterfaceTypeDefinition: addDescription(({ name, directives, fields }) => join(['interface', name, join(directives, ' '), block(fields)], ' ')),
            UnionTypeDefinition: addDescription(({ name, directives, types }) => join(['union', name, join(directives, ' '), types && types.length !== 0 ? `= ${join(types, ' | ')}` : ''], ' ')),
            EnumTypeDefinition: addDescription(({ name, directives, values }) => join(['enum', name, join(directives, ' '), block(values)], ' ')),
            EnumValueDefinition: addDescription(({ name, directives }) => join([name, join(directives, ' ')], ' ')),
            InputObjectTypeDefinition: addDescription(({ name, directives, fields }) => join(['input', name, join(directives, ' '), block(fields)], ' ')),
            ScalarTypeExtension: ({ name, directives }) => join(['extend scalar', name, join(directives, ' ')], ' '),
            ObjectTypeExtension: ({ name, interfaces, directives, fields }) => join(['extend type', name, wrap('implements ', join(interfaces, ' & ')), join(directives, ' '), block(fields)], ' '),
            InterfaceTypeExtension: ({ name, directives, fields }) => join(['extend interface', name, join(directives, ' '), block(fields)], ' '),
            UnionTypeExtension: ({ name, directives, types }) => join(['extend union', name, join(directives, ' '), types && types.length !== 0 ? `= ${join(types, ' | ')}` : ''], ' '),
            EnumTypeExtension: ({ name, directives, values }) => join(['extend enum', name, join(directives, ' '), block(values)], ' '),
            InputObjectTypeExtension: ({ name, directives, fields }) => join(['extend input', name, join(directives, ' '), block(fields)], ' '),
            DirectiveDefinition: addDescription(({ name, arguments: args, locations }) => `directive @${name}${wrap('(', join(args, ', '), ')')} on ${join(locations, ' | ')}`),
        },
    });
}
function isFieldDefinitionNode(node) {
    return node.kind === 'FieldDefinition';
}

function directiveAlreadyExists(directivesArr, otherDirective) {
    return !!directivesArr.find(directive => directive.name.value === otherDirective.name.value);
}
function nameAlreadyExists(name, namesArr) {
    return namesArr.some(({ value }) => value === name.value);
}
function mergeArguments$1(a1, a2) {
    const result = [...a2];
    for (const argument of a1) {
        const existingIndex = result.findIndex(a => a.name.value === argument.name.value);
        if (existingIndex > -1) {
            const existingArg = result[existingIndex];
            if (existingArg.value.kind === 'ListValue') {
                const source = existingArg.value.values;
                const target = argument.value.values;
                // merge values of two lists
                existingArg.value.values = deduplicateLists(source, target, (targetVal, source) => {
                    const value = targetVal.value;
                    return !value || !source.some((sourceVal) => sourceVal.value === value);
                });
            }
            else {
                existingArg.value = argument.value;
            }
        }
        else {
            result.push(argument);
        }
    }
    return result;
}
function deduplicateDirectives(directives) {
    return directives
        .map((directive, i, all) => {
        const firstAt = all.findIndex(d => d.name.value === directive.name.value);
        if (firstAt !== i) {
            const dup = all[firstAt];
            directive.arguments = mergeArguments$1(directive.arguments, dup.arguments);
            return null;
        }
        return directive;
    })
        .filter(d => d);
}
function mergeDirectives(d1 = [], d2 = [], config) {
    const reverseOrder = config && config.reverseDirectives;
    const asNext = reverseOrder ? d1 : d2;
    const asFirst = reverseOrder ? d2 : d1;
    const result = deduplicateDirectives([...asNext]);
    for (const directive of asFirst) {
        if (directiveAlreadyExists(result, directive)) {
            const existingDirectiveIndex = result.findIndex(d => d.name.value === directive.name.value);
            const existingDirective = result[existingDirectiveIndex];
            result[existingDirectiveIndex].arguments = mergeArguments$1(directive.arguments || [], existingDirective.arguments || []);
        }
        else {
            result.push(directive);
        }
    }
    return result;
}
function validateInputs(node, existingNode) {
    const printedNode = graphql.print(node);
    const printedExistingNode = graphql.print(existingNode);
    // eslint-disable-next-line
    const leaveInputs = new RegExp('(directive @w*d*)|( on .*$)', 'g');
    const sameArguments = printedNode.replace(leaveInputs, '') === printedExistingNode.replace(leaveInputs, '');
    if (!sameArguments) {
        throw new Error(`Unable to merge GraphQL directive "${node.name.value}". \nExisting directive:  \n\t${printedExistingNode} \nReceived directive: \n\t${printedNode}`);
    }
}
function mergeDirective(node, existingNode) {
    if (existingNode) {
        validateInputs(node, existingNode);
        return {
            ...node,
            locations: [
                ...existingNode.locations,
                ...node.locations.filter(name => !nameAlreadyExists(name, existingNode.locations)),
            ],
        };
    }
    return node;
}
function deduplicateLists(source, target, filterFn) {
    return source.concat(target.filter(val => filterFn(val, source)));
}

function mergeEnumValues(first, second, config) {
    if (config === null || config === void 0 ? void 0 : config.consistentEnumMerge) {
        const reversed = first;
        first = second;
        second = reversed;
    }
    const enumValueMap = new Map();
    for (const firstValue of first) {
        enumValueMap.set(firstValue.name.value, firstValue);
    }
    for (const secondValue of second) {
        const enumValue = secondValue.name.value;
        if (enumValueMap.has(enumValue)) {
            const firstValue = enumValueMap.get(enumValue);
            firstValue.description = secondValue.description || firstValue.description;
            firstValue.directives = mergeDirectives(secondValue.directives, firstValue.directives);
        }
        else {
            enumValueMap.set(enumValue, secondValue);
        }
    }
    const result = [...enumValueMap.values()];
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
        ? {
            ...e1,
            kind: 'EnumTypeDefinition',
        }
        : e1;
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
    let visitedType = type;
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
        return `[${printTypeNode(type.type)}]`;
    }
    if (isNonNullTypeNode(type)) {
        return `${printTypeNode(type.type)}!`;
    }
    return type.name.value;
}

function fieldAlreadyExists(fieldsArr, otherField, config) {
    const result = fieldsArr.find(field => field.name.value === otherField.name.value);
    if (result && !(config === null || config === void 0 ? void 0 : config.ignoreFieldConflicts)) {
        const t1 = extractType(result.type);
        const t2 = extractType(otherField.type);
        if (t1.name.value !== t2.name.value) {
            throw new Error(`Field "${otherField.name.value}" already defined with a different type. Declared as "${t1.name.value}", but you tried to override with "${t2.name.value}"`);
        }
    }
    return !!result;
}
function mergeFields(type, f1, f2, config) {
    const result = [...f2];
    for (const field of f1) {
        if (fieldAlreadyExists(result, field, config)) {
            const existing = result.find((f) => f.name.value === field.name.value);
            if (!(config === null || config === void 0 ? void 0 : config.ignoreFieldConflicts)) {
                if (config === null || config === void 0 ? void 0 : config.throwOnConflict) {
                    preventConflicts(type, existing, field, false);
                }
                else {
                    preventConflicts(type, existing, field, true);
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
    }
    if (config && config.sort) {
        result.sort(utils.compareNodes);
    }
    if (config && config.exclusions) {
        return result.filter(field => !config.exclusions.includes(`${type.name.value}.${field.name.value}`));
    }
    return result;
}
function preventConflicts(type, a, b, ignoreNullability = false) {
    const aType = printTypeNode(a.type);
    const bType = printTypeNode(b.type);
    if (utils.isNotEqual(aType, bType)) {
        if (safeChangeForFieldType(a.type, b.type, ignoreNullability) === false) {
            throw new Error(`Field '${type.name.value}.${a.name.value}' changed type from '${aType}' to '${bType}'`);
        }
    }
}
function safeChangeForFieldType(oldType, newType, ignoreNullability = false) {
    // both are named
    if (!isWrappingTypeNode(oldType) && !isWrappingTypeNode(newType)) {
        return oldType.toString() === newType.toString();
    }
    // new is non-null
    if (isNonNullTypeNode(newType)) {
        const ofType = isNonNullTypeNode(oldType) ? oldType.type : oldType;
        return safeChangeForFieldType(ofType, newType.type);
    }
    // old is non-null
    if (isNonNullTypeNode(oldType)) {
        return safeChangeForFieldType(newType, oldType, ignoreNullability);
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
            throw new Error(`Unable to merge GraphQL input type "${node.name.value}": ${e.message}`);
        }
    }
    return config && config.convertExtensions
        ? {
            ...node,
            kind: 'InputObjectTypeDefinition',
        }
        : node;
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
            throw new Error(`Unable to merge GraphQL interface "${node.name.value}": ${e.message}`);
        }
    }
    return config && config.convertExtensions
        ? {
            ...node,
            kind: 'InterfaceTypeDefinition',
        }
        : node;
}

function alreadyExists(arr, other) {
    return !!arr.find(i => i.name.value === other.name.value);
}
function mergeNamedTypeArray(first, second, config) {
    const result = [...second, ...first.filter(d => !alreadyExists(second, d))];
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
            throw new Error(`Unable to merge GraphQL type "${node.name.value}": ${e.message}`);
        }
    }
    return config && config.convertExtensions
        ? {
            ...node,
            kind: 'ObjectTypeDefinition',
        }
        : node;
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
        ? {
            ...node,
            kind: 'ScalarTypeDefinition',
        }
        : node;
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
        ? {
            ...first,
            kind: 'UnionTypeDefinition',
        }
        : first;
}

function mergeGraphQLNodes(nodes, config) {
    return nodes.reduce((prev, nodeDefinition) => {
        const node = nodeDefinition;
        if (node && node.name && node.name.value) {
            const name = node.name.value;
            if (config && config.commentDescriptions) {
                collectComment(node);
            }
            if (config &&
                config.exclusions &&
                (config.exclusions.includes(name + '.*') || config.exclusions.includes(name))) {
                delete prev[name];
            }
            else if (isGraphQLType(nodeDefinition) || isGraphQLTypeExtension(nodeDefinition)) {
                prev[name] = mergeType(nodeDefinition, prev[name], config);
            }
            else if (isGraphQLEnum(nodeDefinition) || isGraphQLEnumExtension(nodeDefinition)) {
                prev[name] = mergeEnum(nodeDefinition, prev[name], config);
            }
            else if (isGraphQLUnion(nodeDefinition) || isGraphQLUnionExtension(nodeDefinition)) {
                prev[name] = mergeUnion(nodeDefinition, prev[name], config);
            }
            else if (isGraphQLScalar(nodeDefinition) || isGraphQLScalarExtension(nodeDefinition)) {
                prev[name] = mergeScalar(nodeDefinition, prev[name], config);
            }
            else if (isGraphQLInputType(nodeDefinition) || isGraphQLInputTypeExtension(nodeDefinition)) {
                prev[name] = mergeInputType(nodeDefinition, prev[name], config);
            }
            else if (isGraphQLInterface(nodeDefinition) || isGraphQLInterfaceExtension(nodeDefinition)) {
                prev[name] = mergeInterface(nodeDefinition, prev[name], config);
            }
            else if (isGraphQLDirective(nodeDefinition)) {
                prev[name] = mergeDirective(nodeDefinition, prev[name]);
            }
        }
        return prev;
    }, {});
}

function mergeTypeDefs(types, config) {
    resetComments();
    const doc = {
        kind: graphql.Kind.DOCUMENT,
        definitions: mergeGraphQLTypes(types, {
            useSchemaDefinition: true,
            forceSchemaDefinition: false,
            throwOnConflict: false,
            commentDescriptions: false,
            ...config,
        }),
    };
    let result;
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
    const allNodes = types
        .map(type => {
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
        .map(ast => ast.definitions)
        .reduce((defs, newDef = []) => [...defs, ...newDef], []);
    // XXX: right now we don't handle multiple schema definitions
    let schemaDef = allNodes.filter(isSchemaDefinition).reduce((def, node) => {
        node.operationTypes
            .filter(op => op.type.name.value)
            .forEach(op => {
            def[op.operation] = op.type.name.value;
        });
        return def;
    }, {
        query: null,
        mutation: null,
        subscription: null,
    });
    const mergedNodes = mergeGraphQLNodes(allNodes, config);
    const allTypes = Object.keys(mergedNodes);
    if (config && config.sort) {
        allTypes.sort(typeof config.sort === 'function' ? config.sort : undefined);
    }
    if (config && config.useSchemaDefinition) {
        const queryType = schemaDef.query ? schemaDef.query : allTypes.find(t => t === 'Query');
        const mutationType = schemaDef.mutation ? schemaDef.mutation : allTypes.find(t => t === 'Mutation');
        const subscriptionType = schemaDef.subscription ? schemaDef.subscription : allTypes.find(t => t === 'Subscription');
        schemaDef = {
            query: queryType,
            mutation: mutationType,
            subscription: subscriptionType,
        };
    }
    const schemaDefinition = utils.createSchemaDefinition(schemaDef, {
        force: config.forceSchemaDefinition,
    });
    if (!schemaDefinition) {
        return Object.values(mergedNodes);
    }
    return [...Object.values(mergedNodes), graphql.parse(schemaDefinition).definitions[0]];
}

function travelSchemaPossibleExtensions(schema, hooks) {
    hooks.onSchema(schema);
    const typesMap = schema.getTypeMap();
    for (const [, type] of Object.entries(typesMap)) {
        const isPredefinedScalar = graphql.isScalarType(type) && graphql.isSpecifiedScalarType(type);
        const isIntrospection = graphql.isIntrospectionType(type);
        if (isPredefinedScalar || isIntrospection) {
            continue;
        }
        if (graphql.isObjectType(type)) {
            hooks.onObjectType(type);
            const fields = type.getFields();
            for (const [, field] of Object.entries(fields)) {
                hooks.onObjectField(type, field);
                const args = field.args || [];
                for (const arg of args) {
                    hooks.onObjectFieldArg(type, field, arg);
                }
            }
        }
        else if (graphql.isInterfaceType(type)) {
            hooks.onInterface(type);
            const fields = type.getFields();
            for (const [, field] of Object.entries(fields)) {
                hooks.onInterfaceField(type, field);
                const args = field.args || [];
                for (const arg of args) {
                    hooks.onInterfaceFieldArg(type, field, arg);
                }
            }
        }
        else if (graphql.isInputObjectType(type)) {
            hooks.onInputType(type);
            const fields = type.getFields();
            for (const [, field] of Object.entries(fields)) {
                hooks.onInputFieldType(type, field);
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
            for (const value of type.getValues()) {
                hooks.onEnumValue(type, value);
            }
        }
    }
}
function mergeExtensions(extensions) {
    return extensions.reduce((result, extensionObj) => [result, extensionObj].reduce(utils.mergeDeep, {}), {});
}
function applyExtensionObject(obj, extensions) {
    if (!obj) {
        return;
    }
    obj.extensions = [obj.extensions || {}, extensions || {}].reduce(utils.mergeDeep, {});
}
function applyExtensions(schema, extensions) {
    applyExtensionObject(schema, extensions.schemaExtensions);
    for (const [typeName, data] of Object.entries(extensions.types || {})) {
        const type = schema.getType(typeName);
        if (type) {
            applyExtensionObject(type, data.extensions);
            if (data.type === 'object' || data.type === 'interface') {
                for (const [fieldName, fieldData] of Object.entries(data.fields)) {
                    const field = type.getFields()[fieldName];
                    if (field) {
                        applyExtensionObject(field, fieldData.extensions);
                        for (const [arg, argData] of Object.entries(fieldData.arguments)) {
                            applyExtensionObject(field.args.find(a => a.name === arg), argData);
                        }
                    }
                }
            }
            else if (data.type === 'input') {
                for (const [fieldName, fieldData] of Object.entries(data.fields)) {
                    const field = type.getFields()[fieldName];
                    applyExtensionObject(field, fieldData.extensions);
                }
            }
            else if (data.type === 'enum') {
                for (const [valueName, valueData] of Object.entries(data.values)) {
                    const value = type.getValue(valueName);
                    applyExtensionObject(value, valueData);
                }
            }
        }
    }
    return schema;
}
function extractExtensionsFromSchema(schema) {
    const result = {
        schemaExtensions: {},
        types: {},
    };
    travelSchemaPossibleExtensions(schema, {
        onSchema: schema => (result.schemaExtensions = schema.extensions || {}),
        onObjectType: type => (result.types[type.name] = { fields: {}, type: 'object', extensions: type.extensions || {} }),
        onObjectField: (type, field) => (result.types[type.name].fields[field.name] = {
            arguments: {},
            extensions: field.extensions || {},
        }),
        onObjectFieldArg: (type, field, arg) => (result.types[type.name].fields[field.name].arguments[arg.name] = arg.extensions || {}),
        onInterface: type => (result.types[type.name] = { fields: {}, type: 'interface', extensions: type.extensions || {} }),
        onInterfaceField: (type, field) => (result.types[type.name].fields[field.name] = {
            arguments: {},
            extensions: field.extensions || {},
        }),
        onInterfaceFieldArg: (type, field, arg) => (result.types[type.name].fields[field.name].arguments[arg.name] =
            arg.extensions || {}),
        onEnum: type => (result.types[type.name] = { values: {}, type: 'enum', extensions: type.extensions || {} }),
        onEnumValue: (type, value) => (result.types[type.name].values[value.name] = value.extensions || {}),
        onScalar: type => (result.types[type.name] = { type: 'scalar', extensions: type.extensions || {} }),
        onUnion: type => (result.types[type.name] = { type: 'union', extensions: type.extensions || {} }),
        onInputType: type => (result.types[type.name] = { fields: {}, type: 'input', extensions: type.extensions || {} }),
        onInputFieldType: (type, field) => (result.types[type.name].fields[field.name] = { extensions: field.extensions || {} }),
    });
    return result;
}

const defaultResolverValidationOptions = {
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
    const typeDefs = mergeTypes(config);
    const extractedResolvers = [];
    const extractedExtensions = [];
    for (const schema of config.schemas) {
        extractedResolvers.push(utils.getResolversFromSchema(schema));
        extractedExtensions.push(extractExtensionsFromSchema(schema));
    }
    extractedResolvers.push(...ensureResolvers(config));
    const resolvers = mergeResolvers(extractedResolvers, config);
    const extensions = mergeExtensions(extractedExtensions);
    return makeSchema({ resolvers, typeDefs, extensions }, config);
}
/**
 * Synchronously merges multiple schemas, typeDefinitions and/or resolvers into a single schema.
 * @param config Configuration object
 */
async function mergeSchemasAsync(config) {
    const [typeDefs, resolvers, extensions] = await Promise.all([
        mergeTypes(config),
        Promise.all(config.schemas.map(async (schema) => utils.getResolversFromSchema(schema))).then(extractedResolvers => mergeResolvers([...extractedResolvers, ...ensureResolvers(config)], config)),
        Promise.all(config.schemas.map(async (schema) => extractExtensionsFromSchema(schema))).then(extractedExtensions => mergeExtensions(extractedExtensions)),
    ]);
    return makeSchema({ resolvers, typeDefs, extensions }, config);
}
function mergeTypes({ schemas, typeDefs, ...config }) {
    return mergeTypeDefs([...schemas, ...(typeDefs ? utils.asArray(typeDefs) : [])], config);
}
function ensureResolvers(config) {
    return config.resolvers ? utils.asArray(config.resolvers) : [];
}
function makeSchema({ resolvers, typeDefs, extensions, }, config) {
    let schema$1 = typeof typeDefs === 'string' ? graphql.buildSchema(typeDefs, config) : graphql.buildASTSchema(typeDefs, config);
    // add resolvers
    if (resolvers) {
        schema$1 = schema.addResolversToSchema({
            schema: schema$1,
            resolvers,
            resolverValidationOptions: {
                ...defaultResolverValidationOptions,
                ...(config.resolverValidationOptions || {}),
            },
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
