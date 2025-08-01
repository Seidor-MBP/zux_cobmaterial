sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "../model/formatter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/BusyIndicator",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment"
], function (BaseController, JSONModel, formatter, Filter, FilterOperator, BusyIndicator, MessageToast, MessageBox, Fragment) {
    "use strict";

    return BaseController.extend("com.mbp.zuxcobmaterial.controller.Worklist", {

        formatter: formatter,

        /* =========================================================== */
        /* lifecycle methods                                           */
        /* =========================================================== */

        /**
         * Called when the worklist controller is instantiated.
         * @public
         */
        onInit: function () {
            var oViewModel;

            // Model used to manipulate control states
            oViewModel = new JSONModel({
                visibleFooter: false
            });
            this.setModel(oViewModel, "worklistView");

            var oMessageManager = sap.ui.getCore().getMessageManager();
            this.getView().setModel(oMessageManager.getMessageModel(), "message");
            oMessageManager.registerObject(this.getView(), true);

            this.oSapModel = this.getOwnerComponent().getModel();

            this.ZC_OV_PEP_NECESSIDADE_return_prod_filter = [];
            this.ZC_OV_PEP_NECESSIDADE_return_plant_filter = [];

            // Sobreescreve a função buscar
            this.oSmartFilterBar = this.byId("smartFilterBarMateriais");

            this.oSmartFilterBar._zStandardSearch = this.oSmartFilterBar.search;
            this.oSmartFilterBar.search = this.onSearch.bind(this);

            // Armazena a smarttable
            this.oSmartTable = this.byId("listMaterial");

        },

        /* =========================================================== */
        /* event handlers                                              */
        /* =========================================================== */

        /**
         * Event handler for navigating back.
         * Navigate back in the browser history
         * @public
         */
        onNavBack: function () {
            // eslint-disable-next-line sap-no-history-manipulation
            history.go(-1);
        },


        /*onInitSmartFilterBar : function (oEvent) {
            //Get SmartFilterBar 
            var oGlobalFilter = oEvent.getSource();
        
            //Create JSON data that contains the Inital value of the filter
            var oToday = new Date();

            //"created_on" is the name of the filter field. You should put your own field ID.
            var oDefaultFilter = {
                "$Parameter.S_Year": "" + oToday.getFullYear()
            };
        
            //Set SmartFilterBar initial values
            oGlobalFilter.setFilterData(oDefaultFilter);
            
        },*/

        onSearch: async function (...args) {

            this.oSmartTable.setBusy(true);
            
            this.ZC_OV_PEP_NECESSIDADE_return_prod_filter = [];
            this.ZC_OV_PEP_NECESSIDADE_return_plant_filter = [];

            let prod = [];
            let plant = [];

            let mSmartFilterBarFilters = this.oSmartFilterBar.getFilters();

            let ZC_OV_PEP_NECESSIDADE_filter = [];

            let bindingParamsFiltersArr = this.getFiltersArrayFromOFilter(mSmartFilterBarFilters);
            let prodExists = bindingParamsFiltersArr.findIndex(e => e.sPath === "Product");

            if (prodExists < 0) {

                bindingParamsFiltersArr.forEach(e => {
                    if (e.sPath === "OrdemVendaFilter") {
                        ZC_OV_PEP_NECESSIDADE_filter.push(new sap.ui.model.Filter("OrdemVenda", e.getOperator(), e.getValue1(), e.getValue2()));
                    }
                    if (e.sPath === "PepFilter") {
                        ZC_OV_PEP_NECESSIDADE_filter.push(new sap.ui.model.Filter("Pep", e.getOperator(), e.getValue1(), e.getValue2()));
                    }
                });

            }

            if (ZC_OV_PEP_NECESSIDADE_filter.length) {

                let that = this;

                await new Promise(function (fnResolve, fnReject) {
                    that.oSapModel.read("/ZC_OV_PEP_NECESSIDADE", {
                        filters: ZC_OV_PEP_NECESSIDADE_filter,
                        success: function (oData) {
                            fnResolve(oData)
                        }.bind(that),
                        error: function (oError) {
                            fnReject(oError)
                        }.bind(that)
                    });
                }).then(function (oData) {
                    oData.results.forEach(r => {
                        prod.push(r.Material);
                        plant.push(r.Plant);
                    });
                });

            }

            prod = prod.filter((p, i) => prod.indexOf(p) === i);
            plant = plant.filter((p, i) => plant.indexOf(p) === i);

            prod.forEach(p => this.ZC_OV_PEP_NECESSIDADE_return_prod_filter.push(new sap.ui.model.Filter("Product", sap.ui.model.FilterOperator.EQ, p)))
            plant.forEach(p => this.ZC_OV_PEP_NECESSIDADE_return_plant_filter.push(new sap.ui.model.Filter("Plant", sap.ui.model.FilterOperator.EQ, p)))


            this.oSmartTable.setBusy(false);
            this.oSmartFilterBar._zStandardSearch(...args);

        },

        onBeforeRebindTable: function (oEvent) {
            /*var oSmartTable = oEvent.getSource();
            var oSmartFilterBar = this.byId(oSmartTable.getSmartFilterId());
            var vAno = oSmartFilterBar.getModel("fi1t3rM0d31").getProperty("/$Parameter.S_Year");
            oSmartTable.setTableBindingPath("/ZC_COB_MATERIAL('" + vAno + "')/Set");*/

            //var oTable = oEvent.getSource().getTable();
            //oTable.attachBusyStateChanged(this._onOptimizeSmartTableColumn);

            var mBindingParams = oEvent.getParameter("bindingParams");
            var sSelectedNoMov = this.byId("ID_FILTER_NO_NULL_MOVIMENT").getSelected();
            var oFilters = [];

            if (this.ZC_OV_PEP_NECESSIDADE_return_prod_filter.length > 0)
                oFilters.push(new sap.ui.model.Filter({
                    filters: this.ZC_OV_PEP_NECESSIDADE_return_prod_filter,
                    and: false
                }));

            if (this.ZC_OV_PEP_NECESSIDADE_return_plant_filter.length > 0)
                oFilters.push(new sap.ui.model.Filter({
                    filters: this.ZC_OV_PEP_NECESSIDADE_return_plant_filter,
                    and: false
                }));

            if (!!sSelectedNoMov) {
                oFilters.push(new sap.ui.model.Filter({
                    filters: [
                        new sap.ui.model.Filter("ConsumoTotal", sap.ui.model.FilterOperator.NE, '0.000'),
                        new sap.ui.model.Filter("ConsumoMensal", sap.ui.model.FilterOperator.NE, '0.000'),
                        new sap.ui.model.Filter("ConsumoMesAnoAnt", sap.ui.model.FilterOperator.NE, '0.000'),
                        new sap.ui.model.Filter("ReorderThresholdQuantity", sap.ui.model.FilterOperator.NE, '0.000'),
                        new sap.ui.model.Filter("StockUtilLivre", sap.ui.model.FilterOperator.NE, '0.000'),
                        new sap.ui.model.Filter("OvPepNecessidade", sap.ui.model.FilterOperator.NE, '0.000'),
                        new sap.ui.model.Filter("OvPep", sap.ui.model.FilterOperator.NE, '0.000'),
                        new sap.ui.model.Filter("OvPepAguardandoProjeto", sap.ui.model.FilterOperator.NE, '0.000'),
                        new sap.ui.model.Filter("MinimumLotSizeQuantity", sap.ui.model.FilterOperator.NE, '0.000'),
                        new sap.ui.model.Filter("SafetyStockQuantity", sap.ui.model.FilterOperator.NE, '0.000')
                    ], and: false
                }));
            }

            if (oFilters.length > 0) {
                mBindingParams.filters.push(new sap.ui.model.Filter({ filters: oFilters, and: true }));
            }
        },

        onLinkPressed: function (oEvent) {
            var oToday = new Date();
            this._oObjectPressed = oEvent.getSource().getBindingContext().getObject();

            if (oEvent.getParameter("id").indexOf("ConsumoMensal") !== -1) {
                this._oObjectPressed.Ano = "" + oToday.getFullYear();
            } else if (oEvent.getParameter("id").indexOf("ConsumoAnoAnt") !== -1) {
                this._oObjectPressed.Ano = "" + (oToday.getFullYear() - 1);
            }

            if (!this._dialogDetail) {
                var oView = this.getView();

                if (oEvent.getParameter("id").indexOf("Consumo") !== -1) {
                    this._dialogDetail = sap.ui.xmlfragment(oView.getId(), "com.mbp.zuxcobmaterial.view.fragments.DialogConsumoMensal", this);
                } else if (oEvent.getParameter("id").indexOf("StockAtual") !== -1) {
                    this._dialogDetail = sap.ui.xmlfragment(oView.getId(), "com.mbp.zuxcobmaterial.view.fragments.DialogReservado", this);
                } else if (oEvent.getParameter("id").indexOf("Requisicao") !== -1) {
                    this._dialogDetail = sap.ui.xmlfragment(oView.getId(), "com.mbp.zuxcobmaterial.view.fragments.DialogRequisicao", this);
                } else if (oEvent.getParameter("id").indexOf("Pedido") !== -1) {
                    this._dialogDetail = sap.ui.xmlfragment(oView.getId(), "com.mbp.zuxcobmaterial.view.fragments.DialogPedido", this);
                } else if (oEvent.getParameter("id").indexOf("OvPepEmp") !== -1) {
                    this._dialogDetail = sap.ui.xmlfragment(oView.getId(), "com.mbp.zuxcobmaterial.view.fragments.DialogOvPep", this);
                } else if (oEvent.getParameter("id").indexOf("OvPepNec") !== -1) {
                    this._dialogDetail = sap.ui.xmlfragment(oView.getId(), "com.mbp.zuxcobmaterial.view.fragments.DialogOvPepNec", this);
                } else if (oEvent.getParameter("id").indexOf("CreditoAlcada") !== -1) {
                    this._dialogDetail = sap.ui.xmlfragment(oView.getId(), "com.mbp.zuxcobmaterial.view.fragments.DialogCreditAlcada", this);
                } else if (oEvent.getParameter("id").indexOf("OvPepAgPr") !== -1) {
                    this._dialogDetail = sap.ui.xmlfragment(oView.getId(), "com.mbp.zuxcobmaterial.view.fragments.DialogOvPepAgProj", this);
                }

            }

            this.getView().addDependent(this._dialogDetail);

            // toggle compact style
            jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this._dialogDetail);
            this._dialogDetail.open();

            this._dialogDetail.setEscapeHandler((oEscapeHandler) => {
                oEscapeHandler.reject();
            });
        },

        onHandleCloseDialogDetail: function (oEvent) {
            this._dialogDetail.destroy();
            this._dialogDetail = null;
        },

        onBeforeRebindTableMaterialPlantAno: function (oEvent) {
            var mBindingParams = oEvent.getParameter("bindingParams");

            var newFilter = new sap.ui.model.Filter("Material", sap.ui.model.FilterOperator.EQ, this._oObjectPressed.Product);
            mBindingParams.filters.push(newFilter);

            newFilter = new sap.ui.model.Filter("Plant", sap.ui.model.FilterOperator.EQ, this._oObjectPressed.Plant);
            mBindingParams.filters.push(newFilter);

            newFilter = new sap.ui.model.Filter("Ano", sap.ui.model.FilterOperator.EQ, this._oObjectPressed.Ano);
            mBindingParams.filters.push(newFilter);
        },

        onBeforeRebindTableMaterialPlant: function (oEvent) {
            var mBindingParams = oEvent.getParameter("bindingParams");

            var newFilter = new sap.ui.model.Filter("Material", sap.ui.model.FilterOperator.EQ, this._oObjectPressed.Product);
            mBindingParams.filters.push(newFilter);

            newFilter = new sap.ui.model.Filter("Plant", sap.ui.model.FilterOperator.EQ, this._oObjectPressed.Plant);
            mBindingParams.filters.push(newFilter);
        },

        onBeforeRebindTableMaterialPlantDocs: function (oEvent) {
            var mBindingParams = oEvent.getParameter("bindingParams");

            var newFilter = new sap.ui.model.Filter("Material", sap.ui.model.FilterOperator.EQ, this._oObjectPressed.Product);
            mBindingParams.filters.push(newFilter);

            newFilter = new sap.ui.model.Filter("Plant", sap.ui.model.FilterOperator.EQ, this._oObjectPressed.Plant);
            mBindingParams.filters.push(newFilter);

            var oSmartFilterBarFilters = this.oSmartFilterBar.getFilters();
            var aSTFilters = this.getFiltersArrayFromOFilter(oSmartFilterBarFilters);

            aSTFilters.forEach(stFilter => {
                let path = stFilter.getPath();
                if (path == "OrdemVendaFilter") {
                    newFilter = new sap.ui.model.Filter("OrdemVenda", stFilter.getOperator(), stFilter.getValue1(), stFilter.getValue2());
                    mBindingParams.filters.push(newFilter);
                }
                else if (path == "PepFilter") {
                    newFilter = new sap.ui.model.Filter("Pep", stFilter.getOperator(), stFilter.getValue1(), stFilter.getValue2());
                    mBindingParams.filters.push(newFilter);
                }
            });
        },

        getFiltersArrayFromOFilter(oFilter) {
            if (!oFilter) return [];

            let aFilter = [];

            oFilter.forEach((filter) => {
                if (filter.getPath()) {
                    aFilter.push(filter);
                }
                aFilter.push(...this.getFiltersArrayFromOFilter(filter.getFilters()));
            });

            return aFilter;
        },

        onHandlePressTableAction: function (oEvent) {
            var oDataModel = this.getModel(),
                oViewModel = this.getModel("worklistView");

            var aDeferredGroup = [],
                oEntry = {};

            sap.ui.getCore().getMessageManager().removeAllMessages();

            aDeferredGroup = oDataModel.getDeferredGroups();
            aDeferredGroup.push("batchCreate");
            oDataModel.setDeferredGroups(aDeferredGroup);

            var oTable = this.oSmartTable.getTable();
            var sSelectedIndice = oTable.getSelectedIndices();

            if (!sSelectedIndice.length) {
                MessageBox.error(this.getResourceBundle().getText("msgErroNoSelectedMaterial"),
                    { styleClass: this.getOwnerComponent().getContentDensityClass() }, this);
                return;
            }

            sSelectedIndice.forEach(function (oItem) {
                var sObject = this.oSmartTable._getRowBinding().getContexts()[oItem].getObject();
                oEntry = {
                    Matnr: sObject.Product,
                    Werks: sObject.Plant,
                    Menge: sObject.NecessidadeCompra,
                    Meins: sObject.BaseUnit
                };
                oDataModel.create("/ReqCompraSet", oEntry, { groupId: "batchCreate" });
            }, this);

            oViewModel.setProperty("/visibleFooter", true);

            BusyIndicator.show();

            oDataModel.submitChanges({
                groupId: "batchCreate",
                success: function (oData, response) {
                    BusyIndicator.hide();
                }.bind(this),
                error: function (oError) {
                    BusyIndicator.hide();
                    MessageBox.error(this.getResourceBundle().getText("msgErroCreateRequisicao"),
                        { styleClass: this.getOwnerComponent().getContentDensityClass() });

                }.bind(this)
            });
        },

        onBeforeExport: function (oEvent) {

            /*MM:WSJ - Nescess�rio sobrescrever o metodo onBeforeExport para pegar os dados dos campos que s�o link no frontend*/

            var mExportSettings = oEvent.getParameter("exportSettings");

            var aItems = this.oSmartTable.getTable().getBinding("rows").getContexts().map(function (oContext) {
                return oContext.getObject();
            });


            /*Formata os valores para o padr�o BRL*/
            var numberFormatter = new Intl.NumberFormat("pt-BR", {
                minimumFractionDigits: 3,
                maximumFractionDigits: 3,
            });

            /*Formata com as unidades de medida*/
            aItems.forEach(function (item) {
                item.ConsumoMesAnoAnt = numberFormatter.format(item.ConsumoMesAnoAnt) + " " + item.MaterialUnitConsumoMesAnoAnt;
                item.ConsumoMensal = numberFormatter.format(item.ConsumoMensal) + " " + item.MaterialUnitConsumoMensal;
                item.StockAtual = numberFormatter.format(item.StockAtual) + " " + item.MaterialBaseUnitStockAtual;
                item.OvPepNecessidade = numberFormatter.format(item.OvPepNecessidade) + " " + item.MaterialUnitOvPepNecessidade;
                item.PedCompras = numberFormatter.format(item.PedCompras) + " " + item.MaterialBaseUnitPedCompras;
                item.ConsumoTotal = numberFormatter.format(item.ConsumoTotal) + " " + item.MaterialUnitConsumoTotal;
                item.CreditoAlcada = numberFormatter.format(item.CreditoAlcada) + " " + item.MaterialUnitCreditoAlcada;
                item.StockUtilLivreNew = numberFormatter.format(item.StockUtilLivreNew) + " " + item.MaterialBaseUnitStockUtilLivre;
            });


            /*Passa os dados formatados para o template*/
            mExportSettings.dataSource = {
                type: "array",
                data: aItems
            };

            mExportSettings.workbook.columns.forEach(function (column) {

                /*Formatamos as colunas com seus respectivos nomes para garantir que os dados sejam encontrados*/
                switch (column.property) {

                    case "ConsumoMesAnoAnt,MaterialUnitConsumoMesAnoAnt":

                        column.text = "Consumo Mes Anterior";
                        column.property = "ConsumoMesAnoAnt"
                        column.label = "ConsumoMesAnoAnt"
                        column.template = "{ConsumoMesAnoAnt}";
                        column.type = "string";
                        break

                    case "ConsumoMensal,MaterialUnitConsumoMensal":

                        column.text = "Consumo Mensal";
                        column.property = "ConsumoMensal"
                        column.label = "ConsumoMensal"
                        column.template = "{ConsumoMensal}";
                        column.type = "string";
                        break

                    case "StockAtual,MaterialBaseUnitStockAtual":

                        column.text = "Stock Atual";
                        column.property = "StockAtual"
                        column.label = "StockAtual"
                        column.template = "{StockAtual}";
                        column.type = "string";
                        break

                    case "OvPepNecessidade,MaterialUnitOvPepNecessidade":

                        column.text = "Ov Pep Necessidade";
                        column.property = "OvPepNecessidade"
                        column.label = "OvPepNecessidade"
                        column.template = "{OvPepNecessidade}";
                        column.type = "string";
                        break

                    case "OvPep,MaterialBaseUnitOvPep":

                        column.text = "Ov Pep";
                        column.property = "OvPep"
                        column.label = "OvPep"
                        column.template = "{OvPep}";
                        column.type = "string";
                        break


                    case "CreditoAlcada,MaterialUnitCreditoAlcada":

                        column.text = "Credito Alcada";
                        column.property = "CreditoAlcada"
                        column.label = "CreditoAlcada"
                        column.template = "{CreditoAlcada}";
                        column.type = "string";
                        break


                    case "ReqCompras,MaterialBaseUnitReqCompras":

                        column.text = "Requisicao de Compra";
                        column.property = "ReqCompras"
                        column.label = "ReqCompras"
                        column.template = "{ReqCompras}";
                        column.type = "string";
                        break

                    case "PedCompras,MaterialBaseUnitPedCompras":

                        column.text = "Pedido de compras";
                        column.property = "PedCompras"
                        column.label = "PedCompras"
                        column.template = "{PedCompras}";
                        column.type = "string";
                        break

                    case "ConsumoTotal":

                        column.text = "Consumo total";
                        column.property = "ConsumoTotal"
                        column.label = "ConsumoTotal"
                        column.template = "{ConsumoTotal}";
                        column.type = "string";
                        break

                    case "CreditoAlcada":

                        column.text = "Credito Alcada";
                        column.property = "CreditoAlcada"
                        column.label = "CreditoAlcada"
                        column.template = "{CreditoAlcada}";
                        column.type = "string";
                        break

                    case "StockUtilLivreNew":

                        column.text = "Estoque Livre";
                        column.property = "StockUtilLivreNew"
                        column.label = "StockUtilLivreNew"
                        column.template = "{StockUtilLivreNew}";
                        column.type = "string";
                        break
                }


            });
        },

        onMessagePopoverPress: function (oEvent) {
            var oSourceControl = oEvent.getSource();
            this._getMessagePopover().then(function (oMessagePopover) {
                oMessagePopover.openBy(oSourceControl);
            });
        },

        /* =========================================================== */
        /* internal methods                                            */
        /* =========================================================== */

        _onOptimizeSmartTableColumn: function (oEvent) {

            var bBusy = oEvent.getParameter("busy");
            if (!bBusy && !this._bColumnOptimizationDone) {

                var oTable = oEvent.getSource();
                var oTpc = null;
                if (sap.ui.table.TablePointerExtension) {
                    oTpc = new sap.ui.table.TablePointerExtension(oTable);
                } else {
                    oTpc = new sap.ui.table.extensions.Pointer(oTable);
                }
                var aColumns = oTable.getColumns();
                for (var i = aColumns.length; i >= 0; i--) {
                    oTpc.doAutoResizeColumn(i);
                }

                this._bColumnOptimizationDone = true;

            }

        },

        _getMessagePopover() {
            var oView = this.getView();

            // create popover lazily (singleton)
            if (!this._pMessagePopover) {
                this._pMessagePopover = Fragment.load({
                    id: oView.getId(),
                    name: "com.mbp.zuxcobmaterial.view.fragments.MessagePopover"
                }).then(function (oMessagePopover) {
                    oView.addDependent(oMessagePopover);
                    return oMessagePopover;
                });
            }
            return this._pMessagePopover;
        }


    });
});
