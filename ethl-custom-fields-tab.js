$(document).ready(function() {
    if (doc_type == 1 && hh_api_version <= 1) {
        var tabs = $("#tabs").tabs();

        var customFieldTabContainer = $("<li>", {
            "data-kind": "custom fields",
            "class": "ui-state-default ui-corner-top",
            "role": "tab",
            "tabindex": "-1",
            "aria-controls": "custom_fields_tab"
        }).appendTo("#tabs ul:not(.sub-tab)");

        $("<a>", {
            "href": "#custom_fields_tab",
            "class": "lang ui-tabs-anchor",
            "role": "presentation",
            "tabindex": "-1",
            "html": "Custom Fields"
        }).appendTo(customFieldTabContainer);

        this.custom_fields_tab = $("<div>", {
            "id": "custom_fields_tab",
            "class": "ui-tabs-panel ui-widget-content ui-corner-bottom",
            "role": "tabpanel",
            "style": "display: none;"
        })
            .appendTo(tabs)
            .custom_fields();

        tabs.tabs("refresh");
    }
});

$.widget("custom.custom_fields", {
    _create: function() {
        this._init_main();
        this._init_grid();
        this._init_edit();
    },

    _init_main: function() {
        var fields = job_data["fields"];
        var customFields = fields["ethl_custom_fields"];

        // Initialise the custom_fields variable.
        if (customFields && customFields.value !== undefined) {
            this.custom_fields = customFields.value;
        } else {
            this.custom_fields = [];
        }
    },

    _init_grid: function() {
        var that = this;

        if (job_data["fields"]["ethl_default_custom_fields_initialised"] === undefined) {
            // Refresh Btn
            this.add_default_fields_button = $( "<button>", {
                "style": "width:219px; float: right;"
            })
                .appendTo( this.element )
                .button({
                    icons: {
                        primary: "ui-icon-plus"
                    },
                    label: "Add default fields"
                }).click(function() { that._add_default_fields(); });
        }

        var button_bar = $("<div>", { style:"text-align:center;overflow:hidden;white-space:nowrap" }).appendTo(this.element);
        // New Btn
        this.btnNew = $( "<button>", {
            style: "width:230px"
        })
            .appendTo( button_bar )
            .button({icons: {primary: "ui-icon-plusthick"}, label: lang.newTxt }).click(function() { that._edit(); });

        // The offset for scaling the grid
        this.topOffset = this.btnNew.position().top + 6;

        // Edit Btn
        this.btnEdit = $( "<button>", {
            style: "width:230px"
        })
            .appendTo( button_bar )
            .button({icons: {primary: "ui-icon-pencil"}, label: lang.editTxt, disabled: true }).click(function() {
                var rowid = that.grid.jqGrid('getGridParam','selrow');
                if (rowid) that._edit(rowid);
            });

        // Delete Btn
        this.btnDel = $( "<button>", {
            style: "width:230px"
        })
            .appendTo( button_bar )
            .button({icons: {primary: "ui-icon-minusthick"}, label: lang.deleteTxt, disabled: true }).click(function() { that._delete(); });

        button_bar.buttonset();

        this.element.append('<div style="height:4px"></div>');  // Spacer

        var gridJson = this.custom_fields.length > 0 ? this.custom_fields : {};

        // Main grid
        this.grid = $( "<table>", {
            "class": "multi_line_grid do_flex",
            "id" : (function(){ return "grid"+$(".ui-jqgrid").length })
        })
            .appendTo( this.element )
            .jqGrid({
                datatype: 'jsonstring',
                datastr: gridJson,
                colNames: ['id', 'Element', 'URL'],
                colModel: [
                    { name: 'id', index: 'id', hidden: true, key: true },
                    { name: 'key', index: 'key' },
                    { name: 'value', index: 'value' },
                ],
                rowNum:50,
                height: this.options.min_height ? this.options.min_height : 512,

                forceFit: true,
                autowidth:true,
                shrinkToFit:true,

                gridview: true,
                hidegrid: false, // Remove the hide button
                scroll: true, // Endless scroll
                hoverrows:false,
                deepempty:true,
                sortname:"DTSTART",
                sortorder:"desc",
                // Events
                onSelectRow :  function(rowid, status, e) { if (rowid) that._toggle_buttons(rowid);},
                ondblClickRow: function(rowid) { that._edit(rowid);},
            }).disableSelection();
    },

    _init_edit: function() {
        var that=this
        // *************************** EDIT DIALOG
        this.edit_dialog = $( "<div>")
            .appendTo( "body" );

        // FORM
        this.edit_form = $( "<form>", {
            "action": "javascript: ;"
        })
            .appendTo( this.edit_dialog );

        // ID
        this.custom_field_id = $( "<input>", {
            id: "ethl_custom_field_id",
            "name": "id",
            "type": "hidden"
        })
            .appendTo( this.edit_form );

        var table = $("<table>").appendTo( this.edit_form );

        // Custom field key
        tr = $("<tr>").appendTo( table );
        $("<td>", {
            "width" : "100px",
            text: "Key"
        }).appendTo( tr );
        td = $("<td>").appendTo( tr );
        this.custom_field_key = $("<input>", {
            id: "ethl_custom_field_key",
            type: "text",
            required:"required",
            width:"240px"
        }).appendTo( td );

        // SUMMARY
        var tr = $("<tr>").appendTo( table );
        var td = $("<td>", {
            colspan : 2,
            text: "Value"
        }).appendTo( tr );
        $(td).append("<br>");
        this.custom_field_value = $("<textarea>", {
            id: "ethl_custom_field_value",
            maxlength: 255,
            lengthcut: "true",
            required: "required",
            wrap: "physical",
            "style": "height:65px; width:350px; resize:none;"
        }).appendTo( td );

        this.edit_dialog
            .dialog({
                modal: true,
                autoOpen: false,
                resizable: false,
                closeOnEscape: true,
                draggable: true,
                minWidth: 380,
                minHeight: 250,
                stack: false,
                buttons: [
                    { icons: {primary: "ui-icon-check"}, text: lang.saveTxt, click: function() {  that._save(); } },
                    { icons: {primary: "ui-icon-closethick"}, text: lang.cancelTxt, click: function() { $(this).dialog("close"); } }
                ]
            });
    },

    _save_custom_field_data: function() {
        var fields = job_data["fields"];
        fields["ethl_custom_fields"] = {
            "type": "array",
            "value": this.custom_fields
        };

        var params = {
            job: job_id,
            fields: fields
        };

        $.ajax({
            url: "/php_functions/job_save.php",
            type: "POST",
            dataType: 'json',
            data: params,
            success: function(data) {
                $("#saving_dialog").dialog("close");
            },
            error: function(jqXHR, status, error) {
                console.log('Failed to save job fields: [' + status + '] ' + error);
            }
        });
    },

    _toggle_buttons: function (rowid)
    {
        // Add check for button enable/disable here.

        this.btnNew.button("enable");
        this.btnEdit.button("enable");
        this.btnDel.button("enable");
    },

    _edit: function(rowid)  // false = New todo
    {
        if (rowid)
        {
            if (this.btnEdit.is(":disabled")) return;
            this.edit_dialog.dialog( "option", "title", lang.editTxt );

            for (var i = 0; i < this.custom_fields.length; i++) {
                var currentRow = this.custom_fields[i];

                if (currentRow.id === rowid) {
                    this.custom_field_id.val(currentRow.id);
                    this.custom_field_key.val(currentRow.key);
                    this.custom_field_value.html(currentRow.value);
                    break;
                }
            }
        }
        else // New task
        {
            this.edit_dialog.dialog( "option", "title", lang.newTxt );
            this.custom_field_key.val("");
            this.custom_field_value.val("");
            this.custom_field_id.val("");
        }

        this.edit_dialog.dialog("open");
    },

    _save: function() {
        var that = this;
        // Clear all red borders
        this.edit_form.find(":input.redborder").removeClass("redborder");
        // Check if all required are complete
        this.edit_form.find(":input[required]").each(function() {
            if ($.trim($(this).val()) == "") $(this).addClass("redborder");
        });
        // If any no red borders, save
        if (this.edit_form.find(".redborder").length==0)
        {
            var customFields = this.custom_fields !== undefined
                ? this.custom_fields
                : [];

            $("#saving_dialog").dialog("open");
            var customFieldId = $("#ethl_custom_field_id").val();
            var customFieldKey = $("#ethl_custom_field_key").val();
            var customFieldValue = $("#ethl_custom_field_value").val();

            if (customFieldId === "") { // It's a new custom field.
                customFieldId = this._calculate_next_id(customFields);

                customFields.push({
                    id: customFieldId,
                    key: customFieldKey,
                    value: customFieldValue
                });

                that.grid.jqGrid('addRowData', customFieldId, {
                    id: customFieldId,
                    key: customFieldKey,
                    value: customFieldValue,
                }, 'first');
            } else {
                for (var i = 0; i < customFields.length; i++) {
                    var currentRow = customFields[i];

                    if (currentRow.id === customFieldId) {
                        customFields[i] = {
                            id: customFieldId,
                            key: customFieldKey,
                            value: customFieldValue
                        };
                        break;
                    }
                }

                that.grid.jqGrid('setRowData', customFieldId, {
                    id: customFieldId,
                    key: customFieldKey,
                    value: customFieldValue
                });
            }

            this.custom_fields = customFields;
            this._save_custom_field_data();
            that.edit_dialog.dialog("close");
        }
    },

    _delete: function()
    {
        var that = this;
        var rowid = this.grid.jqGrid('getGridParam','selrow');
        if (rowid)
        {
            if (this.custom_fields === undefined) {
                return;
            }

            confirm_message(lang.delMsg, function()
            {
                $("#saving_dialog").dialog("open");

                that.custom_fields = that.custom_fields.filter(function(row) {
                    return row.id !== rowid
                });

                that._save_custom_field_data();
                that.grid.jqGrid('delRowData', rowid);
                $("#saving_dialog").dialog("close");
            });
        }
    },

    _refresh: function() {
        this.grid.jqGrid("setGridParam", {
            datatype:"jsonstring",
            datastr: this.custom_fields,
        } ).trigger('reloadGrid');
    },

    _add_default_fields: function() {
        var defaultFields = [
            "Collaboration Hub",
            "Event handover pack (EHP)",
            "Services Overlay",
            "Specification",
            "Event information pack (EIP)",
            "Tech Book",
            "Etherlive network monitoring system (ENMS)",
            "Etherlive device configurator (EDC)",
            "Chat",
            "Perm Install Reference"
        ];

        var customFields = this.custom_fields !== undefined
            ? this.custom_fields
            : [];

        for (var i = 0; i < defaultFields.length; i++) {
            var customFieldId = this._calculate_next_id(customFields);

            customFields.push({
                id: customFieldId.toString(),
                key: defaultFields[i],
                value: ""
            });

            this.grid.jqGrid('addRowData', customFieldId, {
                id: customFieldId.toString(),
                key: defaultFields[i],
                value: "",
            }, 'first');
        }

        // Set a custom field that tells us we've already initialised the default fields.
        var fields = job_data["fields"];
        fields["ethl_default_custom_fields_initialised"] = {
            "type": "text",
            "value": "true"
        };
        job_data["fields"] = fields;

        this.custom_fields = customFields;
        this._save_custom_field_data();
        this.add_default_fields_button.hide();
    },

    _calculate_next_id: function(rows) {
        // If no rows currently exist then return the first index (1).
        if (rows === undefined || rows.length === 0) {
            return 1;
        }

        var highestId = 1;
        for (var i = 0; i < rows.length; i++) {
            if (rows[i].id > highestId) {
                highestId = rows[i].id;
            }
        }

        return parseInt(highestId, 10) + 1;
    }
});