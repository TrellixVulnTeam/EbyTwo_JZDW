import _typeof from "../typeof/_index.mjs";
import _WeakMap from "@babel/runtime-corejs3/core-js/weak-map";
import _Symbol$replace from "@babel/runtime-corejs3/core-js/symbol/replace";
import _reduceInstanceProperty from "@babel/runtime-corejs3/core-js/instance/reduce";
import _Object$keys from "@babel/runtime-corejs3/core-js/object/keys";
import _Object$create from "@babel/runtime-corejs3/core-js/object/create";
import wrapNativeSuper from "../wrapNativeSuper/_index.mjs";
import getPrototypeOf from "../getPrototypeOf/_index.mjs";
import possibleConstructorReturn from "../possibleConstructorReturn/_index.mjs";
import inherits from "../inherits/_index.mjs";
export default function _wrapRegExp(re, groups) {
  _wrapRegExp = function _wrapRegExp(re, groups) {
    return new BabelRegExp(re, undefined, groups);
  };

  var _RegExp = wrapNativeSuper(RegExp);

  var _super = RegExp.prototype;

  var _groups = new _WeakMap();

  function BabelRegExp(re, flags, groups) {
    var _this = _RegExp.call(this, re, flags);

    _groups.set(_this, groups || _groups.get(re));

    return _this;
  }

  inherits(BabelRegExp, _RegExp);

  BabelRegExp.prototype.exec = function (str) {
    var result = _super.exec.call(this, str);

    if (result) result.groups = buildGroups(result, this);
    return result;
  };

  BabelRegExp.prototype[_Symbol$replace] = function (str, substitution) {
    if (typeof substitution === "string") {
      var groups = _groups.get(this);

      return _super[_Symbol$replace].call(this, str, substitution.replace(/\$<([^>]+)>/g, function (_, name) {
        return "$" + groups[name];
      }));
    } else if (typeof substitution === "function") {
      var _this = this;

      return _super[_Symbol$replace].call(this, str, function () {
        var args = [];
        args.push.apply(args, arguments);

        if (_typeof(args[args.length - 1]) !== "object") {
          args.push(buildGroups(args, _this));
        }

        return substitution.apply(this, args);
      });
    } else {
      return _super[_Symbol$replace].call(this, str, substitution);
    }
  };

  function buildGroups(result, re) {
    var _context;

    var g = _groups.get(re);

    return _reduceInstanceProperty(_context = _Object$keys(g)).call(_context, function (groups, name) {
      groups[name] = result[g[name]];
      return groups;
    }, _Object$create(null));
  }

  return _wrapRegExp.apply(this, arguments);
}