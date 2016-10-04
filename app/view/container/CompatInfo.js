
Ext.define(
    'PolicyWeb.view.container.CompatInfo',
    {
        extend : 'Ext.container.Container',
        alias  : 'widget.compat_mode_info_container',
        loader :  {
            url      : 'html/compat_mode_info_text',
            //margin   : '0 0 30 0',  // (top, right, bottom, left)
            autoLoad : true
        }
    }
);
