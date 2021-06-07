$(document).ready(function() {
    if (typeof ($.custom.items) != 'undefined' && hh_api_version <= 1) {
        $.widget('custom.items', $.custom.items, {
            _create: function() {
                this._super();
                var that = this;

                $("<li>", {
                    "class": "ui-menu-item",
                    html:'<span class="ui-icon ui-icon-disk"></span>Export to CSV'
                })
                    .click(function() {
                        that._export_supply_items_to_csv();
                    })
                    .insertAfter(this.archive)
            },

            _export_supply_items_to_csv: function() {
                var csv = [];
                var that = this;
                var rows = this.items_to_supply_tree.jstree(true)._model.data;

                csv.push("\uFEFF");

                // Add header row.
                csv.push([
                    "title",
                    "quantity",
                    "available",
                    "subs",
                    "weight (kg)",
                    "unit price (gbp)",
                    "discount (%)",
                    "total (gbp)"
                ]);

                $.each(rows, function(index, row) {
                    var rowData = row.data;

                    if (rowData !== undefined) {
                        // Check if it is a non-billable item and the price is not 0.
                        if (that._is_valid_line_item(rowData)) {
                            var quantity = parseFloat(rowData.qty);
                            var unitPrice = parseFloat(rowData.UNIT_PRICE);
                            var totalPrice = parseFloat(rowData.PRICE);
                            var discountPercentage = (((unitPrice * quantity) - totalPrice) / (unitPrice * quantity)) * 100;

                            csv.push([
                                rowData.title,
                                rowData.qty,
                                rowData.avail,
                                rowData.sub_qty,
                                rowData.weight,
                                "£" + unitPrice.toFixed(2), // unit price
                                discountPercentage + "%", // discount percentage
                                "£" + totalPrice.toFixed(2) // total price
                            ])
                        }
                    }
                });

                this._convert_array_to_download(csv.join("\n"),'supply-items-' + (new Date()).toISOString() + '.csv');
            },

            _is_valid_line_item: function(data) {
                return data.kind !== undefined && (data.kind == 2 || data.kind == 3 || data.kind == 4);
            },

            _convert_array_to_download: function(csv, filename) {
            let csvFile;
            let downloadLink;

            // CSV file
            csvFile = new Blob([csv], {type: "text/csv;charset=utf-8"});

            // Download link
            downloadLink = document.createElement("a");

            // File name
            downloadLink.download = filename;

            // Create a link to the file
            downloadLink.href = window.URL.createObjectURL(csvFile);

            // Hide download link
            downloadLink.style.display = "none";

            // Add the link to DOM
            document.body.appendChild(downloadLink);

            // Click download link
            downloadLink.click();

            document.body.removeChild(downloadLink);
        }
        });
    }
});