$(document).ready(function() {
    if (doc_type == 1 && hh_api_version <= 1) {
        var tabs = $("#tabs").tabs();

        var budgetTabContainer = $("<li>", {
            "data-kind": "budgets",
            "class": "ui-state-default ui-corner-top",
            "role": "tab",
            "tabindex": "-1",
            "aria-controls": "budgets_tab"
        }).appendTo("#tabs ul");

        $("<a>", {
            "href": "#budgets_tab",
            "class": "lang ui-tabs-anchor",
            "role": "presentation",
            "tabindex": "-1",
            "html": "Budgets"
        }).appendTo(budgetTabContainer);

        // Main budgets tab, this contains the tabs for the budget planner and live budget.
        var budgetTab = $("<div>", {
            "id": "budgets_tab",
            "class": "ui-tabs-panel ui-widget-content ui-corner-bottom",
            "role": "tabpanel",
            "style": "display: none;"
        }).appendTo(tabs);

        // Budget planner / live budget tab navigation.
        $("<ul>", {
            "class": "sub-tab"
        })
            .append($("<li>", {
                    "data-kind": "budget_planner",
                    "class": "ui-state-default ui-corner-top",
                    "role": "tab",
                    "tabindex": "-1",
                    "aria-controls": "budget_planner_tab"
                })
                .append($("<a>", {
                    "href": "#budget_planner_tab",
                    "class": "lang ui-tabs-anchor",
                    "role": "presentation",
                    "tabindex": "-1",
                    "html": "Budget Planner"
                })
            ))
            .append($("<li>", {
                "data-kind": "live_budget",
                "class": "ui-state-default ui-corner-top",
                "role": "tab",
                "tabindex": "-1",
                "aria-controls": "live_budget_tab"
            })
                .append($("<a>", {
                        "href": "#live_budget_tab",
                        "class": "lang ui-tabs-anchor",
                        "role": "presentation",
                        "tabindex": "-1",
                        "html": "Live Budget"
                    })
                ))
            .appendTo(budgetTab);

        // Budget planner tab.
        $("<div>", {
            "id": "budget_planner_tab",
            "class": "ui-tabs-panel ui-widget-content ui-corner-bottom",
            "role": "tabpanel",
            "style": "display: none; border: 1px solid #ccc;"
        })
            .appendTo(budgetTab)
            .budget_planner();

        // Live planner tab.
        $("<div>", {
            "id": "live_budget_tab",
            "class": "ui-tabs-panel ui-widget-content ui-corner-bottom",
            "role": "tabpanel",
            "style": "display: none; border: 1px solid #ccc;"
        })
            .appendTo(budgetTab)
            .live_budget();

        // Create jQuery tabs element or refresh existing.
        budgetTab.tabs();
        tabs.tabs("refresh");
    }
});

$.widget("custom.live_budget", {
    _create: function() {
        var that = this;
        var totalBudget = 0;

        $("<hr>", {
            "style": "margin-bottom: 15px;"
        }).appendTo(this.element);

        Promise.all([this._get_po_totals(), this._get_supplying_cost()]).then(function(results) {
            if (results.length >= 1) {
                var poTotal = results[0];
                totalBudget += poTotal;

                $("<p>", {
                    html: `<span style="font-weight: 600;">${ethl_format_currency(poTotal)}</span>: PO Total`
                }).appendTo(that.element);
            }

            if (results.length >= 2) {
                var supplyingPrice = results[1].equipmentCost;
                var percentageSupplyingCost = supplyingPrice * 0.1; // 10% of equipment cost.
                totalBudget += percentageSupplyingCost;

                $("<p>", {
                    html: `<span style="font-weight: 600;">${ethl_format_currency(percentageSupplyingCost)}</span>: 10% of equipment cost`
                }).appendTo(that.element);

                that._init_margin_table(results);
            }

            $("<h2>", {
                html: "Live Budget Total: " + ethl_format_currency(totalBudget)
            }).prependTo(that.element);
        });
    },

    _init_margin_table: function(results) {
        var poTotal = results[0];
        var totaledData = results[1];
        var revenue = totaledData.totalPrice;

        var fullyLoadedCost = totaledData.resourceCost + (totaledData.equipmentCost * 0.1) + poTotal;

        var marginTable = $("<table>", { "style": "width: 700px; border-collapse: collapse;", "border": "1" })
            .append($("<tr>", { "align": "center", "style": "background: #48B; color: white;" })
                .append($("<th>", { "html": "Margin Type" }))
                .append($("<th>", { "html": "Revenue (£)" }))
                .append($("<th>", { "html": "Cost (£)" }))
                .append($("<th>", { "html": "Margin (£)" }))
                .append($("<th>", { "html": "Margin (%)" }))
            )

            .append($("<tr>", { "align": "center" })
                .append($("<td>", { "html": "Cost Margin" }))
                .append($("<td>", { "html": ethl_format_currency(revenue) }))
                .append($("<td>", { "html": ethl_format_currency(totaledData.totalCost) }))
                .append($("<td>", { "html": ethl_format_currency(revenue - totaledData.totalCost) }))
                .append($("<td>", { "html": parseFloat(((revenue - totaledData.totalCost) / revenue) * 100).toFixed(2) + "%" }))
            )

            .append($("<tr>", { "align": "center" })
                .append($("<td>", { "html": "Fully Loaded Margin" }))
                .append($("<td>", { "html": ethl_format_currency(revenue) }))
                .append($("<td>", { "html": ethl_format_currency(fullyLoadedCost) }))
                .append($("<td>", { "html": ethl_format_currency(revenue - fullyLoadedCost) }))
                .append($("<td>", { "html": parseFloat(((revenue - fullyLoadedCost) / revenue) * 100).toFixed(2) + "%" }))
            );

        if (job_data["fields"] && job_data["fields"]["ethl_budgets"] && job_data["fields"]["ethl_budgets"].value.length > 0) {
            var budgetTotal = 0;
            var latestBudget = job_data["fields"]["ethl_budgets"].value[job_data["fields"]["ethl_budgets"].value.length - 1];

            for (var i = 0; i < latestBudget.rows.length; i++) {
                budgetTotal += parseFloat(latestBudget.rows[i].amount);
            }

            marginTable.append($("<tr>", { "align": "center" })
                .append($("<td>", { "html": "Latest Plan Margin" }))
                .append($("<td>", { "html": ethl_format_currency(revenue) }))
                .append($("<td>", { "html": ethl_format_currency(budgetTotal) }))
                .append($("<td>", { "html": ethl_format_currency(revenue - budgetTotal) }))
                .append($("<td>", { "html": parseFloat(((revenue - budgetTotal) / revenue) * 100).toFixed(2) + "%" }))
            );
        } else {
            marginTable.append($("<tr>", { "align": "center" })
                .append($("<td>", { "html": "Latest Plan Margin" }))
                .append($("<td>", { "html": "N/A" }))
                .append($("<td>", { "html": "N/A" }))
                .append($("<td>", { "html": "N/A" }))
                .append($("<td>", { "html": "N/A" }))
            );
        }

        marginTable.appendTo(this.element);
    },

    _get_po_totals: function() {
        return new Promise(function (resolve, reject) {
            $.ajax({
                url: "/php_functions/subcontractors_list.php",
                type: "GET",
                dataType: 'json',
                data: {
                    main_id: job_id,
                    type: 1,
                    rows: 10000
                },
                success: function(data) {
                    console.log(data);
                    var poTotal = 0;

                    if (data.rows) {
                        for (var i = 0; i < data.rows.length; i++) {
                            var rowData = data.rows[i];

                            poTotal += parseFloat(rowData.TOTAL, 10);
                        }
                    }

                    resolve(poTotal);
                },
                error: function(jqXHR, status, error) {
                    reject("Failed to retrieve PO totals: [" + status + "] " + error);
                }
            });
        });
    },

    _get_default_costs_and_margins: function(data, callback) {
        var that = this;

        this.ethl_default_costs_and_margins = {
            inventory: {},
            labour: {}
        };

        this._preload_labour_data(async function() {
            for (var i = 0; i < data.length; i++) {
                await that._get_default_item_cost_and_margin(data[i]);
            }

            callback(this.ethl_default_costs_and_margins);
        });
    },

    _preload_labour_data: function(callback) {
        var that = this;

        $.ajax({
            url: "/modules/services/list.php",
            type: "POST",
            data: {
                del: false,
                rows: 500,
                page: 1
            },
            success: function (data) {
                that.ethl_labour_items = data.rows;
                callback();
            },
            error: function (jqXHR, textStatus, errorThrown) {
                error_message(lang.error[1] + " (" + errorThrown + ").");
            }
        });
    },

    _get_default_item_cost_and_margin: function (row) {
        var that = this;
        var itemId = row.LIST_ID;

        return new Promise(function(resolve) {
            // Check if this is a valid stock item.
            if (itemId == 0) {
                return resolve();
            }

            // Check if the default values have already been retrieved for this item ID.
            if (row.kind == 4) {
                if (itemId in that.ethl_default_costs_and_margins.labour) {
                    return resolve();
                }
            } else {
                if (itemId in that.ethl_default_costs_and_margins.inventory) {
                    return resolve();
                }
            }

            if (row.kind == 4) {
                for (var i = 0; i < that.ethl_labour_items.length; i++) {
                    var item = that.ethl_labour_items[i];

                    if (item.id == row.LIST_ID) {
                        var lineItemRow = {};
                        var fields = item.cell.data.CUSTOM_FIELDS;

                        lineItemRow["cost"] = fields["ethl_inventory_default_cost"] !== undefined
                            ? parseFloat(fields["ethl_inventory_default_cost"])
                            : 0;
                        lineItemRow["margin"] = fields["ethl_inventory_default_margin"] !== undefined
                            ? parseFloat(fields["ethl_inventory_default_margin"])
                            : 0;

                        that.ethl_default_costs_and_margins.labour[itemId] = lineItemRow;
                        return resolve();
                    }
                }
            }

            $.ajax({
                url: "/modules/stock/list.php",
                type: "POST",
                data: {
                    unq: itemId,
                    rows: 1
                },
                success: function (data) {
                    var lineItemRow = {};
                    var fields = data.rows[0].cell.data.fields;

                    lineItemRow["cost"] = fields["ethl_inventory_default_cost"] !== undefined
                        ? parseFloat(fields["ethl_inventory_default_cost"])
                        : 0;
                    lineItemRow["margin"] = fields["ethl_inventory_default_margin"] !== undefined
                        ? parseFloat(fields["ethl_inventory_default_margin"])
                        : 0;

                    that.ethl_default_costs_and_margins.inventory[itemId] = lineItemRow;
                    return resolve();
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    error_message(lang.error[1] + " (" + errorThrown + ").");
                    return resolve();
                }
            });
        });


    },

    _get_supplying_cost: function() {
        var that = this;

        return new Promise(function (resolve, reject) {
            $.ajax({
                url: "/frames/items_to_supply_list.php",
                type: "POST",
                dataType: 'json',
                data: {
                    job: job_id
                },
                success: function(data) {
                    var supplyingPrice = 0;
                    var equipmentCost = 0;
                    var resourceCost = 0;
                    var totalCost = 0;

                    if (data) {
                        that._get_default_costs_and_margins(data, function() {
                            for (var i = 0; i < data.length; i++) {
                                var rowData = data[i];
                                var quantity = parseFloat(rowData.qty, 10);
                                var price = parseFloat(rowData.PRICE, 10);

                                supplyingPrice += price;

                                if (rowData.FLAG != 0 && rowData.CUSTOM_FIELDS) {
                                    if (rowData.CUSTOM_FIELDS["ethl_inventory_cost"] !== null) {
                                        switch (rowData.kind) {
                                            case "2": // Equipment cost
                                                var cost = (parseFloat(rowData.CUSTOM_FIELDS["ethl_inventory_cost"].value, 10) * quantity);
                                                if (cost) {
                                                    equipmentCost += cost;
                                                }
                                                break;

                                            case "4": // Labour cost
                                                var cost = (parseFloat(rowData.CUSTOM_FIELDS["ethl_inventory_cost"].value, 10) * quantity);
                                                if (cost) {
                                                    resourceCost += cost;
                                                }
                                                break;
                                        }
                                    }
                                } else {
                                    switch (rowData.kind) {
                                        case "2":
                                            if (that.ethl_default_costs_and_margins.inventory[rowData.LIST_ID] !== undefined) {
                                                var cost = (parseFloat(that.ethl_default_costs_and_margins.inventory[rowData.LIST_ID].cost) * quantity);
                                                if (cost) {
                                                    equipmentCost += cost;
                                                }
                                            }
                                            break;

                                        case "4":
                                            if (that.ethl_default_costs_and_margins.labour[rowData.LIST_ID] !== undefined) {
                                                var cost = (parseFloat(that.ethl_default_costs_and_margins.labour[rowData.LIST_ID].cost) * quantity);
                                                if (cost) {
                                                    resourceCost += cost;
                                                }
                                            }
                                            break;
                                    }
                                }
                            }

                            totalCost = equipmentCost + resourceCost;

                            resolve({
                                totalPrice: supplyingPrice,
                                totalCost: totalCost,
                                equipmentCost: equipmentCost,
                                resourceCost: resourceCost
                            });
                        });
                    }
                },
                error: function(jqXHR, status, error) {
                    reject("Failed to retrieve costs: [" + status + "] " + error);
                }
            });
        });
    }
});

$.widget("custom.budget_planner", {
    _create: function() {
        this._init_main();
        this._init_edit();
    },

    _init_main: function() {
        var fields = job_data["fields"];
        var budgetsData = fields["ethl_budgets"];

        // Initialise the budgets_data variable.
        if (budgetsData && budgetsData.value !== undefined) {
            this.budgets_data = budgetsData.value;
        } else {
            this.budgets_data = [];
        }

        // Initialise budget selector dropdown and creation button.
        this._init_budget_selector();

        if (this.budgets_data && this.budgets_data.length > 0) {
            this.current_budget = this.budgets_data[0];
            this._init_grid();
        }
    },

    _init_grid: function() {
        var that = this;
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

        var gridJson = this.budgets_data.length > 0 ? this.budgets_data[0] : {};

        // Main grid
        this.grid = $( "<table>", {
            "class": "multi_line_grid do_flex",
            "id" : (function(){ return "grid"+$(".ui-jqgrid").length })
        })
            .appendTo( this.element )
            .jqGrid({
                datatype: 'jsonstring',
                datastr: gridJson,
                colNames: ['id', 'Description', 'Amount (£)', 'Date Added'],
                colModel: [
                    { name: 'id', index: 'id', hidden: true, key: true },
                    { name: 'description', index: 'description' },
                    { name: 'amount', index: 'amount' },
                    { name: 'date_added', index: 'date_added' },
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
                gridComplete: function() {

                },
                beforeProcessing : function(data)
                {
                },
                loadError : function(xhr,textStatus,errorThrown)
                {
                }
            }).disableSelection();

        // this.get_budgets();
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
        this.budget_id = $( "<input>", {
            id: "ethl_budget_id",
            "name": "id",
            "type": "hidden"
        })
            .appendTo( this.edit_form );

        var table = $("<table>").appendTo( this.edit_form );

        // Budget Amount
        tr = $("<tr>").appendTo( table );
        $("<td>", {
            "width" : "100px",
            text: "Amount (£)"
        }).appendTo( tr );
        td = $("<td>").appendTo( tr );
        this.budget_amount = $("<input>", {
            id: "ethl_budget_amount",
            type: "number",
            required:"required",
            width:"240px"
        })
            .on("change", function() {
                $(this).val(parseFloat($(this).val()).toFixed(2));
            })
            .appendTo( td );

        // Budget Date Added
        tr = $("<tr>").appendTo( table );
        $("<td>", {
            "width" : "100px",
            text: "Date Added"
        }).appendTo( tr );
        td = $("<td>").appendTo( tr );
        this.budget_date_added = $("<input>", {
            id: "ethl_budget_date_added",
            type: "date",
            required:"required",
            width:"240px",
            value: moment().format("YYYY-MM-DD")
        }).appendTo( td );

        // SUMMARY
        var tr = $("<tr>").appendTo( table );
        var td = $("<td>", {
            colspan : 2,
            text: lang.descriptionTxt
        }).appendTo( tr );
        $(td).append("<br>");
        this.budget_description = $("<textarea>", {
            id: "ethl_budget_description",
            name: "description",
            maxlength: 255,
            lengthcut: "true",
            required: "required",
            wrap: "physical",
            "style": "height:50px; width:350px; resize:none;"
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

    _init_budget_selector: function() {
        var that = this;
        var div = $("<div>", { style:"padding:4px 0 10px;" }).appendTo(this.element);

        this.budget_version = $('<select>', {
            'id':           'ethl_budget_version',
            'style':        'width: 275px; height: 30px;',
        }).on("change", function() {
            for (var i = 0; i < that.budgets_data.length; i++) {
                if (that.budgets_data[i].id == $(this).val()) {
                    that.current_budget = that.budgets_data[i];
                    that._refresh();
                    break;
                }
            }
        });



        // Populate the budget version dropdown.
        if (this.budgets_data && this.budgets_data.length > 0) {
            for (var i = 0; i < this.budgets_data.length; i++) {
                var budget = this.budgets_data[i];

                this.budget_version.append($("<option>", {
                    'html': budget.name,
                    'value': budget.id
                }));
            }
        } else {
            this.budget_version.append($("<option>", {
                'html': 'No budgets available',
                'value': 'null'
            }));
        }

        $(div).append(this.budget_version);

        // Refresh Btn
        this.create_budget_button = $( "<button>", {
            "style": "width:219px; float: right;"
        })
            .appendTo( div )
            .button({
                icons: {
                    primary: "ui-icon-plus"
                },
                label: "Create new budget"
            }).click(function() { that._create_new_budget(); });

        this.element.append(div);
        this.element.append('<div style="height:15px"></div>');  // Spacer
    },

    _create_new_budget: function() {
        var creationDate = moment().format("DD/MM/YYYY HH:mm");
        var budgetId = this._calculate_next_id(this.budgets_data);

        var newBudget = {
            id: budgetId,
            name: "#" + budgetId + " - " + creationDate,
            rows: this.current_budget && this.current_budget.rows.length > 0
                ? [].concat(this.current_budget.rows)
                : []
        };

        this.budgets_data.push(newBudget);
        this._save_budget_data();

        // This is the first budget that has been created.
        if (this.budgets_data.length === 1) {
            this.budget_version.find("option").remove();
            this.current_budget = this.budgets_data[0];
            this._init_grid();
        } else {
            for (var i = 0; i < this.budgets_data.length; i++) {
                if (this.budgets_data[i].id === budgetId) {
                    this.current_budget = this.budgets_data[i];
                }
            }

            alert("A new budget has been created, the previously selected budget lines have been copied across.");
        }

        this.budget_version.append($("<option>", {
            'html': newBudget.name,
            'value': newBudget.id
        }).prop("selected", true));
    },

    _save_budget_data: function() {
        var fields = job_data["fields"];
        fields["ethl_budgets"] = {
            "type": "array",
            "value": this.budgets_data
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

            for (var i = 0; i < this.current_budget.rows.length; i++) {
                var currentRow = this.current_budget.rows[i];

                if (currentRow.id === rowid) {
                    this.budget_id.val(currentRow.id);
                    this.budget_amount.val(currentRow.amount);
                    this.budget_date_added.val(currentRow.date_added);
                    this.budget_description.html(currentRow.description);
                    break;
                }
            }
        }
        else // New task
        {
            this.edit_dialog.dialog( "option", "title", lang.newTxt );
            this.budget_amount.val("");
            this.budget_date_added.val(moment().format("YYYY-MM-DD"));
            this.budget_description.val("");
            this.budget_id.val("");
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
            var budgetRows = this.current_budget.rows !== undefined
                ? this.current_budget.rows
                : [];

            $("#saving_dialog").dialog("open");
            var budgetId = $("#ethl_budget_id").val();
            var budgetAmount = $("#ethl_budget_amount").val();
            var budgetDateAdded = $("#ethl_budget_date_added").val();
            var budgetDescription = $("#ethl_budget_description").val();

            if (budgetId === "") { // It's a new budget line.
                budgetId = this._calculate_next_id(budgetRows);

                budgetRows.push({
                    id: budgetId,
                    amount: budgetAmount,
                    description: budgetDescription,
                    date_added: budgetDateAdded
                });

                that.grid.jqGrid('addRowData', budgetId, {
                    id: budgetId,
                    amount: budgetAmount,
                    description: budgetDescription,
                    date_added: budgetDateAdded
                }, 'first');
            } else {
                for (var i = 0; i < budgetRows.length; i++) {
                    var currentRow = budgetRows[i];

                    if (currentRow.id === budgetId) {
                        budgetRows[i] = {
                            id: budgetId,
                            amount: budgetAmount,
                            description: budgetDescription,
                            date_added: budgetDateAdded
                        };
                        break;
                    }
                }

                that.grid.jqGrid('setRowData', budgetId, {
                    id: budgetId,
                    amount: budgetAmount,
                    description: budgetDescription,
                    date_added: budgetDateAdded
                });
            }

            this.current_budget.rows = budgetRows;
            this._save_budget_data();
            that.edit_dialog.dialog("close");
        }
    },

    _delete: function()
    {
        var that = this;
        var rowid = this.grid.jqGrid('getGridParam','selrow');
        if (rowid)
        {
            if (this.current_budget.rows === undefined) {
                return;
            }

            confirm_message(lang.delMsg, function()
            {
                $("#saving_dialog").dialog("open");

                that.current_budget.rows = that.current_budget.rows.filter(function(row) {
                    return row.id !== rowid
                });

                that._save_budget_data();
                that.grid.jqGrid('delRowData', rowid);
                $("#saving_dialog").dialog("close");
            });
        }
    },

    _refresh: function() {
        this.grid.jqGrid("setGridParam", {
            datatype:"jsonstring",
            datastr: this.current_budget,
        } ).trigger('reloadGrid');
    },

    _remove_budgets: function() {
        this.budgets_data = [];
        this._save_budget_data();
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