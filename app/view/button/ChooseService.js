
/**
 * A class that merely serves the purpose of identifying buttons
 * derived from this class (needed for common click event listener).
 **/

Ext.define(
    'PolicyWeb.view.button.ChooseService',
    {
        extend  : 'Ext.button.Button',
        alias   : 'widget.chooseservice',
        tooltip : 'Wählen Sie die Art der Dienste, die angezeigt werden sollen'
    }
);