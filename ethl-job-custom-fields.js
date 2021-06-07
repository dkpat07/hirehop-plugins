/**
 * job_edit widget
 */
 $(document).ready(function(){

    if(typeof($.custom.job_edit)!='undefined' && hh_api_version<=1) {
        $.widget('custom.job_edit', $.custom.job_edit, {
            _init_main: function () {
                // Call the old _init_main
                this._super(arguments);

                /**
                 * Etherlive email invoice to field.
                 *
                 * @type {JQuery<HTMLElement> | jQuery | HTMLElement}
                 */
                var ethl_email_invoice_to = $('<tr>')
                    .append($('<td>', { html: 'Email Invoice To:' }))
                    .append($('<td>')
                        .append($('<input>', {
                                'id':           'ethl_email_invoice_to',
                                'style':        'width: 275px;',
                                'type':         'email',
                                'placeholder':  'Enter an e-mail address'
                            })
                        )
                    );

                /**
                 * Etherlive invoice type field.
                 *
                 * @type {JQuery<HTMLElement> | jQuery | HTMLElement}
                 */
                var ethl_invoice_type = $('<tr>')
                    .append($('<td>', { html: 'Invoice Type:' }))
                    .append($('<td>')
                        .append($('<select>', {
                                'id':           'ethl_invoice_type',
                                'style':        'width: 275px;',
                            })
                            .append($("<option>", {
                                'html': 'Itemised with prices',
                                'value': 'itemised_with_prices'
                            }))
                            .append($("<option>", {
                                'html': 'Description only',
                                'value': 'description_only'
                            }))
                        )
                    );

                /**
                 * Deposit Fields
                 */
                this.ethl_deposit_percentage = $('<input>', {
                    'id':           'ethl_deposit_percentage',
                    'style':        'width: 135px;',
                    'type':         'number',
                    "placeholder":  "Enter percentage"
                });
                this.ethl_deposit_date = $('<input>', {
                    'id':           'ethl_deposit_date',
                    'style':        'width: 135px;',
                    'type':         'date',
                });
                var ethl_deposit_fields = $("<tr>")
                    .append($("<td>", { html: "Deposit %:" }))
                    .append($("<td>")
                        .append(this.ethl_deposit_percentage)
                        .append(this.ethl_deposit_date)
                    );

                /**
                 * Second Claim Fields
                 */
                this.ethl_second_claim_percentage = $('<input>', {
                    'id':           'ethl_second_claim_percentage',
                    'style':        'width: 135px;',
                    'type':         'number',
                    "placeholder":  "Enter percentage"
                });
                this.ethl_second_claim_date = $('<input>', {
                    'id':           'ethl_second_claim_date',
                    'style':        'width: 135px;',
                    'type':         'date',
                });
                var ethl_second_claim_fields = $("<tr>")
                    .append($("<td>", { html: "Claim % (Before Event):" }))
                    .append($("<td>")
                        .append(this.ethl_second_claim_percentage)
                        .append(this.ethl_second_claim_date)
                    );

                /**
                 * Final Claim Fields
                 */
                this.ethl_final_claim_percentage = $('<input>', {
                    'id':           'ethl_final_claim_percentage',
                    'style':        'width: 135px;',
                    'type':         'number',
                    "placeholder":  "Enter percentage"
                });
                this.ethl_final_claim_date = $('<input>', {
                    'id':           'ethl_final_claim_date',
                    'style':        'width: 135px;',
                    'type':         'date',
                });
                var ethl_final_claim_fields = $("<tr>")
                    .append($("<td>", { html: "Final Claim %:" }))
                    .append($("<td>")
                        .append(this.ethl_final_claim_percentage)
                        .append(this.ethl_final_claim_date)
                    );

                // Appending elements to this allows us to append to the left side panel of the
                // job_edit widget. We take the first element so we don't append to any <tr>
                // that are higher in the hierarchy.
                var bottomLeftSideElement = this.email.parents("tr")[0];

                // Append our elements backwards so they display in the correct order.
                this.ethl_final_claim_fields = ethl_final_claim_fields.insertAfter(bottomLeftSideElement);
                this.ethl_second_claim_fields = ethl_second_claim_fields.insertAfter(bottomLeftSideElement);
                this.ethl_deposit_fields = ethl_deposit_fields.insertAfter(bottomLeftSideElement);
                this.ethl_invoice_type = ethl_invoice_type.insertAfter(bottomLeftSideElement);
                this.ethl_email_invoice_to = ethl_email_invoice_to.insertAfter(bottomLeftSideElement);
            },

            save_job_form: function() {
                // Retrieve fields.
                var custom_fields           = this.fields.data('fields');

                // Create new field object.
                var new_fields = {};
                new_fields["ethl_email_invoice_to"] = {
                    "type": "text",
                    "value": this.ethl_email_invoice_to.find("#ethl_email_invoice_to").val()
                };
                new_fields["ethl_invoice_type"] = {
                    "type": "text",
                    "value": this.ethl_invoice_type.find("option:selected").val()
                };
                new_fields["ethl_deposit_percentage"] = {
                    "type": "text",
                    "value": this.ethl_deposit_percentage.val()
                };
                new_fields["ethl_deposit_date"] = {
                    "type": "text",
                    "value": this.ethl_deposit_date.val()
                };
                new_fields["ethl_second_claim_percentage"] = {
                    "type": "text",
                    "value": this.ethl_second_claim_percentage.val()
                };
                new_fields["ethl_second_claim_date"] = {
                    "type": "text",
                    "value": this.ethl_second_claim_date.val()
                };
                new_fields["ethl_final_claim_percentage"] = {
                    "type": "text",
                    "value": this.ethl_final_claim_percentage.val()
                };
                new_fields["ethl_final_claim_date"] = {
                    "type": "text",
                    "value": this.ethl_final_claim_date.val(),
                    "format": "ddddd"
                };

                // Merge with existing fields.
                $.extend(custom_fields, new_fields);

                // Set newly merged fields.
                this.fields.data('fields', custom_fields);

                // Call super.
                this._super(arguments);
            },

            fill_job_edit: function() {
                // Call the old fill_job_edit
                this._super(arguments);

                // Retrieve any custom fields that already exist.
                var custom_fields = this.fields.data('fields');

                // Set field values.
                if ("ethl_email_invoice_to" in custom_fields) {
                    this.ethl_email_invoice_to.find("#ethl_email_invoice_to").val(custom_fields["ethl_email_invoice_to"].value);
                }
                if ("ethl_invoice_type" in custom_fields) {
                    this.ethl_invoice_type.find("option[value='" + custom_fields["ethl_invoice_type"].value + "']").prop("selected", true);
                }
                if ("ethl_deposit_percentage" in custom_fields) {
                    this.ethl_deposit_percentage.val(custom_fields["ethl_deposit_percentage"].value);
                }
                if ("ethl_deposit_date" in custom_fields) {
                    this.ethl_deposit_date.val(custom_fields["ethl_deposit_date"].value);
                }
                if ("ethl_second_claim_percentage" in custom_fields) {
                    this.ethl_second_claim_percentage.val(custom_fields["ethl_second_claim_percentage"].value);
                }
                if ("ethl_second_claim_date" in custom_fields) {
                    this.ethl_second_claim_date.val(custom_fields["ethl_second_claim_date"].value);
                }
                if ("ethl_final_claim_percentage" in custom_fields) {
                    this.ethl_final_claim_percentage.val(custom_fields["ethl_final_claim_percentage"].value);
                }
                if ("ethl_final_claim_date" in custom_fields) {
                    this.ethl_final_claim_date.val(custom_fields["ethl_final_claim_date"].value);
                }
            }
        });
    }
});

/**
 * Hook fill_job_fields function.
 */
$(document).ready(function() {
    if (doc_type == 1 && hh_api_version<=1) {

        var ethl_final_claim_fields = $('<tr>', { 'id': 'ethl_final_claim_fields' })
            .append($('<td>', { 'style': 'width: 12ch;', html: 'Final Claim'}))
            .append($('<td>')
                .append($("<p>", { "class": "data_cell", "style": "display: inline-block; width: 40%; margin: 0; padding: 0;" })
                    .data('field', "ethl_final_claim_percentage")
                    .attr('data-field', "ethl_final_claim_percentage")
                )
                .append($("<p>", { "class": "data_cell", "style": "display: inline-block; width: 40%; margin: 0; padding: 0;" })
                    .data('field', "ethl_final_claim_date")
                    .attr('data-field', "ethl_final_claim_date")
                )
            );

        var ethl_second_claim_fields = $('<tr>', { 'id': 'ethl_second_claim_fields' })
            .append($('<td>', { 'style': 'width: 12ch;', html: 'Claim #2'}))
            .append($('<td>')
                .append($("<p>", { "class": "data_cell", "style": "display: inline-block; width: 40%; margin: 0; padding: 0;" })
                    .data('field', "ethl_second_claim_percentage")
                    .attr('data-field', "ethl_second_claim_percentage")
                )
                .append($("<p>", { "class": "data_cell", "style": "display: inline-block; width: 40%; margin: 0; padding: 0;" })
                    .data('field', "ethl_second_claim_date")
                    .attr('data-field', "ethl_second_claim_date")
                )
            );

        var ethl_deposit_fields = $('<tr>', { 'id': 'ethl_deposit_fields' })
            .append($('<td>', { 'style': 'width: 12ch;', html: 'Deposit'}))
            .append($('<td>')
                .append($("<p>", { "class": "data_cell", "style": "display: inline-block; width: 40%; margin: 0; padding: 0;" })
                    .data('field', "ethl_deposit_percentage")
                    .attr('data-field', "ethl_deposit_percentage")
                )
                .append($("<p>", { "class": "data_cell", "style": "display: inline-block; width: 40%; margin: 0; padding: 0;" })
                    .data('field', "ethl_deposit_date")
                    .attr('data-field', "ethl_deposit_date")
                )
            );

        var ethl_email_invoice_to = $('<tr>', { 'id': 'ethl_email_invoice_to' })
            .append($('<td>', { 'style': 'width: 12ch;', html: 'Invoice Email'}))
            .append($('<td>', { 'class': 'data_cell' })
                .data('field', "ethl_email_invoice_to")
                .attr('data-field', "ethl_email_invoice_to")
            );

        var ethl_invoice_type = $('<tr>', { 'id': 'ethl_invoice_type' })
            .append($('<td>', { 'style': 'width: 12ch;', html: 'Invoice Type'}))
            .append($('<td>', { 'class': 'data_cell' })
                .data('field', "ethl_invoice_type")
                .attr('data-field', "ethl_invoice_type")
            );

        var leftSideAppendElement = $("#job_email");
        var rightSideAppendElement = $("#job_type");

        // Append left side.
        ethl_invoice_type.insertAfter(leftSideAppendElement);
        ethl_email_invoice_to.insertAfter(leftSideAppendElement);

        // Append right side.
        ethl_final_claim_fields.insertAfter(rightSideAppendElement);
        ethl_second_claim_fields.insertAfter(rightSideAppendElement);
        ethl_deposit_fields.insertAfter(rightSideAppendElement);


        var fill_job_fields_original = fill_job_fields;

        fill_job_fields = function() {
            // Call the original function.
            fill_job_fields_original();

            var fields = job_data.fields;

            $("#details_tab .data_cell, .job_header .data_cell").each(function() {
                var field_name = $(this).data('field');

                if (!(field_name in fields)) {
                    return true; // Skip this iteration.
                }

                switch (field_name) {
                    case "ethl_final_claim_percentage":
                        $(this).text(fields["ethl_final_claim_percentage"].value + "%");
                        break;
                    case "ethl_final_claim_date":
                        $(this).text(ethl_convert_date(fields["ethl_final_claim_date"].value));
                        break;
                    case "ethl_second_claim_percentage":
                        $(this).text(fields["ethl_second_claim_percentage"].value + "%");
                        break;
                    case "ethl_second_claim_date":
                        $(this).text(ethl_convert_date(fields["ethl_second_claim_date"].value));
                        break;
                    case "ethl_deposit_percentage":
                        $(this).text(fields["ethl_deposit_percentage"].value + "%");
                        break;
                    case "ethl_deposit_date":
                        $(this).text(ethl_convert_date(fields["ethl_deposit_date"].value));
                        break;
                    case "ethl_email_invoice_to":
                        $(this).html(fields["ethl_email_invoice_to"].value);
                        break;
                    case "ethl_invoice_type":
                        $(this).html(ethl_convert_value_to_string(fields["ethl_invoice_type"].value));
                        break;
                }
            });
        };
    }
});