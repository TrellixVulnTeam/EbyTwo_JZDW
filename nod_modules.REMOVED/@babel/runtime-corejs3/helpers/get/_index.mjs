import _Reflect$get from "@babel/runtime-corejs3/core-js/reflect/get";
import _Object$getOwnPropertyDescriptor from "@babel/runtime-corejs3/core-js/object/get-own-property-descriptor";
import superPropBase from "../superPropBase/_index.mjs";
export default function _get(target, property, receiver) {
  if (typeof Reflect !== "undefined" && _Reflect$get) {
    _get = _Reflect$get;
  } else {
    _get = function _get(target, property, receiver) {
      var base = superPropBase(target, property);
      if (!base) return;

      var desc = _Object$getOwnPropertyDescriptor(base, property);

      if (desc.get) {
        return desc.get.call(receiver);
      }

      return desc.value;
    };
  }

  return _get(target, property, receiver || target);
}