import React, { Component } from 'react';
import ReactDOM from 'react-dom';

let DialogResult = {
    ok: "ok",
    cancel: "cancel"
}

let container;

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
                if(container){
                    document.body.removeChild(container);
                }                    
                container = document.createElement("div");
                document.body.appendChild(container);
                dialogContainer = container;
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