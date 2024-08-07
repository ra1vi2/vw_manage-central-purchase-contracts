sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/Fragment",
	"sap/ui/core/ValueState",
	"vwks/nlp/s2p/mm/pctrcentral/manage/changes/utils/Formatter",
	"vwks/nlp/s2p/mm/pctrcentral/manage/changes/utils/Constants",
	"vwks/nlp/s2p/mm/reuse/lib/util/NavigationHelper",
	"vwks/nlp/s2p/mm/reuse/lib/util/Constants"
], function (JSONModel, Fragment, ValueState, Formatter, Constants, NavigationHelper, ReuseConstants) {
	"use strict";

	var AlternativeParts = function (oView, oController, oResourceBundle) {
		this._oView = oView;
		this._oController = oController;
		this._oResourceBundle = oResourceBundle;
	};

	/**
	 * Set or unset popover busy state.
	 * @param {boolean} bBusy true - set busy state, false - remove busy state
	 * @public
	 */
	AlternativeParts.prototype.setBusy = function (bBusy) {
		this.oAlternativeParts.setBusy(bBusy);
	};
	/*
	 * Set Supplier Number and text
	 * @param {object} oAlternativeParts Alternative Parts data
	 * @public
	 */
	AlternativeParts.prototype.setSupplierText = function (oAlternativePartItem) {
		var sStatusText = this.getText("SupplierAlternativePartsText", [oAlternativePartItem.Supplier, oAlternativePartItem.SupplierName]);
		return sStatusText;
	};
	/**
	 * Load and open popover.
	 * @return {Promise|sap.m.Dialog} Promise object | Dialog control
	 * @public
	 */
	AlternativeParts.prototype.loadDialog = function () {
		if (!this.oAlternativeParts) {
			return Fragment.load({
				name: "vwks.nlp.s2p.mm.pctrcentral.manage.changes.fragments.AlternativePartsDialog",
				controller: this
			}).then(function (oDialog) {
				this.oAlternativeParts = oDialog;

				this._oView.addDependent(this.oAlternativeParts);
				this.oAlternativeParts.open();
				return oDialog;
			}.bind(this));
		} else {
			this.oAlternativeParts.open();
			return Promise.resolve();
		}
	};

	/**
	 * Set loaded data to the popover model.
	 * @param {object} oAlternativeParts Alternative Parts data
	 * @public
	 */
	AlternativeParts.prototype.setDialogData = function (oAlternativeParts) {
		this.oAlternativePartsModel = new JSONModel();
		oAlternativeParts.HeaderMaterialDesc = "";
		oAlternativeParts.AlternativePartsCheck = "";
		if (oAlternativeParts.results[0]) {
			oAlternativeParts.HeaderMaterialDesc = this.getText("ContractMaterialAlternativePartsText", [oAlternativeParts.results[0].Header_Material,
				oAlternativeParts.results[0].Header_MaterialDesc
			]);
			oAlternativeParts.AlternativePartsCheck = oAlternativeParts.results[0].Alternative_Parts_Check;
		}
		this.oAlternativePartsModel.setData(oAlternativeParts);
		this.oAlternativeParts.setModel(this.oAlternativePartsModel, "alternativePartsModel");
		this.oAlternativePartsModel.refresh();
	};

	/**
	 * Return Promise that requests Alternative Parts data.
	 * @param {sap.ui.model.Context} oDistrLineContext Distribution Line context
	 * @param {string} sCurrentView string parameter to differ between item and distribution header
	 * @return {Promise} Promise object
	 * @public
	 */
	AlternativeParts.prototype.loadAlternativeParts = function (oDistrLineContext, sCurrentView) {
		return new Promise(function (resolve, reject) {
			var sPath = Constants.FUNCTION_IMPORT.ALTERNATIVE_PARTS_POPUP;
			var oDistrLineData = oDistrLineContext.getObject();
			var sMaterial;
			if (sCurrentView === Constants.VIEW_ID.HIERARCHY_DISTRIBUTION) {
				sMaterial = oDistrLineData.Material;
			} else if (sCurrentView === Constants.VIEW_ID.HIERARCHY_ITEM) {
				sMaterial = oDistrLineData.PurchasingCentralMaterial;
			} else if (sCurrentView === Constants.VIEW_ID.ITEM) {
				sMaterial = oDistrLineData.PurchasingCentralMaterial;
			} else if (sCurrentView === Constants.VIEW_ID.DISTRIBUTION) {
				sMaterial = oDistrLineData.Material;
			}

			this._oView.getModel().callFunction(sPath, {
				method: "GET",
				urlParameters: {
					"Contract": oDistrLineData.CentralPurchaseContract,
					"Material": sMaterial,
					"Plant": oDistrLineData.Plant
				},
				success: function (oData) {
					resolve(oData);
				},
				error: function (oError) {
					reject(oError);
				}
			});
		}.bind(this));
	};

	AlternativeParts.prototype.onDialogClose = function () {
		this.oAlternativeParts.close();
		this.oAlternativeParts.destroy();
		this.oAlternativeParts = null;
		this.oAlternativePartsModel.destroy();
	};

	AlternativeParts.prototype.onCentralPurchaseContractPress = function (oEvent) {
		var oAltPartsCtx = oEvent.getSource().getBindingContext("alternativePartsModel").getObject();
		var sContractType = oAltPartsCtx.ContractType;
		var sContractEntitySet;

		if (sContractType === Constants.ALTERNATIVEPART_CONTRACTTYPE.HIERARCHY_CONTRACT) { 
			sContractEntitySet = "C_CntrlPurContrHierHdrTP"; //Hierarchy Contract 
		} else {
			sContractEntitySet = "C_CentralPurchaseContractTP"; // Brand Contract 
		}

		var sContractHeader = this._oView.getModel().createKey(sContractEntitySet, {
			CentralPurchaseContract: oAltPartsCtx.CentralPurchaseContract.split("/")[0],
			DraftUUID: ReuseConstants.INITIAL_GUID,
			IsActiveEntity: true
		});
		var sContractItem = this._oView.getModel().createKey("C_CntrlPurchaseContractItemTP", {
			CentralPurchaseContractItem: oAltPartsCtx.CentralContractItem,
			CentralPurchaseContract: oAltPartsCtx.CentralPurchaseContract.split("/")[0],
			DraftUUID: ReuseConstants.INITIAL_GUID,
			IsActiveEntity: true
		});
		var sRequiredUrl = sContractHeader + "/to_CntrlPurchaseContractItemTP(" + sContractItem.split("(")[1];

		//Get path for navigation
		NavigationHelper.getNavigationPath(this._oController, "MCPC", sRequiredUrl, null, false)
			.then(function (oNavigationDetails) {
				//Open in new window
				NavigationHelper.navigateWithURLHelper(oNavigationDetails.sPath, true);
			});
	};

	AlternativeParts.prototype.onSupplierPress = function (oEvent) {
		var sSupplier = oEvent.getSource().getBindingContext("alternativePartsModel").getObject("Supplier");

		var oParams = {
			Supplier: sSupplier
		};

		// Navigate to Supplier
		NavigationHelper.navigateToOutboundTarget(this._oController, "Supplier", oParams, true);

	};

	AlternativeParts.prototype.getTableLineStatusColor = function (oAlternativePartItem) {
		var sStatusColor = ValueState.None;
		if (oAlternativePartItem.OutdatedFlag) {
			sStatusColor = ValueState.Error;
		} else if (oAlternativePartItem.InactiveFlag) {
			sStatusColor = ValueState.Warning;
		} else if (!oAlternativePartItem.OutdatedFlag && !oAlternativePartItem.InactiveFlag) {
			sStatusColor = ValueState.Success;
		}
		return sStatusColor;
	};

	AlternativeParts.prototype.getTableLineStatusText = function (oAlternativePartItem) {
		var sStatusText = "";
		if (oAlternativePartItem.OutdatedFlag) {
			sStatusText = this.getText("Outdated");
		} else if (oAlternativePartItem.InactiveFlag) {
			sStatusText = this.getText("Inactive");
		} else if (!oAlternativePartItem.OutdatedFlag && !oAlternativePartItem.InactiveFlag) {
			sStatusText = this.getText("Active");
		}
		return sStatusText;
	};

	AlternativeParts.prototype.getTableLineStatusTooltip = function (oAlternativePartItem) {
		var sFlag = "";
		if (oAlternativePartItem.OutdatedFlag) {
			sFlag = this.getText("Outdated");
		} else if (oAlternativePartItem.InactiveFlag) {
			return this.getText("AlternativePartOtherPlantTooltip");
		} else if (!oAlternativePartItem.OutdatedFlag && !oAlternativePartItem.InactiveFlag) {
			return this.getText("AlternativePartCurrentPlantTooltip");
		}
		return sFlag ? this.getText("AlternativePartStatusTooltip", sFlag) : "";
	};

	AlternativeParts.prototype.getText = function (sKey, oArgs) {
		return this._oView.getModel("i18n|sap.suite.ui.generic.template.ObjectPage|C_CntrlPurContrItmCndnAmountTP").getResourceBundle().getText(
			sKey, oArgs);
	};
	return AlternativeParts;
});