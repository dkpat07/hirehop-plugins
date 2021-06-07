/**
 * X) 
 */

$(document).ready(function() {
    // Check the widget exists and we are on the right API version.
    if (typeof($.custom.accounts) != 'undefined' && hh_api_version <= 1) {

        // Override the custom.accounts widget so we can hook into the functions.
        $.widget('custom.accounts', $.custom.accounts, {

            _init_main: function()
            {
                var fields = job_data["fields"];
                var customFields = fields["ethl_partial_invoices"];

                // Initialise the ethl_partial_invoices variable.
                if (customFields && customFields.value !== undefined) {
                    this.ethl_partial_invoices = customFields.value;
                } else {
                    this.ethl_partial_invoices = [];
                }

                var that = this;

                // BUTTONS
                this.main_button_bar = $("<div>", { style:"padding-bottom:4px; text-align:center" }).appendTo(this.element);
                // Add the buttons
                this._add_main_buttons();

                // Grid container (top half of page)
                this.top = $("<div>", { style:"padding-bottom:4px; width:100%;"}).appendTo(this.element);

                // Main grid
                this.ledger = $( "<table>", {
                    class:"do_flex",
                    id: (function(){ return "ledger"+$(".ui-jqgrid").length; })
                })
                    .appendTo( this.top )
                    .jqGrid({
                        url: "/php_functions/billing_list.php",
                        postData: {
                            "main_id": that.options.main_id,
                            "type":doc_type,
                            "local":moment().format("YYYY-MM-DD HH:mm:ss"),
                            "tz":timezone,
                            fix:function(){ return that.fix_refresh ? 1 : 0;}
                        },
                        datatype:"json",
                        colModel:[
                            {name:'id',width:0,hidden:true,key:true},
                            {name:'kind',sortable:false,width:0,hidden:true}, // 0 = NET total (quoted or open ended), 1 = invoice, 2 = credit note, 3 = payment, 4 = late NET total
                            {name:'date',sortable:false,width:100,formatter:dateFormatter,label:lang.dateTxt},
                            {name:'number',sortable:false,width:68,label: lang.numberTxt},
                            {name:'desc',sortable:false,width:(doc_type==6?151:263),formatter:that._descriptionFormatter,label:lang.descriptionTxt},
                            {name:'accrued',sortable:false,width:90,align:"right",
                                formatter:function(c,o,r){return that._currencyFormatter(c,o,r);},
                                title:false,label:lang.netAccruedTxt},
                            {name:'debit',sortable:false,width:90,align:"right",
                                formatter:function(c,o,r){return that._currencyFormatter(c,o,r);},
                                title:false,label:lang.billedTxt},
                            {name:'credit',sortable:false,width:90,align:"right",
                                formatter:function(c,o,r){return that._currencyFormatter(c,o,r);},
                                title:false,label:lang.creditsTxt},
                            {name:'owing',sortable:false,width:90,align:"right",sorttype:"float",
                                formatter:function(c,o,r){return that._currencyFormatter(c,o,r);},
                                title:false,label:lang.owedTxt},
                            {name:'currency',width:60,sortable:false,hidden:typeof($.custom.multi_currency)=="undefined",align:"center",label:lang.currencyTxt},
                            {name:'status',sortable:false,width:(doc_type==6?80:100),label:lang.statusTxt,formatter:function(c,o,r){return r.kind==1 || r.kind==2 ? lang.bill_status[intval(c)] : "";}},
                            {name:'job',sortable:false,width:(doc_type==6?130:0),hidden:doc_type!=6?true:false,formatter:that._jobFormatter, label:lang.jobTxt},
                            {name:'data',width:0,hidden:true, formatter:function(c, o, r){ if (c && c.length!==0) that.ledger_data[o.rowId] = c; return ""; } }
                        ],
                        // idPrefix: "ledg", // NOT NEEDED as all rowid start with a,b,c or d
                        rowNum:99999,
                        loadonce: true,
                        deepempty:true,
                        height: 150,
                        scrollOffset: 19,
                        forceFit: true,
                        autowidth:true,
                        shrinkToFit:true,
                        gridview: true,  // false enables afterInsertRow
                        hidegrid: false, // Remove the hide button
                        hoverrows:false,
                        // Totals footer
                        footerrow: true,
                        // Treegrid
                        "treeGrid":true,
                        "ExpandColumn":"date",
                        "ExpandColClick":true,
                        "treeIcons": {"plus":'ui-icon-triangle-1-e',"minus":'ui-icon-triangle-1-s',"leaf":'ui-icon-blank'},
                        "treeGridModel":"adjacency",
                        "treeReader":{
                            "parent_id_field":"owner",
                            "level_field":"level",
                            "leaf_field":"isLeaf",
                            "loaded":"loaded"
                        },
                        // Events
                        afterExpandTreeGridRow : function(rowid) { $(this).jqGrid('setSelection', rowid, true ); },
                        afterCollapseTreeGridRow : function(rowid) { $(this).jqGrid('setSelection', rowid, true ); },
                        onSelectRow :  function(rowid, status, e) { if(rowid) that._fill_details(rowid); },
                        ondblClickRow: function(rowid) { that._edit(rowid);},
                        gridComplete: function() {
                            // Fill calculations
                            that._tally_data();
                            // Select first row if no row selected
                            var rowid = $(this).jqGrid('getGridParam','selrow');
                            // $(this).jqGrid("resetSelection"); // Not needed
                            if (!rowid)
                            {
                                if (intval(that.options.sel)>0)
                                {
                                    rowid = "a"+that.options.sel;
                                    that.options.sel=0;
                                }
                                else
                                    rowid = $(this).jqGrid("getDataIDs")[0];
                            }
                            // Select row to invoke fill details
                            if(rowid) $(this).jqGrid('setSelection', rowid, true ); // that._fill_details(rowid);
                        },
                        beforeProcessing : function(data)
                        {
                            // Error handling
                            if (data && typeof(data["error"]) !== "undefined")
                            {
                                error_message(isNaN(parseInt(data["error"])) ? data["error"] : lang.error[data["error"]]);
                                return false;
                            }
                            // Save subcontractor costs
                            that._subcontractor_costs = typeof(data.subs)!="undefiend" ? floatval(data.subs):0;
                            // Save the default banks, tax codes and nominals for the job/project
                            that.banks = data["banks"];
                            that.tax_codes = data["tax_codes"];
                            that.nominal_codes = data["nominal_codes"];
                            if(!that.options.currency) that.options.currency = data["currency"];
                            that.use_sales_tax = data["use_sales_tax"]==1;
                            that.default_sales_tax = floatval(data["default_sales_tax"]);
                            that.default_package_name = data["package_name"];
                            // Reset refresh flag
                            var now = new Date();
                            that.last_refresh = now.getTime();
                            if (typeof(job_data) !== "undefined")
                                job_data.BILL_REFRESH = that.last_refresh;
                            if (typeof(proj_data) !== "undefined")
                                proj_data.BILL_REFRESH = that.last_refresh;


                            for (var i = 0; i < that.ethl_partial_invoices.length; i++) {
                                var partialInvoice = that.ethl_partial_invoices[i];

                                var gridData = that._get_partial_invoice_grid_data(
                                    partialInvoice.id,
                                    partialInvoice.parentId,
                                    partialInvoice.description,
                                    partialInvoice.date,
                                    partialInvoice.percentage,
                                    partialInvoice.amount
                                );

                                data.rows.push(gridData);
                                data.records++;
                            }
                        },
                        loadError: function (xhr, textStatus, errorThrown) {
                            error_message(lang.error[1]+" ("+errorThrown+").");
                        }
                    })
                    .disableSelection();

                // ********************* BOTTOM SECTION *********************

                // Info div at bottom
                this.info = $("<div>", {
                    class:"ui-widget-content ui-corner-all",
                    style:"margin-right:-2px;" // Above jqGrid overflows slightly, this compensates
                }).appendTo(this.element);

                //  INFORMATION
                var table = $("<table>" , { style:"width:100%;" }).appendTo(this.info);

                // Net to invoice      Net to authorise    Gross owing
                var tr = $("<tr>")
                    .appendTo( table );
                var td = $("<td>")
                    .append( $("<span>", { html: lang.netToInvoiceTxt+" : ",  class:"label" }) )
                    .appendTo(tr);
                this.to_bill = $("<span>", {style:"text-decoration:underline;cursor:pointer;"}).appendTo( td )
                    .click(function(){
                        var bill_rowid = that.ledger.jqGrid('getGridParam','selrow');
                        // No bill selected or not an invoice
                        if (bill_rowid && that.ledger_data[bill_rowid].TYPE==1)
                        {
                            var net_to_invoice = floatval(this.textContent.replace(/[^\d.-]/g,''));
                            if(net_to_invoice>0)
                            {
                                that._edit_item(true,3);
                                that.edt_unit.val(as_money(net_to_invoice));
                                that.edt_price.val(as_money(net_to_invoice));
                            }
                        }
                    });
                // Net to authorise
                td = $("<td>")
                    .append( $("<span>", { html: lang.netToAuthTxt+" : ",  class:"label" }) )
                    .appendTo(tr);
                this.to_authorise = $("<span>").appendTo(td);
                // Subcontarctor costs
                td = $("<td>")
                    .append( $("<span>", { html: lang.netSubCosts+" : ",  class:"label" }) )
                    .appendTo(tr);
                this.sub_cost = $("<span>", {class:"subs"}).appendTo(td);
                // Profit
                td = $("<td>")
                    .append( $("<span>", { html: lang.netProfitTxt+" : ",  class:"label" }) )
                    .appendTo(tr);
                this.profit = $("<span>").appendTo(td);

                //SPACER
                $("<hr>").appendTo( this.info );

                // Now do grid and prices
                table = $('<table>', {style:"width:100%;table-layout:fixed"}).appendTo(  $("<div>", {style:"width:100%"}).appendTo(this.info) );
                tr = $("<tr>").appendTo( table );
                td = $("<td>", {style:"min-width:704px;width:80.5%;", class:"ui-widget-content ui-corner-all"}).appendTo(tr);

                this.supplying_head = $("<tr>", {class:"ui-jqgrid-labels"}).appendTo( $("<table>", {style:"width:100%;height:27px;border-collapse:collapse;border-spacing:0;font-size:0.9em;", class:"ui-jqgrid-htable ui-common-table"}).appendTo(td) );
                $("<th>", { html:lang.qtyItemTxt, class:"ui-th-column ui-th-ltr ui-state-default"}).appendTo(this.supplying_head);
                $("<th>", { html:lang.descriptionTxt, style:"min-width:253px;width:calc(25vw + 3px);", class:"ui-th-column ui-th-ltr ui-state-default"}).appendTo(this.supplying_head);
                $("<th>", { html:lang.nominalCodeTxt, style:"width:103px;", class:"ui-th-column ui-th-ltr ui-state-default extra_col_2"}).appendTo(this.supplying_head);
                $("<th>", { html:lang.taxRateTxt, style:"width:83px;", class:"ui-th-column ui-th-ltr ui-state-default extra_col_3"}).appendTo(this.supplying_head);
                $("<th>", { html:lang.unitPriceTxt, style:"width:83px;", class:"ui-th-column ui-th-ltr ui-state-default"}).appendTo(this.supplying_head);
                $("<th>", { html:lang.discountTxt, style:"width:67px;", class:"ui-th-column ui-th-ltr ui-state-default"}).appendTo(this.supplying_head);
                $("<th>", { html:lang.totalTxt, style:"width:101px;", class:"ui-th-column ui-th-ltr ui-state-default"}).appendTo(this.supplying_head);

                this.supplying_container = $("<div>", {style:"height:181px;overflow-y:auto;"})
                    .appendTo(td)
                    .on('contextmenu', function(event) { // Fire popup menu when right clicked
                        that._fill_details();
                        that.element.find(".ui-menu").hide();
                        that.new_menu.find(".context_only").show();
                        that.new_menu.show().position({ my: "left top", of: event });
                        $( document ).one( "click", function() { that.new_menu.hide(); });
                        return false;
                    });

                this.supplying = $("<div>", {
                    class:"items_tree", // Enables the table inside the node
                    id:"subs_tree",
                    // Give the impression the tree is loading in some browsers
                    html:'<img src="/js/jstree/themes/default/throbber.gif"> '+lang.pleaseWaitTxt
                })
                    .appendTo(this.supplying_container);

                // Draw later so that rest is already drawn (looks better)
                setTimeout(function ()
                {
                    that.supplying.jstree({
                        plugins : ( /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) ? ["state","types","conditionalselect"] : ["state","types","dnd","conditionalselect"],
                        core : {
                            check_callback:true,  // Enables create, rename, move & delete
                            themes:{stripes:true,icons:true,dots:true},
                            //multiple:true, // default true
                            data:function(node,cb){cb(that.get_items_list());},
                            animation:false,
                            strings : { 'Loading ...' : lang.pleaseWaitTxt}
                        },
                        dnd : {
                            copy:false,
                            is_draggable : function(node) {
                                return !that.options.read_only;
                            }
                            // use_html5:true
                        },
                        conditionalselect : function (node, e) {
                            if (!e || !e.ctrlKey) { return true; }
                            node = this.get_node(node);
                            if(this.is_selected(node)) { return true; }
                            var s = this.get_selected(true);
                            if(!s.length) { return true; }
                            return node.parent === s[0].parent;
                        },
                        state : { key : (that.options.read_only?"a":"b")+that.options.main_id+"_"+doc_type },
                        types : {
                            "#" : { // Root
                                "valid_children" : ["heading","custom","stock","consumable","service","comment"]
                            },
                            //"default" : {},  // No type assigned
                            "heading" : {
                                valid_children : ["heading","custom","stock","consumable","service","comment"]
                            },
                            "stock" : {
                                icon : "/images/stock.png",
                                max_depth : 2,
                                valid_children : ["custom","stock","consumable","service"]
                            },
                            "custom" : {
                                icon : "/images/custom.png",
                                valid_children : []
                            },
                            "consumable" : {
                                icon : "/images/consumable.png",
                                valid_children : []
                            },
                            "service" : {
                                icon : "/images/service.png",
                                valid_children : []
                            },
                            "comment" : {
                                icon : "/images/comment.png",
                                valid_children : []
                            }
                        }
                    })
                        //.delegate("a", "click", function (event, data) { event.preventDefault(); }) // Prevent link click
                        .on('move_node.jstree', function(event, data) { if (!that.options.read_only) that.move_item_node(data); })
                        .on("dblclick.jstree", function () { if (!that.options.read_only) that._edit_item(); })
                        .on("changed.jstree refresh.jstree loaded.jstree", function() {
                            that._fill_items();
                            that.supplying_head.find("th:last").width(that.supplying_container.width() - that.supplying_container[0].clientWidth + 101);
                        })
                        .on("contextmenu.jstree", "a", function(event) {
                            // deselect all nodes on right click if current node not selected
                            if (!$(this).jstree('is_selected', this))
                            {
                                $(this).jstree('deselect_all');
                                $(this).jstree('select_node', this);
                            }
                        })
                        .on("after_open.jstree after_close.jstree", function(){
                            that.supplying_head.find("th:last").width(that.supplying_container.width() - that.supplying_container[0].clientWidth + 101);
                        })
                        .disableSelection();
                },1);

                // Buttons
                this.item_btns = $('<td valign="top">', { style:"min-width:31px;width:3.5%;padding:0"}).appendTo(tr);
                // Add Btn
                this.add_entry_btn = $( "<button>", {
                    style: "width:30px;height:30px",
                    title: lang.newTxt
                })
                    .appendTo( this.item_btns )
                    .button({icons: {primary: "ui-icon-plusthick"}, label: "" })
                    .click(function() {
                        that.element.find(".ui-menu").hide(); // Hide all other menus
                        that.new_menu.find(".context_only").hide(); // Hide the context only items
                        that.new_menu.show().position({
                            my: "left",
                            at: "right",
                            of: this
                        });
                        $(document).one("click", function(){that.new_menu.hide();});
                        return false;
                    });

                // Add item popup menu
                this.new_menu = $("<ul>", {
                    style: "display:none;position:absolute;width:auto;z-index:1000;display:none"
                })
                    .appendTo( this.element );

                // BR
                this.item_btns.append('<br>');
                // Edit Btn
                this.edit_entry_btn = $( "<button>", {
                    style: "width:30px;height:30px",
                    title: lang.editTxt
                })
                    .appendTo( this.item_btns )
                    .button({icons: {primary: "ui-icon-pencil"}, label: "" }).click(function() {
                        that._edit_item();
                    });
                // BR
                this.item_btns.append('<br>');
                // Delete Btn
                this.delete_entry_btn = $( "<button>", {
                    style: "width:30px;height:30px",
                    title: lang.deleteTxt
                })
                    .appendTo( this.item_btns )
                    .button({icons: {primary: "ui-icon-minusthick"}, label: "" }).click(function() {
                        that._delete_assigned_item();
                    });

                td = $('<td valign="top" style="padding-top:4px;min-width:140px;width:16%">').appendTo(tr);

                var table3 = $('<table width="100%" cellspacing="0" cellpadding="0">').appendTo(td);
                tr = $('<tr>').appendTo( table3 );
                $("<td>", { html: lang.netTotalTxt+" :",  class:"label" }).appendTo(tr);
                this.items_net = $("<td>", {style:"text-align:right;width:92px"}).appendTo(tr); // Net
                tr = $('<tr>').appendTo( table3 );
                this.tax_label = $("<td>", { html: lang.vatTxt+" :",  class:"label" }).appendTo(tr);
                this.items_vat = $("<td>", {style:"text-align:right"}).appendTo(tr); // VAT
                tr = $('<tr>').appendTo( table3 );
                $("<td>", { html: lang.totalTxt+" :",  class:"label" }).appendTo(tr);
                this.items_total = $("<td>", {style:"text-align:right"}).appendTo(tr);
                tr = $('<tr>').appendTo( table3 );
                $("<td>", { html: lang.paidTxt+" :",  class:"label", style:"padding-top:8px" }).appendTo(tr);
                td = $("<td>", {style:"text-align:right;padding-top:8px"}).appendTo(tr);
                this.items_paid = $('<span>').appendTo(td);
                tr = $('<tr>').appendTo( table3 );
                $("<td>", { html: lang.owedTxt+" :",  class:"label", style:"padding-top:8px" }).appendTo(tr);
                td = $("<td>", {style:"text-align:right;padding-top:8px;"}).appendTo(tr);
                this.items_owed = $('<span>').appendTo(td);


                this._init_partial_invoice_edit();
            },

            _get_partial_invoice_grid_data: function(rowId, parentId, description, date, percentage, amount) {
                return {
                    "id": "ethl_" + rowId,
                    "kind": 1,
                    "date": date,
                    "debit": amount,
                    "currency": "USD",
                    "isLeaf": true,
                    "level": 1,
                    "owner": parentId,
                    "data": {
                        "ID": "ethl_" + rowId,
                        "TYPE": 1,
                        "OWNER": "23",
                        "DATE": "2020-08-09",
                        "DESCRIPTION": description,
                        "AMOUNT": amount,
                        "DEPOT_ID": 1,
                        "ACC_ACCOUNT_ID": 0,
                        "CORRECTION": 0,
                        "CURRENCY": {
                            "NAME": "US Dollars",
                            "MULTIPLIER": 1,
                            "SYMBOL_POSITION": 0,
                            "DECIMALS": 2,
                            "SYMBOL": "$",
                            "NEGATIVE_FORMAT": 1,
                            "CODE": "USD",
                            "DECIMAL_SEPARATOR": ".",
                            "THOUSAND_SEPARATOR": ","
                        }
                    },
                    "desc": "",
                    "expanded": false,
                    "loaded": false
                };
            },

            _add_partial_invoice: function(parentId, date, description, percentage, amount) {
                // Retrieve the highest ID currently set.
                var highestId = 0;
                for (var i = 0; i < this.ethl_partial_invoices.length; i++) {
                    if (this.ethl_partial_invoices[i].id > highestId) {
                        highestId = this.ethl_partial_invoices[i].id;
                    }
                }

                // Set the new ID to be 1 higher than the current highest, this prevent dupes.
                var newId = parseInt(highestId) + 1;

                var invoiceData = {
                    id: newId,
                    parentId: parentId,
                    date: date,
                    description: description,
                    percentage: percentage,
                    amount: amount
                }

                this.ethl_partial_invoices.push(invoiceData);
                this._save_custom_field_data();

                return newId;
            },

            _save_custom_field_data: function() {
                var fields = job_data["fields"];
                fields["ethl_partial_invoices"] = {
                    "type": "array",
                    "value": this.ethl_partial_invoices
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

            _edit: function(rowid)
            {
                var rowid = rowid ? rowid : this.ledger.jqGrid('getGridParam','selrow');

                if (rowid.includes("ethl_")) {
                    this._partial_invoice_edit(rowid);
                } else {
                    // Call normal edit routine.
                    this._super();
                }
            },

            _init_main_menu: function()
            {
                var that=this;

                // Menu items
                this.menu = $("<ul>", {
                    style: "display:none;width:auto;min-width:225px;position:absolute;z-index:1000;"
                })
                    .appendTo( this.element );
                // New Invoice
                $("<li>", {
                    html:'<span class="ui-icon ui-icon-plusthick"></span>'+lang.newInvoiceTxt,
                    class: "append_menu lockable"
                })
                    .click(function() { that._invoice_new(); })
                    .appendTo(this.menu);
                // Add Partial Invoice button to right click menu.
                $("<li>", {
                    "class": "ui-menu-item ethl_invoice_only",
                    html:'<span class="ui-icon ui-icon-plusthick"></span>New Partial Invoice',
                    disabled: true
                })
                    .click(function() {
                        that._partial_invoice_new();
                    })
                    .appendTo(this.menu)
                // New credit note
                $("<li>", {
                    html:'<span class="ui-icon ui-icon-plusthick"></span>'+lang.newCreditNoteTxt,
                    class: "append_menu lockable need_inv"
                })
                    .click(function() {
                        var rowid = that.ledger.jqGrid ('getGridParam', 'selrow');
                        if(rowid)
                        {
                            // If editing, get the parent or if new and invoice selected
                            if(that.ledger_data[rowid]["TYPE"]!=1)
                                var parent = that.ledger_data[rowid]["OWNER"];// record["owner"];
                            // New item and make sure bill is selected
                            else// if(that.ledger_data[rowid]["TYPE"]==1)
                                var parent = that.ledger_data[rowid]["ID"];
                            // Is the selected row a payment or an invoice
                            if (parent)
                                that._invoice_new( parent );
                        }
                    })
                    .appendTo(this.menu);
                // New payment
                this.menuPayment = $("<li>", {
                    html:'<span class="ui-icon ui-icon-plusthick"></span>'+lang.newPaymentTxt,
                    class: "lockable need_inv"
                })
                    .click(function() { that._payment_new(); })
                    .appendTo(this.menu);

                // Change Status
                this.status_menu = $("<li>", {
                    html:'<span class="ui-icon ui-icon-tag"></span>'+lang.statusDlg
                })
                    .appendTo(this.menu)
                    .click(function(e){
                        // prevent hiding if clicked
                        if ($(e.target).is(this))
                            return false;
                    });
                var mnu = $("<ul>", {
                    style: "position:absolute;width:auto;z-index:1000;display:none;font-weight:normal;white-space:nowrap;"
                })
                    .appendTo(this.status_menu);
                // STATUS VALUES
                $.each(lang.bill_status, function(i,v){
                    $("<li>", {
                        "html":v,
                        "val":i,
                        "class":i==3?"inv_only":""
                    })
                        .click(function() { that._change_status( $(this).val() ); })
                        .appendTo(mnu);
                });
                // Edit
                this.editMenu = $("<li>", {
                    class:"menu_edit lockable",
                    html:'<span class="ui-icon ui-icon-pencil"></span>'+lang.editTxt
                })
                    .click(function() { that._edit(); })
                    .appendTo(this.menu);
                // Delete
                this.deleteMenu = $("<li>", {
                    class:"menu_edit lockable",
                    html:'<span class="ui-icon ui-icon-minusthick"></span>'+lang.deleteTxt
                })
                    .click(function() { if (!$(this).hasClass("ui-state-disabled")) that._delete(); })
                    .appendTo(this.menu);
                // Break
                $("<hr>").appendTo(this.menu);
                //  Assign items
                if (doc_type == 1) // If a job
                {
                    this.mnu_add_assign = $("<li>", {
                        class:"menu_edit lockable",
                        html:'<span class="ui-icon ui-icon-extlink"></span>'+lang.assignItemsTxt
                    })
                        .click(function() {	if (!$(this).hasClass("ui-state-disabled")) that._assign_items(true); })
                        .appendTo(this.menu);
                }
                // Add custom
                this.mnu_add_cust = $("<li>", {
                    class:"menu_edit lockable",
                    html:'<span class="ui-icon ui-icon-plusthick"></span>'+lang.newCustomEntryTxt
                })
                    .click(function() {	if (!$(this).hasClass("ui-state-disabled")) that._edit_item(true, 3); })
                    .appendTo(this.menu);
                // Edit entry
                this.mnu_entry_edit = $("<li>", {
                    class:"menu_edit_subs lockable",
                    html:'<span class="ui-icon ui-icon-pencil"></span>'+lang.editEntryTxt
                })
                    .click(function() { if (!$(this).hasClass("ui-state-disabled")) that._edit_item(); })
                    .appendTo(this.menu);
                // Delete entry
                this.mnu_entry_delete = $("<li>", {
                    class:"menu_edit_subs lockable",
                    html:'<span class="ui-icon ui-icon-minusthick"></span>'+lang.deleteEntryTxt
                })
                    .click(function() { if (!$(this).hasClass("ui-state-disabled")) that._delete_assigned_item(); })
                    .appendTo(this.menu);
                // Break
                $("<hr>").appendTo(this.menu);
                // Print
                this.mnu_print = $("<li>", {
                    html:'<span class="ui-icon ui-icon-print"></span>'+lang.printTxt
                })
                    .click(function() {
                        var rowid = that.ledger.jqGrid ('getGridParam', 'selrow');
                        if (rowid)
                        {
                            var type;
                            // Invoice
                            if (that.ledger_data[rowid].TYPE==1)
                                type = that.ledger_data[rowid].STATUS > 1 ? 3 : 2;
                            // Credit note
                            if (that.ledger_data[rowid].TYPE==2)
                                type = that.ledger_data[rowid].STATUS > 1 ? 6 : 5;

                            if (rowid.includes('ethl_')) {
                                for (var i = 0; i < that.ethl_partial_invoices.length; i++) {
                                    var partialInvoice = that.ethl_partial_invoices[i];

                                    if (partialInvoice.id == rowid.replace('ethl_', '')) {
                                        openPrint({main_id:that.options.main_id, sub_id:that.ledger_data[rowid].ID, sub_type:intval(type), depot:that.ledger_data[rowid]["DEPOT_ID"], doc: 34, params: {percentage: partialInvoice.percentage, amount: partialInvoice.amount}});
                                        break;
                                    }
                                }
                            } else {
                                openPrint({main_id:that.options.main_id, sub_id:that.ledger_data[rowid].ID, sub_type:intval(type), depot:that.ledger_data[rowid]["DEPOT_ID"]});
                            }
                        }
                    })
                    .appendTo(this.menu);
                // Email
                this.mnu_email = $("<li>", {
                    html:'<span class="ui-icon ui-icon-mail-closed"></span>'+lang.sendEmailTxt
                })
                    .click(function() { that._send_email(); })
                    .appendTo(this.menu);
                // Break
                $("<hr>").appendTo(this.menu);

                // Refresh
                this.mnu_refresh = $("<li>", {
                    html:'<span class="ui-icon ui-icon-refresh"></span>'+lang.refreshTxt
                })
                    .click(function(e) { that._refresh(e.shiftKey?true:false); })
                    .appendTo(this.menu);
                // Make menu
                this.menu.menu();
            },

            _partial_invoice_edit: function(rowid)
            {
                var that=this;

                for (var i = 0; i < this.ethl_partial_invoices.length; i++) {
                    var partialInvoice = this.ethl_partial_invoices[i];

                    if (partialInvoice.id === rowid.replace('ethl_', '')) {
                        this.ethl_partial_invoice_date.datepicker('setDate', moment(partialInvoice.date).toDate());
                        this.ethl_partial_invoice_desc.val(partialInvoice.description.substr(0, partialInvoice.description.lastIndexOf(" -")));
                        this.ethl_partial_invoice_percentage.val(partialInvoice.percentage);

                        this.ethl_partial_invoive_dlg.dialog( "option", "title", "Edit Partial Invoice");
                        this.ethl_partial_invoive_dlg.dialog("open");

                        break;
                    }
                }
            },


            _init_partial_invoice_edit: function() {

                var that = this;
                // Payment edit dialog
                this.ethl_partial_invoive_dlg = $( "<div>")
                    .appendTo( "body" )
                    .dialog({
                        modal: true,
                        autoOpen: false,
                        resizable: false,
                        closeOnEscape: true,
                        draggable: true,
                        //minWidth: 470,
                        width:"auto",
                        //minHeight: 200,
                        buttons: [ { icons: {primary: "ui-icon-check"}, text: lang.saveTxt, click: function() {  that._save_partial_invoice(); } },
                            { icons: {primary: "ui-icon-closethick"}, text: lang.cancelTxt, click: function() { $(this).dialog("close"); } } ]
                    });

                var table = $("<table>").appendTo(this.ethl_partial_invoive_dlg);
                // Headings
                var tr = $("<tr>").appendTo( table );
                $("<th>").html(lang.dateTxt).appendTo(tr);
                $("<th>").html(lang.descriptionTxt).appendTo(tr);
                $("<th>").html('Invoice Percentage').appendTo(tr);
                tr = $("<tr>").appendTo( table );
                // Payment date
                var td = $("<td>", {style:"white-space:nowrap"}).appendTo(tr);
                this.ethl_partial_invoice_date = $( "<input>", {
                    required: true,
                    width: 250,
                    type: "text"
                })
                    .datepicker({
                        altFormat: "yy-mm-dd",
                        dateFormat: "DD, " + (user.DATE_FORMAT==1 ? "yy MM d" : user.DATE_FORMAT==2 ? "MM d yy" : "d MM yy"),
                        changeMonth: true,
                        changeYear: true,
                        hideIfNoPrevNext:true,
                        showButtonPanel: true,
                        showOn: "focus",
                        buttonImage: "/images/down.png"
                    })
                    .appendTo( td );


                // DESCRIPTION
                this.ethl_partial_invoice_desc = $("<input>", {
                    autofocus:true,
                    name: "desc",
                    width: 240,
                    maxlength: 45
                }).appendTo( $("<td>", {style:"white-space:nowrap"}).appendTo(tr) );

                // PARTIAL INVOICE PERCENTAGE
                td = $("<td>", {style:"white-space:nowrap;"}).appendTo(tr);
                this.ethl_partial_invoice_percentage = $("<input>", {
                    name:"paid",
                    width:88,
                    value:"0.00",
                    type:"tel",
                    maxlength:15
                })
                    .appendTo( td )
                    .numeric({currency:true, fixed:this.options.currency["DECIMALS"], negative: false}); // Negatives not supported by accounting packages
                $("<span>", {class:"currency_suffix", text: '%' }).appendTo( td );

            },

            // This enables and disables menus and buttons and also shows selected data
            _fill_details: function (rowid) {
                this._super(rowid);


                // Only enable the partial invoice button when right clicking invoices.
                if (rowid && this.ledger_data[rowid]["TYPE"] == 1) { // TYPE 1 = Invoice
                    this.menu.find(".ethl_invoice_only").removeClass("ui-state-disabled");
                } else {
                    this.menu.find(".ethl_invoice_only").addClass("ui-state-disabled");
                }

                // EDITING
                if (rowid.includes("ethl_")) {
                    this.status_menu.addClass( "ui-state-disabled" );
                    this.menu.find(".menu_edit").removeClass("ui-state-disabled");
                }
            },

            // A row edit is called
            _delete: function(rowid)
            {
                var rowid = rowid ? rowid : this.ledger.jqGrid('getGridParam','selrow');

                if (rowid.includes("ethl_")) {
                    this.ethl_partial_invoices = this.ethl_partial_invoices.filter(item => item.id !== rowid.replace('ethl_', ''));
                    this._save_custom_field_data();
                    this.ledger.jqGrid("delRowData", rowid);
                } else {
                    // Call normal delete routine.
                    this._super();
                }
            },

            _partial_invoice_new: function()
            {
                var that=this;

                var rowid = this.ledger.jqGrid('getGridParam','selrow');
                if(rowid && this.ledger_data[rowid]["TYPE"] === 1) { // We can only add these to invoices
                    var today =  new Date();
                    this.ethl_partial_invoice_date.datepicker( "setDate" , today );

                    // Setup and open dialog
                    this.ethl_partial_invoive_dlg.dialog( "option", "title", "New Partial Invoice");
                    this.ethl_partial_invoive_dlg.dialog("open");
                }
            },

            _save_partial_invoice: function() {
                var rowid = this.ledger.jqGrid('getGridParam','selrow');

                if (rowid.includes('ethl_')) { // We are editing an existing partial invoice.
                    for (var i = 0; i < this.ethl_partial_invoices.length; i++) {
                        var partialInvoice = this.ethl_partial_invoices[i];

                        var rowData = this.ledger.jqGrid("getLocalRow", rowid);
                        var parentId = rowData.owner;

                        var date = this.ethl_partial_invoice_date.datepicker("getDate");
                        var formattedDate = $.datepicker.formatDate("yy-mm-dd", date);
                        var invoiceDescription = this.ethl_partial_invoice_desc.val();
                        var invoicePercentage = this.ethl_partial_invoice_percentage.val();
                        var invoiceAmount = (parseFloat(this.ledger_data[parentId].owing) + parseFloat(this.ledger_data[parentId].paid)) * (invoicePercentage / 100);

                        // Round to the nearest penny
                        invoiceAmount = Math.round(invoiceAmount * 100)/100

                        invoiceDescription = invoiceDescription + ' - Partial (' + invoicePercentage + '%)';

                        partialInvoice.date = formattedDate;
                        partialInvoice.description = invoiceDescription;
                        partialInvoice.percentage = invoicePercentage;
                        partialInvoice.amount = invoiceAmount;

                        this.ethl_partial_invoices[i] = partialInvoice;
                        this._save_custom_field_data();

                        var gridData = this._get_partial_invoice_grid_data(rowid.replace('ethl_', ''), parentId, invoiceDescription, formattedDate, invoicePercentage, invoiceAmount);

                        this.ledger.jqGrid("setTreeRow", rowid, gridData);
                    }
                } else {
                    if(rowid && this.ledger_data[rowid]["TYPE"] === 1) { // We can only add these to invoices
                        var date = this.ethl_partial_invoice_date.datepicker("getDate");
                        var formattedDate = $.datepicker.formatDate("yy-mm-dd", date);
                        var invoiceDescription = this.ethl_partial_invoice_desc.val();
                        var invoicePercentage = this.ethl_partial_invoice_percentage.val();
                        var invoiceAmount = (parseFloat(this.ledger_data[rowid].owing) + parseFloat(this.ledger_data[rowid].paid)) * (invoicePercentage / 100);

                        // Round to the nearest penny
                        invoiceAmount = Math.round(invoiceAmount * 100)/100

                        invoiceDescription = invoiceDescription + ' - Partial (' + invoicePercentage + '%)';

                        var newId = this._add_partial_invoice(rowid, formattedDate, invoiceDescription, invoicePercentage, invoiceAmount);
                        var gridData = this._get_partial_invoice_grid_data(newId, rowid, invoiceDescription, formattedDate, invoicePercentage, invoiceAmount);

                        this.ledger.jqGrid("addChildNode", "ethl_" + newId, rowid, gridData);
                        this.ledger.jqGrid('setSelection', "ethl_" + newId, true );
                    }
                }

                this.ethl_partial_invoive_dlg.dialog("close");
            },
        });
    }
});