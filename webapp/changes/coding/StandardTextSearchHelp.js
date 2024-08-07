sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/Fragment",
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"vwks/nlp/s2p/mm/pctrcentral/manage/changes/utils/Formatter",
	"vwks/nlp/s2p/mm/pctrcentral/manage/changes/utils/Constants",
	"sap/ui/model/Sorter"
], function (JSONModel, Fragment, MessageBox, MessageToast, Formatter, Constants, Sorter) {
	"use strict";

	var ImportStnText = function (oView, oResourceBundle) {
		this._oView = oView;
		this._oDataModel = oView.getModel();
		this._oResourceBundle = oResourceBundle;
	};

	/**
	 * Set or unset popover busy state.
	 * @param {boolean} bBusy true - set busy state, false - remove busy state
	 * @public
	 */
	ImportStnText.prototype.setBusy = function (bBusy) {
		this.oStandardTextSH.setBusy(bBusy);
	};

	/**
	 * Load and open popover.
	 * @param {sap.m.Button} oImportStnTextBtn pressed button
	 * @return {Promise} Promise object
	 * @public
	 */
	ImportStnText.prototype.open = function (oImportStnTextBtn) {
		var headerViewId =
			"ui.s2p.mm.pur.central.ctr.sts1::sap.suite.ui.generic.template.ObjectPage.view.Details::C_CentralPurchaseContractTP";
		var hierarchyHeaderViewId =
			"ui.s2p.mm.pur.central.ctr.sts1::sap.suite.ui.generic.template.ObjectPage.view.Details::C_CntrlPurContrHierHdrTP";
		var itemViewId =
			"ui.s2p.mm.pur.central.ctr.sts1::sap.suite.ui.generic.template.ObjectPage.view.Details::C_CntrlPurchaseContractItemTP";
		var hierarchyItemViewId =
			"ui.s2p.mm.pur.central.ctr.sts1::sap.suite.ui.generic.template.ObjectPage.view.Details::C_CntrlPurContrHierItemTP";
		if (!this.oStandardTextSH) {
			return Fragment.load({
				id: "idImportStandardTextFragment",
				name: "vwks.nlp.s2p.mm.pctrcentral.manage.changes.fragments.StandardTextSearchHelp",
				controller: this
			}).then(function (oDialog) {
				this.oStandardTextSH = oDialog;
				this.oStandardTextSHModel = new JSONModel();
				this.oStandardTextSH.setModel(this.oStandardTextSHModel, "standardTextModel");
				this._oView.addDependent(this.oStandardTextSH);
				var oSmartFilterBar = Fragment.byId("idImportStandardTextFragment", "idSmartFilterBar");
				var oSmartTable = Fragment.byId("idImportStandardTextFragment", "idStdTextSmartTable");
				if (this._oView.getId() === headerViewId || this._oView.getId() === hierarchyHeaderViewId) {
					oSmartFilterBar.setEntitySet("xVWKSxNLP_CCTR_C_NTE_DTLS");
					oSmartTable.setEntitySet("xVWKSxNLP_CCTR_C_NTE_DTLS");
				} else {
					oSmartFilterBar.setEntitySet("xVWKSxNLP_CCTR_C_ITMNTE_DTLS");
					oSmartTable.setEntitySet("xVWKSxNLP_CCTR_C_ITMNTE_DTLS");
				}
				switch (this._oView.getId()) {
				case headerViewId:
					oSmartFilterBar.setPersistencyKey("StdTextPersistencyHeaderKey");
					break;
				case itemViewId:
					oSmartFilterBar.setPersistencyKey("StdTextPersistencyItemKey");
					break;
				case hierarchyHeaderViewId:
					oSmartFilterBar.setPersistencyKey("StdTextPersistencyHieHeaderKey");
					break;
				case hierarchyItemViewId:
					oSmartFilterBar.setPersistencyKey("StdTextPersistencyHieItemKey");
					break;
				}
				this.oStandardTextSH.open();
				return oDialog;
			}.bind(this));
		} else {
			this.oStandardTextSH.open(oImportStnTextBtn);
			this.oStandardTextSHModel.setData();
			return Promise.resolve();
		}
	};

	/**
	 * 'Favorite' icon press event handler.
	 * @param {sap.ui.base.Event} oEvent press event object
	 * @public
	 */
	ImportStnText.prototype.onFavoritePress = function (oEvent) {
		this.setBusy(true);
		this.oFavIcon = oEvent.getSource();
		var oStdTextObject = oEvent.getSource().getBindingContext().getObject();
		var IsFavorite = oStdTextObject.Favorite;
		var sFavOption = "";
		if (IsFavorite) {
			// remove from favorite list    
			sFavOption = Constants.FAV_LIST.REMOVE;
		} else {
			// add to favorite list 
			sFavOption = Constants.FAV_LIST.ADD;
		}

		this._oView.getModel().callFunction(Constants.FUNCTION_IMPORT.STD_TEXT_FAV_PREVIEW, {
			method: "POST",
			urlParameters: {
				"Language": oStdTextObject.Language,
				"Note_Type": oStdTextObject.NoteType,
				"Option": sFavOption,
				"Text_id": oStdTextObject.TextType,
				"Text_name": oStdTextObject.TextName
			},
			success: this.handleFavSuccess.bind(this),
			error: this.handleFavError.bind(this)

		});
	};

	/*
	 * Event handler for Favorite functionality success
	 * @param {event} oData - success result
	 * @param {event} oResponse - success response
	 */
	ImportStnText.prototype.handleFavSuccess = function (oData, oResponse) {
		this.setBusy(false);
		MessageToast.show(oData.Content);
		this.oStandardTextSH.getContent()[0].getContent().rebindTable(true);
	};

	/*
	 * Event handler for favorite functionality error
	 * @param {event} oError - error result
	 */
	ImportStnText.prototype.handleFavError = function (oError) {
		this.setBusy(false);
		if (oError.responseText) {
			var sErrorMsg = JSON.parse(oError.responseText).error.message.value;
			MessageBox.error(sErrorMsg);
		}
	};

	/**
	 * 'Preview' icon press event handler.
	 * @param {sap.ui.base.Event} oEvent press event object
	 * @public
	 */
	ImportStnText.prototype.onPreviewPress = function (oEvent) {
		this.setBusy(true);
		this.oPreviewIcon = oEvent.getSource();
		var oStdTextObject = oEvent.getSource().getBindingContext().getObject();
		this._oView.getModel().callFunction(Constants.FUNCTION_IMPORT.STD_TEXT_FAV_PREVIEW, {
			method: "POST",
			urlParameters: {
				"Language": oStdTextObject.Language,
				"Note_Type": oStdTextObject.NoteType,
				"Option": Constants.PREVIEW_OPTION,
				"Text_id": oStdTextObject.TextType,
				"Text_name": oStdTextObject.TextName
			},
			success: this.handlePreviewSuccess.bind(this),
			error: this.handlePreviewError.bind(this)
		});
	};

	/*
	 * Event handler for preview functionality success
	 * @param {event} oData - success result
	 * @param {event} oResponse - success response
	 */
	ImportStnText.prototype.handlePreviewSuccess = function (oData, oResponse) {
		this.setBusy(false);
		var oPreviewModel = new JSONModel(oData);
		if (!this.oStandardTextPreviewPopover) {
			return Fragment.load({
				name: "vwks.nlp.s2p.mm.pctrcentral.manage.changes.fragments.StandardTextPreviewPopover",
				id: "idStandardTextPreviewFragment",
				controller: this
			}).then(function (oPopover) {
				this.oStandardTextPreviewPopover = oPopover;
				this.standardTextPreviewPopover = Fragment.byId("idStandardTextPreviewFragment", "idStandardTextPreviewPopover");
				this.standardTextPreviewPopover.setModel(oPreviewModel, "previewModel");
				this._oView.addDependent(this.oStandardTextPreviewPopover);
				this.oStandardTextPreviewPopover.openBy(this.oPreviewIcon);
			}.bind(this));
		} else {
			this.standardTextPreviewPopover.getModel("previewModel").setData(oData);
			this.oStandardTextPreviewPopover.openBy(this.oPreviewIcon);
			return this.oStandardTextPreviewPopover;
		}
	};

	/*
	 * Event handler for preview functionality error
	 * @param {event} oError - error result
	 */
	ImportStnText.prototype.handlePreviewError = function (oError) {
		this.setBusy(false);
		if (oError.responseText) {
			var sErrorMsg = $(oError.responseText).find("message").first().text();
			MessageBox.error(sErrorMsg);
		}
	};

	/**
	 * 'Cancel' button press event handler.
	 * @public
	 */
	ImportStnText.prototype.onCancelPress = function () {
		this.oStandardTextSH.close();
		this.oStandardTextSH.destroy();
		// This is to fix duplicate id issue in fragment
		this.oStandardTextSH = undefined;
		if (this.oStandardTextPreviewPopover) {
			this.oStandardTextPreviewPopover.destroy();
			this.oStandardTextPreviewPopover = undefined;
		}
	};

	/**
	 * Event handler for table item selection change
	 * @param {sap.ui.base.Event} oEvent press event object
	 * @public
	 */
	ImportStnText.prototype.onStdTextTableSelectionChange = function (oEvent) {
		var oSelectedItems = oEvent.getSource().getSelectedItems();
		if (oSelectedItems.length > 0) {
			this._oView.getModel("propertyModel").setProperty("/bStandardTextAddBtnEnable", true);
		} else {
			this._oView.getModel("propertyModel").setProperty("/bStandardTextAddBtnEnable", false);
		}
	};

	/**
	 * 'Add' button press event handler.
	 * @param {sap.ui.base.Event} oEvent press event object
	 * @public
	 */
	ImportStnText.prototype.onAddPress = function (oEvent) {
		this.setBusy(true);
		var oStdTextTable = Fragment.byId("idImportStandardTextFragment", "idStdTextTable");
		var oBindingContext = oStdTextTable.getSelectedContexts();

		if (oStdTextTable) {
			this._oView.getModel().setDeferredGroups(["batchFunctionImport"]);
			for (var i = 0; i < oBindingContext.length; i++) {
				var oBindingObject = oBindingContext[i].getObject();
				this._oView.getModel().callFunction(Constants.FUNCTION_IMPORT.STD_TEXT_MAINTAIN_NOTES, {
					method: "POST",
					batchGroupId: "batchFunctionImport",
					urlParameters: {
						"DraftUUID": oEvent.getSource().getBindingContext().getObject().DraftUUID,
						"Language": oBindingObject.Language,
						"Note_Type": oBindingObject.NoteType,
						"Object_Type": oBindingObject.ObjectType,
						"Text_id": oBindingObject.TextType,
						"Text_name": oBindingObject.TextName
					}
				});
			}
			this._oView.getModel().submitChanges({
				batchGroupId: "batchFunctionImport",
				success: this.handleAddButtonSuccess.bind(this),
				error: this.handleAddButtonError.bind(this)
			});
		}
	};

	/*
	 * Event handler for add text functionality success
	 * @param {event} oData - success result
	 * @param {event} oResponse - success response
	 */
	ImportStnText.prototype.handleAddButtonSuccess = function (oData, oResponse) {
		this.setBusy(false);
		MessageToast.show(this._oResourceBundle.getText("ImportStdTextSuccessMsg"));
		this.onCancelPress();
		//refreshing whole Notes component
		//Brand Contract
		var oNotesComponent = this._oView.byId(
			"ui.s2p.mm.pur.central.ctr.sts1::sap.suite.ui.generic.template.ObjectPage.view.Details::C_CentralPurchaseContractTP--sap.nw.core.gbt.notes.lib.reuse.notes4smarttemplate::header::Notes::ComponentContainer"
		);
		var oItemNotesComponent = this._oView.byId(
			"ui.s2p.mm.pur.central.ctr.sts1::sap.suite.ui.generic.template.ObjectPage.view.Details::C_CntrlPurchaseContractItemTP--sap.nw.core.gbt.notes.lib.reuse.notes4smarttemplate::item::Notes::ComponentContainer"
		);
		if (oNotesComponent) {
			oNotesComponent.getComponentInstance().load(true);
		}
		if (oItemNotesComponent) {
			oItemNotesComponent.getComponentInstance().load(true);
		}

		//Hierarchy Contract
		var oHierNotesComponent = this._oView.byId(
			"ui.s2p.mm.pur.central.ctr.sts1::sap.suite.ui.generic.template.ObjectPage.view.Details::C_CntrlPurContrHierHdrTP--sap.nw.core.gbt.notes.lib.reuse.notes4smarttemplate::header::Notes::ComponentContainer"
		);
		var oHierItemNotesComponent = this._oView.byId(
			"ui.s2p.mm.pur.central.ctr.sts1::sap.suite.ui.generic.template.ObjectPage.view.Details::C_CntrlPurContrHierItemTP--sap.nw.core.gbt.notes.lib.reuse.notes4smarttemplate::item::Notes::ComponentContainer"
		);
		if (oHierNotesComponent) {
			oHierNotesComponent.getComponentInstance().load(true);
		}
		if (oHierItemNotesComponent) {
			oHierItemNotesComponent.getComponentInstance().load(true);
		}
	};

	/*
	 * Event handler for add text functionality error
	 * @param {event} oError - error result
	 */
	ImportStnText.prototype.handleAddButtonError = function (oError) {
		this.setBusy(false);
		if (oError.responseText) {
			var sErrorMsg = $(oError.responseText).find("message").first().text();
			MessageBox.error(sErrorMsg);
		}
	};

	/**
	 * Event handler for rebinding table
	 * @param {sap.ui.base.Event} oEvent press event object
	 * @public
	 */
	ImportStnText.prototype.onBeforeRebindTable = function (oEvent) {
		var oBindingParams = oEvent.getParameter("bindingParams");
		//initially sort the table in Favorite descending, so the favorites will show first
		if (!oBindingParams.sorter.length) {
			oBindingParams.sorter.push(new Sorter("Favorite", true));
		}
	};
	/*
	 * Set Preview text
	 * @param {string} sPreviewText Preview text
	 * @return {string} modified preview text for no data
	 * @public
	 */
	ImportStnText.prototype.setPreviewText = function (sPreviewText) {
		var sPreviewNoText;
		if (sPreviewText === "") {
			sPreviewNoText = this._oResourceBundle.getText("NoPreviewText");
			return sPreviewNoText;
		} else {
			return sPreviewText;
		}
	};

	return ImportStnText;
});