/***
@controller Name:sap.suite.ui.generic.template.ListReport.view.ListReport,
*@viewId:ui.s2p.mm.pur.central.ctr.sts1::sap.suite.ui.generic.template.ListReport.view.ListReport::C_CentralPurchaseContractTP
*/
sap.ui.define([
		"sap/ui/core/mvc/ControllerExtension",
		"sap/m/BusyDialog",
		"sap/m/MessageToast",
		"sap/m/MessageBox",
		"vwks/nlp/s2p/mm/pctrcentral/manage/changes/utils/Formatter",
		"vwks/nlp/s2p/mm/reuse/lib/supplierStatus/SupplierStatuses",
		"vwks/nlp/s2p/mm/reuse/lib/util/NavigationHelper",
		"vwks/nlp/s2p/mm/pctrcentral/manage/changes/utils/Constants",
		"vwks/nlp/s2p/mm/reuse/lib/util/Formatter",
		"vwks/nlp/s2p/mm/reuse/lib/documentHistory/type/ApplicationType",
		"vwks/nlp/s2p/mm/reuse/lib/documentHistory/DocumentHistoryHelper"
	],
	function (
		ControllerExtension,
		BusyDialog,
		MessageToast,
		MessageBox,
		Formatter,
		SupplierStatuses,
		NavigationHelper,
		Constants,
		ReuseFormatter,
		ApplicationType,
		DocumentHistoryHelper
	) {
		"use strict";
		return ControllerExtension.extend("vwks.nlp.s2p.mm.pctrcentral.manage.ListReportExtController", {

			// this section allows to extend lifecycle hooks or override public methods of the base controller
			override: {

				/*
				 * Extending life cycle method in adaptation app
				 */
				onInit: function () {
					this._oView = this.getView();
					//i18n Resource model for translation
					var oi18nModel = this._oView.getController().getOwnerComponent().getModel("i18n");
					if (oi18nModel) {
						this._oResourceBundle = oi18nModel.getResourceBundle();
					}
					this.oSupplierStatuses = new SupplierStatuses(this._oView, this._oResourceBundle);
				},

				/*
				 * overriding life cycle method to add additional fields for odata service call 
				 */
				onAfterRendering: function () {
					// requesting additional fields in odata service call
					var aRequestedFields = ["SupplierOverallStatus", "PurchasingGroup"];
					var oPurchaseContractsSmartTable = this.base.byId(
						"ui.s2p.mm.pur.central.ctr.sts1::sap.suite.ui.generic.template.ListReport.view.ListReport::C_CentralPurchaseContractTP--listReport-_tab1"
					);
					if (oPurchaseContractsSmartTable.getRequestAtLeastFields() !== "") {
						oPurchaseContractsSmartTable.setRequestAtLeastFields(oPurchaseContractsSmartTable.getRequestAtLeastFields() + "," +
							aRequestedFields);
					} else {
						oPurchaseContractsSmartTable.setRequestAtLeastFields(aRequestedFields);
					}

					var oPurchaseHierContractsSmartTable = this.base.byId(
						"ui.s2p.mm.pur.central.ctr.sts1::sap.suite.ui.generic.template.ListReport.view.ListReport::C_CentralPurchaseContractTP--listReport-_tab2"
					);
					if (oPurchaseHierContractsSmartTable.getRequestAtLeastFields() !== "") {
						oPurchaseHierContractsSmartTable.setRequestAtLeastFields(oPurchaseHierContractsSmartTable.getRequestAtLeastFields() + "," +
							aRequestedFields);
					} else {
						oPurchaseHierContractsSmartTable.setRequestAtLeastFields(aRequestedFields);
					}
				}
			},

			/*
			 * This method handles the display of warning messages on save/delete calls
			 * @public
			 * @param {array} aRequests
			 * @param {int} iIndex
			 *  @param {sap.ui.base.Event} oEvent The event object
			 **/
			showWarningMessage: function (aRequests, iIndex) {
				var oHdrMessage = JSON.parse(aRequests[iIndex].response.headers["sap-message"]);
				if (oHdrMessage.severity === Constants.MESSAGE_SEVERITY.WARNING) {
					var sCancelWarningMessage = oHdrMessage.message;
					MessageBox.warning(sCancelWarningMessage, {
						actions: MessageBox.Action.OK
					});
				}
			},

			/*
			 * Navigate to pricing conditions
			 * @param method's parameter context. It holds the passed value by invoker.
			 */
			navigateToPricingConditions: function (oContext, sHeaderURL) {
				/* This odata call is used to get contract item and pass into target URL for context preparation,so that
				it could navigate on item object page
				*/
				var oModel = this.getView().getModel(),
					oContractContext = oContext.getObject(),
					oContractItemContext = null,
					sURL = oContext.sPath + "/to_CntrlPurchaseContractItemTP",
					sNoDataText = this._oResourceBundle.getText("NoItemText"),
					oBusyDialog = new BusyDialog();
				oBusyDialog.open();
				oModel.read(sURL, {
					urlParameters: {
						$top: 1
					},
					success: function (oData, oResponse) {
						oBusyDialog.close();
						if (oData.results.length > 0) {
							oContractItemContext = oData.results[0];

							var sContractHeader = this.getView().getModel().createKey(sHeaderURL, {
								CentralPurchaseContract: oContractContext.CentralPurchaseContract,
								DraftUUID: oContractContext.DraftUUID,
								IsActiveEntity: true
							});
							var sContractItem = this.getView().getModel().createKey("C_CntrlPurchaseContractItemTP", {
								CentralPurchaseContractItem: oContractItemContext.CentralPurchaseContractItem,
								CentralPurchaseContract: oContractContext.CentralPurchaseContract,
								DraftUUID: oContractItemContext.DraftUUID,
								IsActiveEntity: true
							});

							var sContractItemPath = sContractHeader + "/to_CntrlPurchaseContractItemTP(" + sContractItem.split("(")[1];

							//Get path for navigation
							NavigationHelper.getNavigationPath(this.getView().getController(), "MCPC", sContractItemPath)
								.then(function (oNavigationDetails) {
									//Open in same window
									NavigationHelper.navigateWithURLHelper(oNavigationDetails.sPath);
								});
						} else {
							MessageToast.show(sNoDataText);
							this.flagSettingToFalsePricingConditions();
						}
					}.bind(this),
					error: function (oError) {
						oBusyDialog.close();
						this.flagSettingToFalsePricingConditions();
						if (JSON.parse(oError.responseText)) {
							MessageToast.show(JSON.parse(oError.responseText).error.message.value);
						}
					}.bind(this)
				});
			},

			/*
			 * Navigate to Pricing conditions
			 * @param {sap.ui.base.Event} oEvent, The event object
			 */
			handlePricingConditionsIconPress: function (oEvent) {
				var oContext = oEvent.getSource().getBindingContext(),
					sHeaderURL = "C_CentralPurchaseContractTP";
				sap.ui.require(["sap/ui/util/Storage"], function (Storage) {
					var oMyStorage = new Storage(Storage.Type.session, "navigation_parameter");
					oMyStorage.put("navigationFlag", {
						flagNavigationPricingConditions: true
					});
					// Invoker function
					this.navigateToPricingConditions(oContext, sHeaderURL);
				}.bind(this));
			},

			/*
			 * Navigate to Pricing conditions
			 * @param {sap.ui.base.Event} oEvent, The event object
			 */
			handlePricingConditionsHierarchyIconPress: function (oEvent) {
				var oContext = oEvent.getSource().getBindingContext(),
					sHeaderURL = "C_CntrlPurContrHierHdrTP";
				sap.ui.require(["sap/ui/util/Storage"], function (Storage) {
					var oMyStorage = new Storage(Storage.Type.session, "navigation_parameter");
					oMyStorage.put("navigationFlag", {
						flagNavigationPricingConditions: true
					});
					// Invoker function
					this.navigateToPricingConditions(oContext, sHeaderURL);
				}.bind(this));
			},

			// Set flagNavigationPricingConditions flag to false
			flagSettingToFalsePricingConditions: function () {
				sap.ui.require(["sap/ui/util/Storage"], function (Storage) {
					var oMyStorage = new Storage(Storage.Type.session, "navigation_parameter");
					oMyStorage.put("navigationFlag", {
						flagNavigationPricingConditions: false
					});
				});
			},

			/*
			 * Navigate to Create Distribution object page
			 */
			handleRequestForContract: function () {

				//Reference of the default Model
				var oModel = this.getView().getModel();
				//Promise Object to get the Draft Guid from the Function Import
				var oDraftPromise = this._getDraftPromise(oModel);
				oDraftPromise.then(function (oResponse) {
					var oParams = {
						"key_link": oResponse.CreatePMATROD.KeyLink,
						"DraftUUID": oResponse.CreatePMATROD.DraftUUID,
						"IsActiveEntity": oResponse.CreatePMATROD.IsActiveEntity
					};

					NavigationHelper.navigateToOutboundTarget(this.getView().getController(), "CreateContractDistribution", oParams);
				}.bind(this));

			},

			/**
			 * Return tooltip for supplier status. Formatter is used.
			 * @param {string} sSupplierOverallStatus supplier overall status code
			 * @return {string} tooltip text
			 * @public
			 */
			getSupplierOverallStatusTooltip: function (sSupplierOverallStatus) {
				return ReuseFormatter.getSupplierOverallStatusTooltip(sSupplierOverallStatus, this._oResourceBundle);
			},

			/**
			 * Return icon src. Formatter is used.
			 * @param {string} sSupplierOverallStatus supplier overall status code
			 * @return {string} icon src
			 * @public
			 */
			getSupplierOverallStatusIcon: function (sSupplierOverallStatus) {
				return ReuseFormatter.getSupplierOverallStatusIcon(sSupplierOverallStatus);
			},

			/**
			 * Return icon color. Formatter is used.
			 * @param {string} sSupplierOverallStatus supplier overall status code
			 * @return { sap.ui.core.IconColor} icon color
			 * @public
			 */
			getSupplierOverallStatusState: function (sSupplierOverallStatus) {
				return ReuseFormatter.getSupplierOverallStatusState(sSupplierOverallStatus);
			},

			/**
			 * Supplier Overall Status press event handler.
			 * @param {sap.ui.base.Event} oEvent press event
			 */
			onSupplierOverallStatusPress: function (oEvent) {
				var oSupplierOverallStatusIcon = oEvent.getSource();
				var oContractContext = oSupplierOverallStatusIcon.getBindingContext();
				this.oSupplierStatuses.loadPopover(oSupplierOverallStatusIcon)
					.then(function () {
						this.oSupplierStatuses.setBusy(true);
						return this.oSupplierStatuses.loadSupplierStatus(oContractContext);
					}.bind(this))
					.then(function (oData) {
						this.oSupplierStatuses.setSupplierStatusData(oData);
						this.oSupplierStatuses.setBusy(false);
					}.bind(this))
					.catch(function (oError) {
						this.oSupplierStatuses.setBusy(false);
						if (JSON.parse(oError.responseText)) {
							MessageBox.error(JSON.parse(oError.responseText).error.message.value);
						}
					}.bind(this));
			},
			/**
			 * The method to call function import to get the Draft Guid used to create new Distribution line
			 * @return {Object} Promise Object of the function import
			 * @param {sap.ui.model.odata.V2.ODataModel} oModel is the reference of default oData Model
			 **/
			_getDraftPromise: function (oModel) {
				var oRoDDraftIdPromise = new Promise(function (resolve, reject) {
					oModel.callFunction(Constants.FUNCTION_IMPORT.CREATE_PMAT_ROD, {
						method: "POST",
						urlParameters: {

						},
						success: function (oData, oResponse) {
							resolve(oData);
						},
						error: function (oError) {
							reject(oError);
						}
					});
				});
				return oRoDDraftIdPromise;
			},
			/*
			 * Open document history dialog from document History Icon
			 * @param {sap.ui.base.Event} oEvent The event object
			 */
			openDocumentHistoryDialog: function (oEvent) {
				DocumentHistoryHelper.openDocumentHistoryDialog(oEvent, this.getView(), ApplicationType.MCPC_HEADER);
			}
		});
	});