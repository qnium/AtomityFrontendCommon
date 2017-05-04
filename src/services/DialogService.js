import React, { Component } from 'react';
import ReactDOM from 'react-dom';

let DialogResult = {
    ok: "ok",
    cancel: "cancel"
}

let DialogService = 
{
    showDialog: (dialogTemplate, dialogData, parentElement) =>
    {
        dialogData = Object.assign({}, dialogData);
        
        return new Promise(onDialogClose =>
        {        
            let dialogContainer;
            
            if(parentElement) {
                dialogContainer = parentElement;
            } else {
                dialogContainer = document.createElement("div");
                document.body.appendChild(dialogContainer);
            }
            
            ReactDOM.render(
                React.createElement(dialogTemplate, {val: dialogData, onDialogClose: onDialogClose}),
                dialogContainer
            );
        });
    }
}

export {DialogResult};
export default DialogService;