'use strict';

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactDom = require('react-dom');

var _reactDom2 = _interopRequireDefault(_reactDom);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var DialogService = {
    showDialog: function showDialog(dialogTemplate, dialogData, parentElement) {
        dialogData = Object.assign({}, dialogData);

        return new Promise(function (onDialogClose) {
            var dialogContainer = void 0;

            if (parentElement) {
                dialogContainer = parentElement;
            } else {
                dialogContainer = document.createElement("div");
                document.body.appendChild(dialogContainer);
            }

            _reactDom2.default.render(_react2.default.createElement(dialogTemplate, { val: dialogData, onDialogClose: onDialogClose }), dialogContainer);
        });
    }
};

module.exports = DialogService;