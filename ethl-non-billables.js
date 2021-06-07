$(document).ready(function() {
    if (typeof ($.custom.items) != 'undefined' && hh_api_version <= 1) {
        $.widget('custom.items', $.custom.items, {
            _create: function () {
                var that = this;
                this._super(arguments);

                if (!this.item_edit_flag) {
                    return;
                }

                // Change default flag "none" to "Non Billable"
                this.item_edit_flag.find("option:first-of-type").html("Non Billable");
                this.item_edit_flag.find("option:nth-child(2)").html("Billable");
                this.item_edit_flag.data('pre_value', this.item_edit_flag.val());
                this.item_edit_flag.on("change", function() {
                    if ($(this).data("pre_value") == 0) { // If we have been changed from non-billable.
                        that.item_edit_dlg.find(".ui_disc_edit").val(0).trigger("change");;
                    }

                    that._toggle_edit_dialog_inputs();
                    $(this).data('pre_value', $(this).val());
                });
            },

            // Allows us to hook an action after an item is updated, deleted or created.
            update_headings_totals: function() {
                this._super();
                this._set_non_billable_discount();
            },

            create_item_title: function(data) {
                // If this isn't a non-billable item just return as normal.
                if (!this._is_valid_supply_item(data) || data.FLAG != 0) {
                    return this._super(data);
                }

                var html = this._super(data);

                var dom = $("<div>").html(html);
                dom.find("table").css('color', '#AAA !important');
                dom.find(".disc_cell > div").html("N/A");
                dom.find(".total_cell > div").html("N/A");
                dom.find(".ethl_default_cost > div").html("N/A");
                dom.find(".ethl_default_margin > div").html("N/A");

                return dom.html();
            },

            new_item: function(kind) {
                this._super(kind);
                var STATUS_LEAD = 0, STATUS_PROVISIONAL = 1;

                if (job_data.STATUS == STATUS_LEAD || job_data.STATUS == STATUS_PROVISIONAL) {
                    this.item_edit_dlg.find("option[value='1']:contains('Billable')").prop("selected", true);
                }
            },

            edit_item: function() {
                this._super();
                this._toggle_edit_dialog_inputs();
            },

            _toggle_edit_dialog_inputs: function(flag_index) {
                if (this.item_edit_flag.val() == 0) { // This is a non-billable item.
                    this.item_edit_dlg.find("th:contains('Discount')").css("opacity", 0);
                    this.item_edit_dlg.find("th:contains('Total')").css("opacity", 0);
                    this.item_edit_dlg.find(".ui_disc_edit").prop("disabled", true).parent("td").css("opacity", 0);
                    this.item_edit_dlg.find(".ui_total_edit").prop("disabled", true).parent("td").css("opacity", 0);
                    this.item_edit_dlg.find("#ethl_inventory_cost").prop("disabled", true).parents("tr").css("opacity", 0);
                    this.item_edit_dlg.find("#ethl_inventory_margin").prop("disabled", true).parents("tr").css("opacity", 0);
                } else {
                    this.item_edit_dlg.find("th:contains('Discount')").css("opacity", 1);
                    this.item_edit_dlg.find("th:contains('Total')").css("opacity", 1);
                    this.item_edit_dlg.find(".ui_disc_edit").prop("disabled", false).parent("td").css("opacity", 1);
                    this.item_edit_dlg.find(".ui_total_edit").prop("disabled", false).parent("td").css("opacity", 1);
                    this.item_edit_dlg.find("#ethl_inventory_cost").prop("disabled", false).parents("tr").css("opacity", 1);
                    this.item_edit_dlg.find("#ethl_inventory_margin").prop("disabled", false).parents("tr").css("opacity", 1);
                }
            },

            // As items with a value of 0 are not billed on invoices by default, we set the discount value to 100%.
            _set_non_billable_discount: function() {
                var that = this;
                var rows = this.items_to_supply_tree.jstree(true)._model.data;

                $.each(rows, function(index, row) {
                    var rowData = row.data;

                    if (rowData !== undefined) {
                        // Check if it is a non-billable item and the price is not 0.
                        if (rowData.FLAG !== undefined && rowData.PRICE !== undefined && rowData.FLAG == 0 && rowData.PRICE != 0) {
                            that._set_price_to_zero(rowData);
                        }
                    }
                });
            },

            _set_price_to_zero: function(data) {
                if (!this._is_valid_supply_item(data)) {
                    return;
                }

                $.ajax({
                    url: "/php_functions/items_save.php",
                    data: {
                        id: data.ID,
                        kind: data.kind,
                        price: 0,
                        job: job_id
                    },
                    dataType: "json",
                    type: "POST",
                    error: function (jqXHR, textStatus, errorThrown) {
                        error_message(lang.error[1] + " (" + errorThrown + ").");
                    }
                });
            },

            _is_valid_supply_item: function(data) {
                return data.kind == 2 || data.kind == 3 || data.kind == 4;
            },
        });
    }
});