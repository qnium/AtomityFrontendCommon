'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.DialogResult = undefined;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactDom = require('react-dom');

var _reactDom2 = _interopRequireDefault(_reactDom);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var DialogResult = {
    ok: "ok",
    cancel: "cancel"
};

var container = void 0;

var DialogService = {
    showDialog: function showDialog(dialogTemplate, dialogData, parentElement) {
        dialogData = Object.assign({}, dialogData);

        return new Promise(function (onDialogClose) {
            var dialogContainer = void 0;

            if (parentElement) {
                dialogContainer = parentElement;
            } else {
                if (container) {
                    document.body.removeChild(container);
                }
                container = document.createElement("div");
                document.body.appendChild(container);
                dialogContainer = container;
            }

            _reactDom2.default.render(_react2.default.createElement(dialogTemplate, { val: dialogData, onDialogClose: onDialogClose }), dialogContainer);
        });
    }
};

exports.DialogResult = DialogResult;
exports.default = DialogService;