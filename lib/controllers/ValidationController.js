"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _DataProviderRegistry = require("../services/DataProviderRegistry");

var _DataProviderRegistry2 = _interopRequireDefault(_DataProviderRegistry);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ValidationController = function () {
    function ValidationController(params) {
        var _this = this;

        _classCallCheck(this, ValidationController);

        this.dataProvider = _DataProviderRegistry2.default.get(params.dataProviderName);

        this.validators = {};
        this.dataProvider.executeAction(params.entitiesName, "validators").then(function (result) {
            if (result) {
                result.forEach(function (validator) {
                    var fn = void 0;
                    _this.validators[validator.fieldName] = {
                        validate: eval("fn = " + validator.validationCode),
                        fieldValidated: false
                    };
                });
            }
        });
    }

    _createClass(ValidationController, [{
        key: "validateField",
        value: function validateField(validationParams) {
            var err = null;
            var validator = this.validators[validationParams.fieldName];
            if (validator) {
                err = validator.validate(validationParams.entityObject[validationParams.fieldName]);
                validator.fieldValidated = true;
            }

            if (!err && validationParams.validateOtherFields) {
                err = this.validateEntity(validationParams.entityObject, validationParams.includeUnchangedFields);
            }

            return err;
        }
    }, {
        key: "validateEntity",
        value: function validateEntity(entity, includeUnchangedFields) {
            var err = null;

            for (var key in this.validators) {
                if (includeUnchangedFields || this.validators[key].fieldValidated) {
                    err = this.validateField({
                        entityObject: entity,
                        fieldName: key
                    });
                    if (err) {
                        break;
                    }
                }
            }

            return err;
        }
    }]);

    return ValidationController;
}();

exports.default = ValidationController;