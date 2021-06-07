$(document).ready(function() {
    // Initialise the inventory costings inputs on the /modules/stock page.
    if (doc_type == 2 && hh_api_version <= 1) {
        $("#edit_form").inventory_costings();
    }

    // Initialise the labor costings inputs on the /modules/services page.
    if (doc_type == 8 && hh_api_version <= 1) {
        $("#edit_form").labour_costings();
    }
});

/**
 * The inventory costings inputs widget on the inventory management page.
 */
$.widget("custom.inventory_costings", {
    _create: function() {
        if (doc_type != 2 || hh_api_version > 1) {
            console.log("Cannot instantiate inventory_costings widget as we are not on the inventory page.");
            return;
        }

        this._init_hooks();
        this._init_main();
        this._init_listeners();
    },

    _init_hooks: function() {
        // Save original functions so we can call them. We save them to the window
        // as we can't access the widget "this" globally.
        window._save_original = window.save;
        window._edit_item_original = window.edit_item;

        // Override the original functions with our hooks.
        window.save = this._save_hook;
        window.edit_item = this._edit_item_hook;
    },

    _init_main: function() {
        this.costing_inputs =
        $("<tr>")
            .append($("<td>", { "align": "left" })
                .append($("<span>", { "class": "lang label", "html": "Default Cost : " }))
            )
            .append($("<td>")
                .append($("<table>", { "style": "width: 100%;" })
                    .append($("<tr>")
                        .append($("<td>", { "align": "left" })
                            .append($("<span>", { "class": "currency_prefix label" }))
                            .append($("<input>", {
                                "class": "price_edit",
                                "id": "ethl_inventory_default_cost",
                                "name": "ethl_inventory_default_cost",
                                "value": "0.00",
                                "style": "width: 100px;",
                                "required": "required"
                            }))
                        )
                        .append($("<td>", { "align": "right" })
                            .append($("<span>", { "class": "lang label", "html": "Default Margin : " }))
                            .append($("<span>", { "class": "label", "html": "%" }))
                            .append($("<input>", {
                                "class": "price_edit",
                                "id": "ethl_inventory_default_margin",
                                "name": "ethl_inventory_default_margin",
                                "value": "0.00",
                                "style": "width: 100px;",
                                "required": "required"
                            }))
                        )
                    )
                )
            );

        this.costing_inputs.insertAfter($("span[data-label='priceATxt']").parents("tr"));
    },

    _init_listeners: function() {
        var itemPrice = $("#stock_edit_dlg input[name='PRICE1']");
        var itemCost = $("#stock_edit_dlg input#ethl_inventory_default_cost");
        var itemMargin = $("#stock_edit_dlg input#ethl_inventory_default_margin");

        itemPrice.on("input", function() {
            var priceValue = parseFloat(itemPrice.val(), 10);
            var costValue = parseFloat(itemCost.val(), 10);

            if (!priceValue) {
                priceValue = parseFloat(0, 10).toFixed(2)
            }
            if (!costValue) {
                costValue = parseFloat(0, 10).toFixed(2)
            }

            if (costValue != 0) {
                itemMargin.val(parseFloat(((priceValue / costValue) * 100) - 100, 10).toFixed(2));
            } else {
                itemMargin.val(parseInt(0).toFixed(2));
            }


        });

        itemCost.on("input", function() {
            var priceValue = parseFloat(itemPrice.val(), 10);
            var costValue = parseFloat(itemCost.val(), 10);

            if (!priceValue) {
                priceValue = parseFloat(0, 10).toFixed(2)
            }
            if (!costValue) {
                costValue = parseFloat(0, 10).toFixed(2)
            }

            if (priceValue != 0) {
                itemMargin.val(parseFloat(((priceValue / costValue) * 100) - 100, 10).toFixed(2));
            } else {
                itemMargin.val(parseInt(0).toFixed(2));
            }
        });

        itemMargin.on("input", function() {
            var marginValue = parseFloat(itemMargin.val());
            var costValue = parseFloat(itemCost.val());

            if (!marginValue) {
                itemMargin.val(parseInt(0, 10).toFixed(2));
            }

            if (!costValue) {
                itemCost.val(parseInt(0, 10).toFixed(2));
            }

            var price = costValue * (1 + (marginValue / 100));
            itemPrice.val(parseFloat(price, 10).toFixed(2));
        });
    },

    _save_hook: function() {
        var itemCost = $("#ethl_inventory_default_cost").val();
        var itemMargin = $("#ethl_inventory_default_margin").val();

        // Use functions provided in the stock page.
        window._save_custom_field_value("ethl_inventory_default_cost", itemCost);
        window._save_custom_field_value("ethl_inventory_default_margin", itemMargin);

        // Call the original save function.
        window._save_original();
    },

    _edit_item_hook: function() {
        window._edit_item_original();

        var itemCost = window._get_custom_field_value("ethl_inventory_default_cost");
        var itemMargin = window._get_custom_field_value("ethl_inventory_default_margin");

        if (itemCost === null) {
            itemCost = "0.00";
        }
        if (itemMargin === null) {
            itemMargin = "0.00";
        }

        $("#ethl_inventory_default_cost").val(itemCost);
        $("#ethl_inventory_default_margin").val(itemMargin);
    }
});

/**
 * The labour costings inputs widget on the inventory management page.
 */
$.widget("custom.labour_costings", {
    _create: function() {
        if (doc_type != 8 || hh_api_version > 1) {
            console.log("Cannot instantiate labour_costings widget as we are not on the labor page.");
            return;
        }

        this._init_hooks();
        this._init_main();
        this._init_functions();
        this._init_listeners();
    },

    _init_hooks: function() {
        // Save original functions so we can call them. We save them to the window
        // as we can't access the widget "this" globally.
        window._save_original = window.save;
        window._edit_item_original = window.edit_item;

        // Override the original functions with our hooks.
        window.save = this._save_hook;
        window.edit_item = this._edit_item_hook;
    },

    _init_main: function() {
        this.costing_inputs =
            $("<tr>")
                .append($("<td>", { "align": "left" })
                    .append($("<span>", { "class": "lang label", "html": "Default Cost : " }))
                )
                .append($("<td>")
                    .append($("<table>", { "style": "width: 100%;" })
                        .append($("<tr>")
                            .append($("<td>", { "align": "left" })
                                .append($("<span>", { "class": "currency_prefix label" }))
                                .append($("<input>", {
                                    "class": "price_edit",
                                    "id": "ethl_inventory_default_cost",
                                    "name": "ethl_inventory_default_cost",
                                    "value": "0.00",
                                    "style": "width: 100px;",
                                    "required": "required"
                                }))
                            )
                            .append($("<td>", { "align": "right" })
                                .append($("<span>", { "class": "lang label", "html": "Default Margin : " }))
                                .append($("<span>", { "class": "label", "html": "%" }))
                                .append($("<input>", {
                                    "class": "price_edit",
                                    "id": "ethl_inventory_default_margin",
                                    "name": "ethl_inventory_default_margin",
                                    "value": "0.00",
                                    "style": "width: 100px;",
                                    "required": "required"
                                }))
                            )
                        )
                    )
                );

        this.costing_inputs.insertAfter($("td[data-label='pricesTxt']").parents("tr"));
    },

    _init_functions: function() {
        window._save_custom_field_value = function(key, value) {
            var customs = $("#edit_form").data("fields");
            if (!customs || typeof (customs) != "object")
                customs = {};
            customs[key] = value;
            $("#edit_form").data("fields", customs)
        };

        window._get_custom_field_value = function(key) {
            var customs = $("#edit_form").data("fields");
            if (typeof (customs) != "object")
                customs = null;
            return !customs || typeof (customs[key]) == "undefined" ? null : customs[key];
        };
    },

    _init_listeners: function() {
        var itemPrice = $("#item_edit_dlg input[name='PRICE1']");
        var itemCost = $("#item_edit_dlg input#ethl_inventory_default_cost");
        var itemMargin = $("#item_edit_dlg input#ethl_inventory_default_margin");

        itemPrice.on("input", function() {
            var priceValue = parseFloat(itemPrice.val(), 10);
            var costValue = parseFloat(itemCost.val(), 10);

            if (!priceValue) {
                priceValue = parseFloat(0, 10).toFixed(2)
            }
            if (!costValue) {
                costValue = parseFloat(0, 10).toFixed(2)
            }

            if (costValue != 0) {
                itemMargin.val(parseFloat(((priceValue / costValue) * 100) - 100, 10).toFixed(2));
            } else {
                itemMargin.val(parseInt(0).toFixed(2));
            }


        });

        itemCost.on("input", function() {
            var priceValue = parseFloat(itemPrice.val(), 10);
            var costValue = parseFloat(itemCost.val(), 10);

            if (!priceValue) {
                priceValue = parseFloat(0, 10).toFixed(2)
            }
            if (!costValue) {
                costValue = parseFloat(0, 10).toFixed(2)
            }

            if (priceValue != 0) {
                itemMargin.val(parseFloat(((priceValue / costValue) * 100) - 100, 10).toFixed(2));
            } else {
                itemMargin.val(parseInt(0).toFixed(2));
            }
        });

        itemMargin.on("input", function() {
            var marginValue = parseFloat(itemMargin.val());
            var costValue = parseFloat(itemCost.val());

            if (!marginValue) {
                itemMargin.val(parseInt(0, 10).toFixed(2));
            }

            if (!costValue) {
                itemCost.val(parseInt(0, 10).toFixed(2));
            }

            var price = costValue * (1 + (marginValue / 100));
            itemPrice.val(parseFloat(price, 10).toFixed(2));
        });
    },

    _save_hook: function() {
        var itemCost = $("#ethl_inventory_default_cost").val();
        var itemMargin = $("#ethl_inventory_default_margin").val();

        // Use functions provided in the stock page.
        window._save_custom_field_value("ethl_inventory_default_cost", itemCost);
        window._save_custom_field_value("ethl_inventory_default_margin", itemMargin);

        // Call the original save function.
        window._save_original();
    },

    _edit_item_hook: function() {
        window._edit_item_original();

        var itemCost = window._get_custom_field_value("ethl_inventory_default_cost");
        var itemMargin = window._get_custom_field_value("ethl_inventory_default_margin");

        if (itemCost === null) {
            itemCost = "0.00";
        }
        if (itemMargin === null) {
            itemMargin = "0.00";
        }

        $("#ethl_inventory_default_cost").val(itemCost);
        $("#ethl_inventory_default_margin").val(itemMargin);
    }
});

/**
 *  Override the supplying items widget.
 */
$(document).ready(function() {
    if(typeof($.custom.items)!='undefined' && hh_api_version<=1) {
        $.widget('custom.items', $.custom.items, {
            _create: function() {
                this._super(arguments);
                var that = this;

                if (!this.item_edit_dlg) {
                    return;
                }

                this.ethl_inventory_cost_edit = $("<input>", {
                    "id": "ethl_inventory_cost",
                    "name": "ethl_inventory_cost",
                    "value": "0.00",
                    "style": "width: 90px;"
                }).on("change", function() {
                    $(this).val(that._format_currency($(this).val()));
                });

                this.ethl_inventory_margin_edit = $("<input>", {
                    "id": "ethl_inventory_margin",
                    "name": "ethl_inventory_margin",
                    "value": "0.00",
                    "style": "width: 87px;"
                }).on("change", function() {
                    $(this).val(that._format_currency($(this).val()));
                });

                this.ethl_cost_and_margins = $("<tr>")
                    .append($("<td>", { "colspan": "1" }))
                    .append($("<td>", { "align": "right" })
                        .append($("<span>", { "class": "lang label", "html": "Cost : " }))
                    )
                    .append($("<td>")
                        .append($("<span>", { "class": "currency_prefix label", "html": "£" }))
                        .append(this.ethl_inventory_cost_edit)
                    )
                    .append($("<td>", { "align": "right" })
                        .append($("<span>", { "class": "lang label", "html": "Margin : " }))
                    )
                    .append($("<td>")
                        .append($("<span>", { "class": "label", "html": "%" }))
                        .append(this.ethl_inventory_margin_edit)
                    );

                this.ethl_cost_and_margins.insertAfter(this.item_edit_dlg.find($("tr.hh_pricing")));
                this._init_listeners();

                this.ethl_items_total_cost = $("<span>",{
                    style:"font-weight:bold",
                    html: "-"
                });
                this.ethl_items_total_margin = $("<span>",{
                    style:"font-weight:bold",
                    html: "-"
                });

                $("<tr>")
                    .append($("<td>", { "html": "Total Cost : " })
                        .append(this.ethl_items_total_cost)
                    )
                    .append($("<td>", { "html": "Total Margin : " })
                        .append(this.ethl_items_total_margin)
                    )
                    .insertAfter(this.items_total_value_txt.parents("tr"));

                // Increase the height of the container to accomodate the new <tr> element.
                $("#items_tab").height($("#items_tab").height() + 25);

                // Set the total cost and margin values in the footer.
                this._set_total_cost_and_margin();
            },

            _init_listeners: function() {
                var itemPrice = this.unit_price;
                var itemCost = this.ethl_inventory_cost_edit;
                var itemMargin = this.ethl_inventory_margin_edit;

                itemPrice.on("input", function() {
                    var priceValue = parseFloat(itemPrice.val(), 10);
                    var costValue = parseFloat(itemCost.val(), 10);

                    if (!priceValue) {
                        priceValue = parseFloat(0, 10).toFixed(2)
                    }
                    if (!costValue) {
                        costValue = parseFloat(0, 10).toFixed(2)
                    }

                    if (costValue != 0) {
                        itemMargin.val(parseFloat(((priceValue / costValue) * 100) - 100, 10).toFixed(2));
                    } else {
                        itemMargin.val(parseInt(0).toFixed(2));
                    }


                });

                itemCost.on("input", function() {
                    var priceValue = parseFloat(itemPrice.val(), 10);
                    var costValue = parseFloat(itemCost.val(), 10);

                    if (!priceValue) {
                        priceValue = parseFloat(0, 10).toFixed(2)
                    }
                    if (!costValue) {
                        costValue = parseFloat(0, 10).toFixed(2)
                    }

                    if (priceValue != 0) {
                        itemMargin.val(parseFloat(((priceValue / costValue) * 100) - 100, 10).toFixed(2));
                    } else {
                        itemMargin.val(parseInt(0).toFixed(2));
                    }
                });

                itemMargin.on("input", function() {
                    var marginValue = parseFloat(itemMargin.val());
                    var costValue = parseFloat(itemCost.val());

                    if (!marginValue) {
                        itemMargin.val(parseInt(0, 10).toFixed(2));
                    }

                    if (!costValue) {
                        itemCost.val(parseInt(0, 10).toFixed(2));
                    }

                    var price = costValue * (1 + (marginValue / 100));
                    itemPrice.val(parseFloat(price, 10).toFixed(2));
                    itemPrice.trigger("change");
                });
            },

            tree_loaded: function() {
                this._set_total_cost_and_margin();
            },

            _set_total_cost_and_margin: function() {
                var that = this;
                var totalCost = 0;
                var lineItemTotal = 0;

                $(".column_COST > div").each(function(index, element) {
                    var value = $(element).html();
                    var quantity = $(element).parents("tr").find(".qty_cell").html();

                    if (value !== "N/A") {
                        totalCost += parseFloat(value * quantity);

                        var $totalElement = $(element).parent().siblings('.total_cell').find('div');
                        var totalValue = $totalElement.html();

                        if (totalValue !== "N/A") {
                            totalValue = totalValue.replace('£', '');
                            totalValue = totalValue.replace(',', '');
                            lineItemTotal += parseFloat(totalValue);
                        }
                    }
                });

                var marginPercentange = ((lineItemTotal - totalCost) / lineItemTotal) * 100;

                if (this.ethl_items_total_cost) {
                    this.ethl_items_total_cost.html('£' + this._format_currency(totalCost));
                }

                if (this.ethl_items_total_margin) {
                    this.ethl_items_total_margin.html('' + marginPercentange.toFixed(2) + "%");
                }
            },

            // Allows us to hook an action after an item is updated, deleted or created.
            update_headings_totals: function() {
                this._super();
                this._set_total_cost_and_margin();
            },

            add_cells_post: function(data)
            {
                var html = "";
                var values = this._get_cost_and_margin_for_row(data);
                var defaultValues = this._get_default_cost_and_margin_for_row(data);

                // Colour the value red if it is different from the default value. We skip any values
                // that are not applicable or values of one-off/custom items.
                if (values.cost === defaultValues.cost || values.cost == "N/A" || data.kind == 3) {
                    html += '<td style="width:80px" class="item_cell ethl_default_cost"><div style="width:80px; text-align: right;">' + values.cost + '</div></td>';
                } else {
                    html += '<td style="width:80px" class="item_cell ethl_default_cost"><div style="width:80px; text-align: right; color: red;">' + values.cost + '</div></td>';
                }

                // Colour the value red if it is different from the default value. We skip any values
                // that are not applicable or values of one-off/custom items.
                if (values.margin === defaultValues.margin || values.margin == "N/A" || data.kind == 3) {
                    html += '<td style="width:80px" class="item_cell ethl_default_margin"><div style="width:80px; text-align: right;">' + values.margin + '</div></td>';
                } else {
                    html += '<td style="width:80px" class="item_cell ethl_default_margin"><div style="width:80px; text-align: right; color: red;">' + values.margin + '</div></td>';
                }

                return html;
            },

            edit_item: function() {
                this._super(arguments);

                var nodes = this.items_to_supply_tree.jstree("get_selected", true);
                var values = this._get_cost_and_margin_for_row(nodes[0].data);

                var cost = this._format_currency(values.cost);
                var margin = this._format_currency(values.margin);

                if (cost == "N/A" || (cost != 0 && !cost) || cost == "NaN") {
                    cost = this._format_currency(0);
                }
                if (margin == "N/A" || (margin != 0 && !margin) || margin == "NaN") {
                    margin = this._format_currency(0);
                }

                this.ethl_inventory_cost_edit.val(cost);
                this.ethl_inventory_margin_edit.val(margin);
            },

            save_item: function() {
                var fields = this.item_edit_dlg.data("custom_fields");

                if (fields === null) {
                    fields = {}
                }

                // Create new field object.
                var new_fields = {};
                new_fields["ethl_inventory_cost"] = {
                    'type': 'text',
                    'value': this.ethl_inventory_cost_edit.val()
                };
                new_fields["ethl_inventory_margin"] = {
                    'type': 'text',
                    'value': this.ethl_inventory_margin_edit.val()
                };

                // Merge with existing fields.
                $.extend(fields, new_fields);

                // Set newly merged fields.
                this.item_edit_dlg.data('custom_fields', fields);

                this._super(arguments);

                this._set_total_cost_and_margin();
            },

            // create_list_header: function(arguments) {
            //     var supplying_list_heads = this._super(arguments)
            //     var tr = supplying_list_heads.find('tr')
            //
            //     $("<th>", { class:"cost_cell", style:"width:80px;border-left:1px solid #AAA"}).appendTo(tr)
            //         .append($("<div>",{html: "Cost (£)", style:"width:80px;overflow:hidden;"})); // Fixes Chrome zoom bug
            //     // Margin
            //     $("<th>", { class:"cost_cell", style:"width:80px;border-left:1px solid #AAA"}).appendTo(tr)
            //         .append($("<div>",{html: "Margin (%)", style:"width:80px;overflow:hidden;"})); // Fixes Chrome zoom bug
            //     // Return the table (alter this if customising)
            //
            //     return supplying_list_heads;
            // },

            /**
             * Override the whole function from the parent widget.
             */
            // create_list_headings: function() {
            //     // Heading table
            //     var table = $("<table>", {
            //         cellpadding:0,
            //         cellspacing:0,
            //         style:"width:100%;padding-right:8px"
            //     });
            //     var tr = $("<tr>", { style:"height:24px" }).appendTo(table);
            //     // QTY + Item
            //     $("<th>", { class:"name_cell", html:lang.qtyItemTxt}).appendTo(tr);
            //     // Available
            //     $("<th>", { class:"avail_cell", style:"width:90px;border-left:1px solid #AAA"}).appendTo(tr)
            //         .append($("<div>",{html:lang.availableTxt, style:"width:90px;overflow:hidden;"})); // Fixes Chrome zoom bug
            //     // Priority remainder
            //     $("<th>", { class:"priority_column", style:"width:80px;border-left:1px solid #AAA"}).appendTo(tr)
            //         .append($("<div>",{html:lang.priorityRemainderTxt, style:"width:80px;overflow:hidden;"})); // Fixes Chrome zoom bug
            //     // Subs
            //     if (doc_type==1 && !this.options.read_only)
            //         $("<th>", { class:"extra_col_1 subs_cell", style:"width:80px;border-left:1px solid #AAA"}).appendTo(tr)
            //             .append($("<div>",{html:lang.subsTxt, style:"width:80px;overflow:hidden;"})); // Fixes Chrome zoom bug
            //     // Weight
            //     $("<th>", { class:"extra_col_2 weight_cell", style:"width:80px;border-left:1px solid #AAA"}).appendTo(tr)
            //         .append($("<div>",{html:lang.weightTxt, style:"width:80px;overflow:hidden;"})); // Fixes Chrome zoom bug
            //     //$("<th>", { html:lang.flagTxt, class:"extra_col_4", style:"width:130px;border-left:1px solid #AAA"}).appendTo(tr);
            //     // Price duration
            //     $("<th>", { html:lang.priceDurationTxt, class:"extra_col_3 type_cell", style:"width:140px;border-left:1px solid #AAA"}).appendTo(tr); // Price type
            //     // Unit price
            //     $("<th>", { class:"unit_cell", style:"width:80px;border-left:1px solid #AAA"}).appendTo(tr)
            //         .append($("<div>",{html:lang.unitPriceTxt, style:"width:80px;overflow:hidden;"})); // Fixes Chrome zoom bug
            //     // Discount
            //     $("<th>", { class:"disc_cell", style:"width:64px;border-left:1px solid #AAA"}).appendTo(tr)
            //         .append($("<div>",{html:lang.discountTxt, style:"width:64px;overflow:hidden;"})); // Fixes Chrome zoom bug
            //     // Price
            //     $("<th>", { class:"total_cell", style:"width:80px;border-left:1px solid #AAA"}).appendTo(tr)
            //         .append($("<div>",{html:lang.totalTxt, style:"width:80px;overflow:hidden;"})); // Fixes Chrome zoom bug
            //     // Cost

            //     return table;
            // },

            /**
             * Override the whole function so we can callback when suitable.
             *
             * @param cb
             */
            get_items_list: function(cb)
            {
                var that = this;
                var data_passed = [];
                // Set the total to 0
                $.each(this.items_totals, function(i){ that.items_totals[i]=0 });
                // Load the data
                if (this.options.tree_list && intval(this.options.main_id)!=0)
                {
                    this.refresh_in_progress = true;
                    setTimeout(function(){
                        $.ajax({
                            url: that.options.tree_list,
                            // For readonly add company id incase of caching from another company using same computer
                            data: {
                                "id":that.options.main_id, // Job, package or archive ID
                                "job":((that.options.doc_type==1 || that.options.doc_type==13) && that.options.job_data?that.options.job_data["ID"]:0), // Is this a job
                                "fix":(that.run_tree_fix?1:0), // Fix the tree structure
                                "c":(that.options.read_only?user.COMPANY_ID:null), // ???
                                "grp":(that.options.doc_type==7 ? that.options.job_data.PRICE_GROUP : null), // For packages, which price group to show
                                "local":moment().format('YYYY-MM-DD HH:mm:ss'), // Local date and time
                                "no_availability": that.no_availability ? 1 : 0 // Do not show availability
                            },
                            dataType: 'json',
                            type: that.options.read_only?"get":"post",  // if read only, use get so it uses browser cache
                            success: function(data)
                            {
                                // Create an array of any default costs and margins that have been set.
                                that._get_default_costs_and_margins(data, function() {
                                    if (typeof(data["error"]) != "undefined")
                                    {
                                        error_message(isNaN(parseInt(data["error"])) ? data["error"] : lang.error[data["error"]]);
                                        cb.call(that.items_to_supply_tree, []);
                                    }
                                    else
                                    {
                                        // Save the price structures
                                        if(typeof(data['price_structures'])=="object")
                                            $.extend(that.price_structures, data['price_structures']);
                                        if (!that.options.read_only)
                                        {
                                            // Set the flags
                                            var now = new Date();
                                            that.last_refresh = now.getTime();
                                            that.options.job_data.ITMS_REFRESH = that.last_refresh;
                                        }
                                        // Get the nodes formatted for jsTree
                                        data_passed = that.buildNodes(data['items']);
                                        // Change the total
                                        that.item_list_change_total();
                                        // Make sure menus & buttons enabled/disabled
                                        that.fill_details();
                                        // Reset the fix flag
                                        that.run_tree_fix = false;
                                        // Trigger a total change
                                        that.job_save_total();
                                        // return the data
                                        cb.call(that.items_to_supply_tree, data_passed);
                                        // Make sure headings are correct
                                        that.show_hide_columns();

                                        that._set_total_cost_and_margin();
                                    }
                                    that.refresh_in_progress = false;
                                });
                            },
                            error: function(jqXHR, textStatus, errorThrown)
                            {
                                cb.call(that.items_to_supply_tree, []);
                                error_message(lang.error[1]+" ("+errorThrown+").");
                                that.refresh_in_progress = false;
                            }
                        });
                    }, 1);
                }
                else
                    cb.call(this.items_to_supply_tree, []);
            },

            _format_currency: function(value) {
                return parseFloat(value, 10).toFixed(2);
            },

            _get_default_cost_and_margin_for_row: function(data) {
                var defaultCost = null;
                var defaultMargin = null;
                var itemId = data.LIST_ID;

                if (this._is_valid_supply_item(data)) {
                    if (data.kind == 2 && itemId in this.ethl_default_costs_and_margins.inventory) { // Is this a stock inventory item?
                        var cost = this.ethl_default_costs_and_margins.inventory[itemId].cost;
                        var margin = this.ethl_default_costs_and_margins.inventory[itemId].margin;

                        if (!cost || cost == "NaN") {
                            cost = 0;
                        }
                        if (!margin || margin == "NaN") {
                            margin = 0;
                        }

                        defaultCost = this._format_currency(cost);
                        defaultMargin = this._format_currency(margin);
                    }

                    if (data.kind == 4 && itemId in this.ethl_default_costs_and_margins.labour) { // Is this a stock inventory item?
                        var cost = this.ethl_default_costs_and_margins.labour[itemId].cost;
                        var margin = this.ethl_default_costs_and_margins.labour[itemId].margin;

                        if (!cost) {
                            cost = 0;
                        }
                        if (!margin) {
                            margin = 0;
                        }

                        defaultCost = this._format_currency(cost);
                        defaultMargin = this._format_currency(margin);
                    }
                }

                return {
                    cost: defaultCost,
                    margin: defaultMargin
                }
            },

            _is_valid_supply_item: function(data) {
                return data.kind == 2 || data.kind == 3 || data.kind == 4;
            },

            _get_cost_and_margin_for_row: function(data) {
                var defaultCost;
                var defaultMargin;
                var itemId = data.LIST_ID;
                var fields = data.CUSTOM_FIELDS;

                if (this._is_valid_supply_item(data)) { // Is this a stock inventory item?
                    if (fields !== null) {
                        defaultCost = fields["ethl_inventory_cost"].value;
                        defaultMargin = fields["ethl_inventory_margin"].value;
                    }

                    if (data.kind == 2 && itemId in this.ethl_default_costs_and_margins.inventory) { // Check if it is an inventory supply item.
                        if (defaultCost === undefined) {
                            defaultCost = this._format_currency(this.ethl_default_costs_and_margins.inventory[itemId].cost)
                        }
                        if (defaultMargin === undefined) {
                            defaultMargin = this._format_currency(this.ethl_default_costs_and_margins.inventory[itemId].margin)
                        }
                    } else if (data.kind == 4 && itemId in this.ethl_default_costs_and_margins.labour) {
                        if (defaultCost === undefined) {
                            defaultCost = this._format_currency(this.ethl_default_costs_and_margins.labour[itemId].cost)
                        }
                        if (defaultMargin === undefined) {
                            defaultMargin = this._format_currency(this.ethl_default_costs_and_margins.labour[itemId].margin)
                        }
                    }
                }

                if ((defaultCost !== 0 && !defaultCost) || defaultCost == "NaN") {
                    defaultCost = "N/A";
                }
                if ((defaultMargin !== 0 && !defaultMargin) || defaultMargin == "NaN") {
                    defaultMargin = "N/A";
                }

                return {
                    cost: defaultCost,
                    margin: defaultMargin
                }
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

                    callback();
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


            }
        });
    }
});