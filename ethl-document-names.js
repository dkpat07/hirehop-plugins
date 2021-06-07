$(document).ready(function() {
    if (typeof ($.custom.print_dlg) != 'undefined' && hh_api_version <= 1) {
        $.widget('custom.print_dlg', $.custom.print_dlg, {
            _prepend_etherlive_text: function() {
                if (this.grid === undefined) {
                    return;
                }

                var rowIds = this.grid.jqGrid("getDataIDs");
                for (var i = 0; i < rowIds.length; i++) {
                    var rowId = rowIds[i];
                    var rowData = this.grid.jqGrid('getRowData', rowId);
                    this.grid.jqGrid('setCell', rowId, "NAME", "Etherlive " + rowData.NAME);
                }
            },

            _create: function() {
                // if already created, exit
                if (this.element.hasClass("custom_print_dialog")) return;

                var that = this;

                // Set the main element
                this.element.addClass( "custom_print_dialog" );

                // Type memory (saves reloading list)
                this.type = -1;
                this.sub_type = 0;
                this.depot = 0;

                this.element
                    .dialog({
                        modal: true,
                        autoOpen: false,
                        title: lang.selectDocTxt,
                        width: "auto",
                        height: "auto",
                        minHeight: 344,
                        minWidth: 460,
                        maxWidth: 460,
                        buttons: [ { class:"print_open", icons: {primary: "ui-icon-check"}, text: lang.openTxt, click: function() { that._merge(); } },
                            { icons: {primary: "ui-icon-closethick"}, text: lang.cancelTxt, click: function() { $(this).dialog("close"); } } ],
                        resize: function(event, ui ){
                            that.grid.jqGrid('setGridHeight', (ui.size.height - 200));
                        },
                        close: function(){
                            if(typeof(localStorage)!=="undefined" && typeof(JSON)!=="undefined")
                            {
                                var set = {
                                    "output":that.output.val(),
                                    "stationery":that.stationery.val(),
                                    "orientation":that.orientation.val(),
                                    "pages":that.page_nums[0].checked ?1:0
                                }
                                localStorage.HHPrintCompany = user.COMPANY_ID;
                                localStorage.HHPrint = JSON.stringify(set);
                            }
                        }
                    });

                this.grid = $( "<table>", {
                    "id" : (function(){ return "grid"+$(".ui-jqgrid").length })
                })
                    .appendTo( this.element )
                    .jqGrid({
                        url:'/php_functions/doc_list.php',
                        datatype: 'local',
                        mtype: 'get',
                        dataType: 'json',
                        colModel:[
                            {name:'ID',width:0,hidden:true,key:true},
                            {name:'NAME',index:"NAME",search:true,searchoptions:{sopt:["cn"]},width:340,label:lang.nameTxt},
                            {name:'TYPE',width:150,sortable:false,search:false,formatter:this._typeFormatter,label:lang.forTxt},
                            {name:'FORMAT',hidden:true},
                            {name:'ENGINE',hidden:true}
                        ],
                        idPrefix: "print", // prefix before the id in each cell
                        rowNum:50,
                        height: 400,
                        scrollOffset: 19,
                        forceFit: true,
                        gridview: true, // Don't need afterinsert, so true makes it faster
                        hidegrid: false, // Remove the hide button
                        scroll: true, // Endless scroll
                        hoverrows:false,
                        deepempty:true,
                        // Events
                        onSelectRow : function(rowid, status, e) { that._fill_details(rowid); },
                        ondblClickRow: function(rowid) { that._merge(rowid);},
                        gridComplete: function() { // Select first row
                            var rowid = $(this).jqGrid('getGridParam','selrow');
                            if ( !rowid )
                            {
                                rowid = $(this).jqGrid("getDataIDs")[0];
                                if (rowid) $(this).jqGrid('setSelection', rowid );
                            }
                            that._fill_details(rowid);

                            that._prepend_etherlive_text();
                        },
                        beforeProcessing : function(data)
                        {
                            // Error handling
                            if (data && typeof(data.error) != "undefined")
                            {
                                error_message(isNaN(parseInt(data.error)) ? data.error : lang.error[data.error]);
                                return false;
                            }
                            if (typeof(data['stationery'])!="undefined")
                            {

                                var sel = 0;
                                // The selected stationery id
                                if(typeof(localStorage)!="undefined" && typeof(localStorage.HHPrint)=="string")
                                {
                                    sel = JSON.parse(localStorage.HHPrint);
                                    if (sel)
                                        sel = intval(sel["stationery"]);
                                }
                                // Empty stationery
                                that.stationery.html("");
                                // Add none
                                $("<option>", {html: lang.noneTxt, value:0, selected:"selected"}).appendTo(that.stationery);
                                // Loop through stationery adding rows
                                $.each(data['stationery'], function(i,v){
                                    $("<option>", {html: v, value:i}).appendTo(that.stationery)
                                        .prop("selected", sel==i); // Selected if last
                                });
                            }
                        },
                        // Error handling
                        loadError: function (xhr, textStatus, errorThrown) {
                            error_message(lang.error[1]+" ("+errorThrown+").");
                        }
                    })
                    .jqGrid("filterToolbar", {})
                    .disableSelection();

                // Add the search placeholder
                $("#gs_printNAME").attr("placeholder", lang.searchTxt);

                $("<div>", {style:"height:6px"}).appendTo(this.element);

                this.output = $("<select>").appendTo( $("<label>", {html: lang.outputTypeTxt+" : "}).appendTo(this.element) )
                    .change(function(){
                        //that.stationery.prop('disabled', this.value!="pdf");
                        if (this.value=="pdf")
                            pdf_div.show(200);
                        else
                            pdf_div.hide(200);
                    });
                $("<option>", {html: lang.mergeTypes[0], value:"html", selected:"selected"}).appendTo(this.output);
                $("<option>", {html: lang.mergeTypes[1], value:"pdf"}).appendTo(this.output);
                // $("<option>", {html: lang.mergeTypes[2], value:"docx"}).appendTo(this.output);

                // If a PDF, show this div
                var pdf_div = $("<div>",{style:"display:none;padding-top:6px"}).appendTo(this.element);
                // The stationary to overlay
                this.stationery = $("<select>",{style:"min-width:160px"}).appendTo( $("<label>", {html: lang.stationeryTxt+" : "}).appendTo(pdf_div) );
                $("<option>", {html: lang.noneTxt, value:0, selected:"selected"}).appendTo(this.stationery);
                // The document orientation
                this.orientation = $("<select>",{style:"min-width:160px"}).appendTo( $("<label>", {html: lang.orientationTxt+" : ", style:"margin-left:10px"}).appendTo(pdf_div) );
                $.each(lang.orientations, function(i,v){
                    $("<option>", {value:i, html:v}).appendTo( that.orientation );
                });
                // Add a line break
                $("<div>", {style:"height:6px;", html:"&nbsp;"}).appendTo(pdf_div);
                // Add page numbering
                this.page_nums = $( "<input>", { type: "checkbox" })
                    .prependTo( $("<label>", {html:lang.addPageNumsTxt}).appendTo(pdf_div) );
                // The document pdf engine
                this.pdf_engine = $("<select>",{style:"min-width:160px"}).appendTo( $("<label>", {html: lang.pdfEngineTxt+" : ", style:"margin-left:10px"} ).appendTo(pdf_div) );
                $("<option>", {value:0, html:"Webkit"}).appendTo( this.pdf_engine );
                $("<option>", {value:1, html:"Chromium"}).appendTo( this.pdf_engine );

                $("<div>", {style:"height:6px"}).appendTo(this.element);
            },
        });
    }
});