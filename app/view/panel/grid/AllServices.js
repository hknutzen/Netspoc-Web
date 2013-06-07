
Ext.define(
    'PolicyWeb.view.panel.grid.AllServices',
    {
        extend      : 'PolicyWeb.view.panel.grid.Abstract',
        alias       : 'widget.allservices',
        controllers : [ 'Service' ],
        store       : 'AllServices',
        forceFit    : true,
        border      : false,
        features    : [
            {
                groupHeaderTpl    : '{name}',
                ftype             : 'grouping',
                hideGroupedHeader : true
            }
        ],
        columns     : {
            items : [
                { text            : 'Dienstname',
                  dataIndex       : 'service'
                },
                { text : 'Aktion',     dataIndex : 'action', flex : 1 },
                { text : 'Quelle',     dataIndex : 'src'     },
                { text : 'Ziel',       dataIndex : 'dst'     },
                { text : 'Protokoll',  dataIndex : 'proto'   }
            ],
            defaults : {
                flex         : 2,
                menuDisabled : true
            }
        }
    }
);

