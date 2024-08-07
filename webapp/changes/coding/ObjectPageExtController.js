/*
 * Copyright (C) 2009-2020 SAP SE or an SAP affiliate company. All rights reserved.
 * @controller Name:sap.suite.ui.generic.template.ObjectPage.view.Details,
 * @viewId:ui.s2p.mm.pur.central.ctr.sts1::sap.suite.ui.generic.template.ObjectPage.view.Details::C_CentralPurchaseContractTP
 */
sap.ui.define([
		"sap/ui/core/mvc/ControllerExtension",
		"sap/ui/model/Filter",
		"sap/ui/model/FilterType",
		"sap/ui/model/FilterOperator",
		"sap/ui/model/json/JSONModel",
		"sap/ui/core/format/NumberFormat",
		"sap/ui/core/Fragment",
		"sap/m/Text",
		"sap/m/MessageToast",
		"sap/m/MessageBox",
		"sap/m/Label",
		"sap/m/ColumnListItem",
		"sap/m/FormattedText",
		"vwks/nlp/s2p/mm/pctrcentral/manage/changes/utils/Formatter",
		"vwks/nlp/s2p/mm/pctrcentral/manage/changes/utils/Constants",
		"vwks/nlp/s2p/mm/pctrcentral/manage/changes/coding/StandardTextSearchHelp",
		"vwks/nlp/s2p/mm/pctrcentral/manage/changes/coding/AlternativeParts",
		"vwks/nlp/s2p/mm/reuse/lib/supplierStatus/SupplierStatuses",
		"vwks/nlp/s2p/mm/reuse/lib/util/Formatter",
		"vwks/nlp/s2p/mm/reuse/lib/util/NavigationHelper",
		"vwks/nlp/s2p/mm/reuse/lib/util/Constants",
		"sap/ui/core/Item"
	],
	function (
		ControllerExtension,
		Filter,
		FilterType,
		FilterOperator,
		JSONModel,
		NumberFormat,
		Fragment,
		Text,
		MessageToast,
		MessageBox,
		Label,
		ColumnListItem,
		FormattedText,
		Formatter,
		Constants,
		StandardTextSearchHelp,
		AlternativeParts,
		SupplierStatuses,
		ReuseFormatter,
		NavigationHelper,
		ReuseConstants,
		Item
	) {
		"use strict";
		return ControllerExtension.extend("vwks.nlp.s2p.mm.pctrcentral.manage.ObjectPageExt", {
			override: {
				/**
				 * Extending onInit life cycle method in adaptation app
				 */
				onInit: function () {
					var oView = this.getView();
					var oController = oView.getController();
					//Set Current view references
					this._setCurrentViewReferences(oView, oController);
					//Set Resource Models
					this._setResourceBundle(oController);

					oController.extensionAPI.attachPageDataLoaded(this.handlePageDataLoaded.bind(this));
					//Set distribution table personalization for ignore columns
					this._distributionTablePersonalization();
					if (this._sCurrentView === Constants.VIEW_ID.DISTRIBUTION || this._sCurrentView === Constants.VIEW_ID.HIERARCHY_DISTRIBUTION) {
						oController.extensionAPI.attachPageDataLoaded(this.checkAndEnableDemandManagement.bind(this));

					}
					this.oSupplierStatuses = new SupplierStatuses(oView, this._oResourceBundle);
					this.oStandardTextSH = new StandardTextSearchHelp(oView, this._oResourceBundle);
					this.oAlternativeParts = new AlternativeParts(oView, oController, this._oResourceBundle);

					if (this._sCurrentView === Constants.VIEW_ID.ITEM || this._sCurrentView === Constants.VIEW_ID.HIERARCHY_ITEM) {
						oController.extensionAPI.attachPageDataLoaded(this.checkAndEnableZsb.bind(this));
						//Zsb Reference table
						this.oZsbRefPlantComboBox = this.byId("idRefPlantComboBox");
						this.oZsbRefTable = this.byId("idZsbReferencesSmartTable");
					}

					// Array to keep track of selected/ Deslected nodes to stop reusion
					this._aRemovedTreeSelectionInterval = [];
					this._aPreviousTreeSelectionInterval = [];
					// create a model for distribution VH
					this._initializeModel();

					this._initalizePaymentShippingIncoTerms();

					var oPropertyModel = this._createPropertyModel();
					this.getView().setModel(oPropertyModel, "propertyModel");
					//Attach Events to Output Management Component	
					this._attachOutputManagementComponentEvents();
				},

				/**
				 * Extending life cycle method in adaptation app
				 */
				onAfterRendering: function () {
					this._setSubordinateAndDistRequestedFields();
					this._attachHeaderAndItemContractEvents();
					this._setNetPriceLabel();
				}
			},

			/**
			 * The function is to identify current view
			 * @param {object} oView is the view reference
			 * @param {object} oController is the controller reference
			 **/
			_setCurrentViewReferences: function (oView, oController) {
				this.oSubordCCTRTable = this.base.byId(
					"ui.s2p.mm.pur.central.ctr.sts1::sap.suite.ui.generic.template.ObjectPage.view.Details::C_CntrlPurContrHierHdrTP--SubordCntrlContr::responsiveTable"
				);

				var headerViewId =
					"ui.s2p.mm.pur.central.ctr.sts1::sap.suite.ui.generic.template.ObjectPage.view.Details::C_CentralPurchaseContractTP";
				var itemViewId =
					"ui.s2p.mm.pur.central.ctr.sts1::sap.suite.ui.generic.template.ObjectPage.view.Details::C_CntrlPurchaseContractItemTP";
				var distributionViewId =
					"ui.s2p.mm.pur.central.ctr.sts1::sap.suite.ui.generic.template.ObjectPage.view.Details::C_CntrlPurContrDistributionTP";
				var headerDistributionViewId =
					"ui.s2p.mm.pur.central.ctr.sts1::sap.suite.ui.generic.template.ObjectPage.view.Details::C_CntrlPurContrHdrDistrTP";
				var hierarchyHeaderViewId =
					"ui.s2p.mm.pur.central.ctr.sts1::sap.suite.ui.generic.template.ObjectPage.view.Details::C_CntrlPurContrHierHdrTP";
				var hierarchyItemViewId =
					"ui.s2p.mm.pur.central.ctr.sts1::sap.suite.ui.generic.template.ObjectPage.view.Details::C_CntrlPurContrHierItemTP";
				var hierarchyDistributionViewId =
					"ui.s2p.mm.pur.central.ctr.sts1::sap.suite.ui.generic.template.ObjectPage.view.Details::C_CntrlPurContrHierItemDistrTP";
				var hierarchyHeaderDistributionViewId =
					"ui.s2p.mm.pur.central.ctr.sts1::sap.suite.ui.generic.template.ObjectPage.view.Details::C_CntrlPurContrHierHdrDistrTP";

				oController.getOwnerComponent().getModel().attachBatchRequestCompleted(this.onODataBatchRequestCompleted.bind(this));
				this.uiModel = oController.getOwnerComponent().getModel("ui");
				switch (oView.getId()) {
				case headerViewId:
					this._sCurrentView = Constants.VIEW_ID.HEADER;
					break;
				case itemViewId:
					this._sCurrentView = Constants.VIEW_ID.ITEM;
					break;
				case distributionViewId:
					this._sCurrentView = Constants.VIEW_ID.DISTRIBUTION;
					break;
				case headerDistributionViewId:
					this._sCurrentView = Constants.VIEW_ID.HEADER_DISTRIBUTION;
					break;
				case hierarchyHeaderViewId:
					this._sCurrentView = Constants.VIEW_ID.HIERARCHY_HEADER;
					break;
				case hierarchyItemViewId:
					this._sCurrentView = Constants.VIEW_ID.HIERARCHY_ITEM;
					break;
				case hierarchyDistributionViewId:
					this._sCurrentView = Constants.VIEW_ID.HIERARCHY_DISTRIBUTION;
					break;
				case hierarchyHeaderDistributionViewId:
					this._sCurrentView = Constants.VIEW_ID.HIERARCHY_HEADER_DISTRIBUTION;
					break;
				default:
					this._sCurrentView = "";
				}
			},

			/**
			 * The function is to create property model used at different level
			 * @returns {sap.ui.model.json.JSONModel} JSONModel object
			 **/
			_createPropertyModel: function () {
				return new JSONModel({
					bCopyButtonEnable: false,
					bDemandManagementSectionVisible: false,
					bStandardTextAddBtnEnable: false,
					bUpdatedRetriggerBtnVisible: false,
					bDeleteLineBtnEnable: true,
					bManualRMSDeleteBtnEnable: true,
					bZsbCompPriceColumn: false,
					bZsbCompConvertedPriceColumn: false
				});
			},

			/**
			 * Attach events for Payment, Shipping and Incoterms
			 **/
			_initalizePaymentShippingIncoTerms: function () {
				this.oPaymentTermsInput = this.base.byId(
					"ui.s2p.mm.pur.central.ctr.sts1::sap.suite.ui.generic.template.ObjectPage.view.Details::C_CentralPurchaseContractTP--com.sap.vocabularies.UI.v1.FieldGroup::PaymentTerms::PaymentTerms::Field"
				);
				this.oIncotermInput = this.base.byId(
					"ui.s2p.mm.pur.central.ctr.sts1::sap.suite.ui.generic.template.ObjectPage.view.Details::C_CentralPurchaseContractTP--com.sap.vocabularies.UI.v1.FieldGroup::IncoTerms::IncotermsClassification::Field"
				);
				this.oShippingInstructionInput = this.base.byId(
					"ui.s2p.mm.pur.central.ctr.sts1::sap.suite.ui.generic.template.ObjectPage.view.Details::C_CentralPurchaseContractTP--com.sap.vocabularies.UI.v1.FieldGroup::IncoTerms::ShippingInstruction::Field"
				);
				this.oPaymentTermsInputHier = this.base.byId(
					"ui.s2p.mm.pur.central.ctr.sts1::sap.suite.ui.generic.template.ObjectPage.view.Details::C_CntrlPurContrHierHdrTP--com.sap.vocabularies.UI.v1.FieldGroup::PaymentTerms::PaymentTerms::Field"
				);
				this.oIncotermInputHier = this.base.byId(
					"ui.s2p.mm.pur.central.ctr.sts1::sap.suite.ui.generic.template.ObjectPage.view.Details::C_CntrlPurContrHierHdrTP--com.sap.vocabularies.UI.v1.FieldGroup::IncoTerms::IncotermsClassification::Field"
				);
				this.oShippingInstructionInputHier = this.base.byId(
					"ui.s2p.mm.pur.central.ctr.sts1::sap.suite.ui.generic.template.ObjectPage.view.Details::C_CntrlPurContrHierHdrTP--com.sap.vocabularies.UI.v1.FieldGroup::IncoTerms::ShippingInstruction::Field"
				);
				if (this.oPaymentTermsInput || this.oIncotermInput || this.oShippingInstructionInput) {
					this.oPaymentTermsInput.attachChange(this.onInputChanged.bind(this));
					this.oIncotermInput.attachChange(this.onInputChanged.bind(this));
					this.oShippingInstructionInput.attachChange(this.onInputChanged.bind(this));
				}
				if (this.oPaymentTermsInputHier || this.oIncotermInputHier || this.oShippingInstructionInputHier) {
					this.oPaymentTermsInputHier.attachChange(this.onInputChanged.bind(this));
					this.oIncotermInputHier.attachChange(this.onInputChanged.bind(this));
					this.oShippingInstructionInputHier.attachChange(this.onInputChanged.bind(this));
				}
			},
			/**
			 * Get the ResourceBundle from its name
			 * @param {object} oController is the controller reference
			 **/
			_setResourceBundle: function (oController) {
				var oi18nModel = oController.getOwnerComponent().getModel("i18n");
				if (oi18nModel) {
					this._oResourceBundle = oi18nModel.getResourceBundle();
				}
				var oDistri18nModel = oController.getOwnerComponent().getModel(
					"i18n|sap.suite.ui.generic.template.ObjectPage|C_CntrlPurContrItmCndnAmountTP");
				if (oDistri18nModel) {
					this._oDistri18nModelResourceBundle = oDistri18nModel.getResourceBundle();
				}
				var oPCIi18nModel = oController.getOwnerComponent().getModel(
					"i18n|sap.suite.ui.generic.template.ObjectPage|C_CntrlPurchaseContractItemTP");
				if (oPCIi18nModel) {
					this._oPCIResourceBundle = oPCIi18nModel.getResourceBundle();
				}
				//C_CntrlPurchaseContractItemTP i18n Resource model
				var oCntrlPCItemi18nModel = oController.getOwnerComponent().getModel(
					"i18n|sap.suite.ui.generic.template.ObjectPage|C_CntrlPurchaseContractItemTP");
				if (oCntrlPCItemi18nModel) {
					this._oCntrlPCItemResourceBundle = oCntrlPCItemi18nModel.getResourceBundle();
				}
			},

			/**
			 * The function is to attach events to output management component
			 **/
			_attachOutputManagementComponentEvents: function () {
				var outputManagementComponent = this.base.byId(
					"ui.s2p.mm.pur.central.ctr.sts1::sap.suite.ui.generic.template.ObjectPage.view.Details::C_CentralPurchaseContractTP--OutputManagementComponentContainer"
				);
				if (outputManagementComponent) {
					var ouiArea = outputManagementComponent.getComponentInstance().getRootControl();
					this._outputControlSmartTable = ouiArea.getContent()[0].getItems()[0];
					if (this._outputControlSmartTable) {
						this._outputControlSmartTable.attachEvent("beforeRebindTable", this._onBeforeRebindOutputControlTable.bind(this));
					}
				}
			},

			/**
			 * The function sets the personalization for hierarchy and brand distribution table
			 **/
			_distributionTablePersonalization: function () {
				if (this._sCurrentView === Constants.VIEW_ID.ITEM || this._sCurrentView === Constants.VIEW_ID.HIERARCHY_ITEM) {
					//Distribution table
					this.oDistributionTable = this.base.byId(
						"ui.s2p.mm.pur.central.ctr.sts1::sap.suite.ui.generic.template.ObjectPage.view.Details::C_CntrlPurchaseContractItemTP--itemDistribution::Table"
					);
					this.oHierDistributionTable = this.base.byId(
						"ui.s2p.mm.pur.central.ctr.sts1::sap.suite.ui.generic.template.ObjectPage.view.Details::C_CntrlPurContrHierItemTP--HctrItemDistribution::Table"
					);
				}

				this._oHierItemDistrTable = this.base.byId(
					"ui.s2p.mm.pur.central.ctr.sts1::sap.suite.ui.generic.template.ObjectPage.view.Details::C_CntrlPurContrHierItemTP--HctrItemDistribution::responsiveTable"
				);
				this._oHierHdrDistrTable = this.base.byId(
					"ui.s2p.mm.pur.central.ctr.sts1::sap.suite.ui.generic.template.ObjectPage.view.Details::C_CntrlPurContrHierHdrTP--to_CntrlPurContrHdrDistrTP::com.sap.vocabularies.UI.v1.LineItem::responsiveTable"
				);

				var aIgnoreFromPersonalisationFields = [
					"PurchaseRequisition,ProcmtHubPurchaseRequisition,PredecessorDocument,SourcingProjectItem,ProcmtHubPurRequisitionItem,PurchaseRequisitionItem,SourcingProjectItemUUID,SourcingProjectUUID"
				];
				if (this.oDistributionTable) {
					if (this.oDistributionTable.getIgnoreFromPersonalisation() !== "") {
						this.oDistributionTable.setIgnoreFromPersonalisation(this.oDistributionTable.getIgnoreFromPersonalisation() + "," +
							aIgnoreFromPersonalisationFields);
					} else {
						this.oDistributionTable.setIgnoreFromPersonalisation(aIgnoreFromPersonalisationFields);
					}
				}
				if (this.oHierDistributionTable) {
					if (this.oHierDistributionTable.getIgnoreFromPersonalisation() !== "") {
						this.oHierDistributionTable.setIgnoreFromPersonalisation(this.oHierDistributionTable.getIgnoreFromPersonalisation() + "," +
							aIgnoreFromPersonalisationFields);
					} else {
						this.oHierDistributionTable.setIgnoreFromPersonalisation(aIgnoreFromPersonalisationFields);
					}
				}
			},

			/**
			 * Setting label of Net Price field
			 */
			_setNetPriceLabel: function () {
				var oNetPriceLabel = this.base.byId(
					"ui.s2p.mm.pur.central.ctr.sts1::sap.suite.ui.generic.template.ObjectPage.view.Details::C_CntrlPurchaseContractItemTP--OrderQuantity::ContractNetPriceAmount::Field-label"
				);
				var oHierNetPriceLabel = this.base.byId(
					"ui.s2p.mm.pur.central.ctr.sts1::sap.suite.ui.generic.template.ObjectPage.view.Details::C_CntrlPurContrHierItemTP--HierOrderQuantity::ContractNetPriceAmount::Field-label"
				);
				if (oNetPriceLabel) {
					oNetPriceLabel.setText(this._oResourceBundle.getText("BasePriceLabel"));
				}
				if (oHierNetPriceLabel) {
					oHierNetPriceLabel.setText(this._oResourceBundle.getText("BasePriceLabel"));
				}
			},
			/**
			 * Attaching event on header and item level field change
			 */
			_attachHeaderAndItemContractEvents: function () {
				this.headerPageId =
					"ui.s2p.mm.pur.central.ctr.sts1::sap.suite.ui.generic.template.ObjectPage.view.Details::C_CentralPurchaseContractTP";
				this.itemPageId =
					"ui.s2p.mm.pur.central.ctr.sts1::sap.suite.ui.generic.template.ObjectPage.view.Details::C_CntrlPurchaseContractItemTP";

				//Header level field changes
				//Document Type
				var oDocumentType = this.base.byId(
					this.headerPageId + "--com.sap.vocabularies.UI.v1.Identification::PurchaseContractType::Field"
				);
				if (oDocumentType) {
					oDocumentType.attachEvent("change", this.reloadHeaderNotesComponent.bind(this));
				}
				//Purchasing Organization
				var oPurchOrg = this.base.byId(
					this.headerPageId + "--com.sap.vocabularies.UI.v1.FieldGroup::Purchasing::PurchasingOrganization::Field"
				);
				if (oPurchOrg) {
					oPurchOrg.attachEvent("change", this.reloadHeaderNotesComponent.bind(this));
				}
				//Purchasing Group
				var oPurchGrp = this.base.byId(
					this.headerPageId + "--com.sap.vocabularies.UI.v1.FieldGroup::Purchasing::PurchasingGroup::Field"
				);
				if (oPurchGrp) {
					oPurchGrp.attachEvent("change", this.reloadHeaderNotesComponent.bind(this));
				}
				//Supplier
				var oSupplier = this.base.byId(
					this.headerPageId + "--com.sap.vocabularies.UI.v1.FieldGroup::Supplier::Supplier::Field"
				);
				if (oSupplier) {
					oSupplier.attachEvent("change", this.reloadHeaderNotesComponent.bind(this));
				}
				//Item level field changes
				//Material Group
				var oMaterialGrp = this.base.byId(
					this.itemPageId + "--Material:: MaterialGroup:: Field"
				);
				if (oMaterialGrp) {
					oMaterialGrp.attachEvent("change", this.reloadItemNotesComponent.bind(this));
				}
				//Product Type
				var oProductType = this.base.byId(
					this.itemPageId + "--Items::ProductType::Field"
				);
				if (oProductType) {
					oProductType.attachEvent("change", this.reloadItemNotesComponent.bind(this));
				}
				//Material
				var oMaterial = this.base.byId(
					this.itemPageId + "--Material::PurchasingCentralMaterial::Field"
				);
				if (oMaterial) {
					oMaterial.attachEvent("change", this.reloadItemNotesComponent.bind(this));
				}
				// attach events for Distribution table to manage 'Copy' button enabled state
				if (this._oHierHdrDistrTable) {
					this._oHierHdrDistrTable.attachSelectionChange(this.onDistributionItemSelect.bind(this));
					this._oHierHdrDistrTable.attachUpdateFinished(this.onDistributionItemSelect.bind(this));
				}
				if (this._oHierItemDistrTable) {
					this._oHierItemDistrTable.attachSelectionChange(this.onDistributionItemSelect.bind(this));
					this._oHierItemDistrTable.attachUpdateFinished(this.onDistributionItemSelect.bind(this));
				}

				if (this._sCurrentView === Constants.VIEW_ID.ITEM || this._sCurrentView === Constants.VIEW_ID.HIERARCHY_ITEM) {
					this._oRMSTableSmartTable = this.byId("idRMSTableSmartTable");
					if (this._oRMSTableSmartTable) {
						this._oRMSTableSmartTable.getTable().attachSelectionChange(this.onRMSSelectionChange.bind(this));
						this._oRMSTableSmartTable.attachDataReceived(this.onRMSSelectionChange.bind(this));
					}
				}
			},

			/**
			 * Setting request at least fields in subordinate and distribution table
			 */
			_setSubordinateAndDistRequestedFields: function () {
				// Attach the selection change event and the corresponding handler to the subordinate CCTR table
				if (this.oSubordCCTRTable) {
					var aRequestedFields = ["Status"];
					if (this.oSubordCCTRTable.getParent().getRequestAtLeastFields() !== "") {
						this.oSubordCCTRTable.getParent().setRequestAtLeastFields(this.oSubordCCTRTable.getParent().getRequestAtLeastFields() +
							"," +
							aRequestedFields);
					} else {
						this.oSubordCCTRTable.getParent().setRequestAtLeastFields(aRequestedFields);
					}

					this.oSubordCCTRTable.attachSelectionChange(this.onSubordCCTRSelectionChangeWorkflow.bind(this));
				}
				var aRequestAtLeastFields = [
					"PurchaseRequisition,ProcmtHubPurchaseRequisition,PredecessorDocument,SourcingProjectItem,ProcmtHubPurRequisitionItem,PurchaseRequisitionItem,SourcingProjectItemUUID,SourcingProjectUUID"
				];
				if (this.oDistributionTable) {
					if (this.oDistributionTable.getRequestAtLeastFields() !== "") {
						this.oDistributionTable.setRequestAtLeastFields(this.oDistributionTable.getRequestAtLeastFields() + "," +
							aRequestAtLeastFields);
					} else {
						this.oDistributionTable.setRequestAtLeastFields(aRequestAtLeastFields);
					}
				}
				if (this.oHierDistributionTable) {
					if (this.oHierDistributionTable.getRequestAtLeastFields() !== "") {
						this.oHierDistributionTable.setRequestAtLeastFields(this.oHierDistributionTable.getRequestAtLeastFields() + "," +
							aRequestAtLeastFields);
					} else {
						this.oHierDistributionTable.setRequestAtLeastFields(aRequestAtLeastFields);
					}
				}
			},

			/**
			 * Create JSON model for Distribution VH.
			 */
			_initializeModel: function () {
				this._oDistributionModel = new JSONModel({
					enableCopy: false
				});

				this.getView().setModel(this._oDistributionModel, "distributionModel");
			},

			/**
			 * PFO link press event handler.
			 * @param {sap.ui.base.Event} oEvent press event object
			 */
			onPFOLinkPress: function (oEvent) {
				var oContractHdr = this.getView().getBindingContext().getObject();
				var sActiveDocId = oContractHdr.ActivePurchasingDocument;
				var sDocType = oContractHdr.PurchasingDocumentSubtype === Constants.GROUP_CONTRACT_SUBTYPE ?
					Constants.CONTRACT_TYPE.GROUP : Constants.CONTRACT_TYPE.BRAND;

				var oParams = {
					Document: sActiveDocId,
					DocumentType: sDocType,
					SourceSystem: Constants.DEFAULT_PARAMS.SOURCE_SYSTEM,
					DocumentGuid: ReuseConstants.INITIAL_GUID
				};
				NavigationHelper.navigateToOutboundTarget(this.getView().getController(), "PFO", oParams, true);
			},
			/**
			 * This method will be called when ever batch request completed
			 * @public
			 *  @param {sap.ui.base.Event} oEvent The event object
			 **/
			onODataBatchRequestCompleted: function (oEvent) {
				var aRequests = oEvent.getParameters().requests;
				if (aRequests) {
					// handle warning messages while contract save
					var iSaveCallIndex = aRequests.findIndex(function (oResult) {
						return oResult.method === "POST" && oResult.url.startsWith("C_CntrlPurContrHierHdrTPPreparation") && oResult.success;
					});
					var bConditionDeleted = aRequests.some(function (oResult) {
						return (((oResult.method === "DELETE" || oResult.method === "MERGE") && oResult.url.startsWith("C_CPurConHierItmCmmdtyQtyTP"))) &&
							oResult.success;
					});
					if (iSaveCallIndex !== -1) {
						this.showWarningMessage(aRequests, iSaveCallIndex);
					} else if (bConditionDeleted) {
						this.refreshConditionFacet();
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
				if (aRequests[iIndex].response.headers["sap-message"] && JSON.parse(aRequests[iIndex].response.headers["sap-message"])) {
					var oHdrMessage = JSON.parse(aRequests[iIndex].response.headers["sap-message"]);
					if (oHdrMessage.severity === Constants.MESSAGE_SEVERITY.WARNING) {
						var sCancelWarningMessage = oHdrMessage.message;
						MessageBox.warning(sCancelWarningMessage, {
							actions: MessageBox.Action.OK
						});
					}
				}

			},
			/**
			 * Hierarchy Contract Item link in ZSB tables press event handler.
			 * @param {sap.ui.base.Event} oEvent press event object
			 */
			handleContractItemNav: function (oEvent) {
				var oItem = oEvent.getSource().getBindingContext().getObject();

				var sContractHeader = this.getView().getModel().createKey("C_CntrlPurContrHierHdrTP", {
					CentralPurchaseContract: oItem.CentralContract,
					DraftUUID: ReuseConstants.INITIAL_GUID,
					IsActiveEntity: true
				});

				var sContractItem = this.getView().getModel().createKey("C_CntrlPurContrHierItemTP", {
					CentralPurchaseContractItem: oItem.CentralContractItem,
					CentralPurchaseContract: oItem.CentralContract,
					DraftUUID: ReuseConstants.INITIAL_GUID,
					IsActiveEntity: true
				});

				var sContractItemPath = sContractHeader + "/to_CntrlPurchaseContractItemTP(" + sContractItem.split("(")[1];

				//Get path for navigation
				NavigationHelper.getNavigationPath(this.getView().getController(), "MCPC", sContractItemPath)
					.then(function (oNavigationDetails) {
						//Open in new window
						NavigationHelper.navigateWithURLHelper(oNavigationDetails.sPath, true);
					});

			},

			/**
			 * Distribution table (hierarchy or item) selection change event handler.
			 * @param {sap.ui.base.Event} oEvent event object
			 */
			onDistributionItemSelect: function (oEvent) {
				var oTable = oEvent.getSource();
				var oSelectedItem = oTable.getSelectedItem();
				this._oDistributionModel.setProperty("/enableCopy", !!oSelectedItem);
			},

			/**
			 * Adding tooltip operation for RMS Table for central purchase contract
			 */

			handleRMSTableHeaderToolTip: function () {
				var sRMS = this.base.byId(
					"ui.s2p.mm.pur.central.ctr.sts1::sap.suite.ui.generic.template.ObjectPage.view.Details::C_CntrlPurchaseContractItemTP--to_CntrlPurContrItmCmmdtyQtyTP::com.sap.vocabularies.UI.v1.LineItem::Table-PurgDocCmmdtyCode"
				);
				sRMS.getHeader().setTooltip(this._oResourceBundle.getText("RMSCondition"));
				var sRMSName = this.base.byId(
					"ui.s2p.mm.pur.central.ctr.sts1::sap.suite.ui.generic.template.ObjectPage.view.Details::C_CntrlPurchaseContractItemTP--to_CntrlPurContrItmCmmdtyQtyTP::com.sap.vocabularies.UI.v1.LineItem::Table-PurgDocCmmdtyDesc"
				);
				sRMSName.getHeader().setTooltip(this._oResourceBundle.getText("RMSName"));

			},

			/**
			 * Adding tooltip operation for RMS Table for central purchase  hierarchy contract
			 */
			handleRMSHierarchyTableToolTip: function () {
				var sRMSHierarchy = this.base.byId(
					"ui.s2p.mm.pur.central.ctr.sts1::sap.suite.ui.generic.template.ObjectPage.view.Details::C_CntrlPurContrHierItemTP--to_CntrlPurContrItmCmmdtyQtyTP::com.sap.vocabularies.UI.v1.LineItem::Table-PurgDocCmmdtyCode"
				);
				sRMSHierarchy.getHeader().setTooltip(this._oResourceBundle.getText("RMSCondition"));

				var sRMSNameHierarchy = this.base.byId(
					"ui.s2p.mm.pur.central.ctr.sts1::sap.suite.ui.generic.template.ObjectPage.view.Details::C_CntrlPurContrHierItemTP--to_CntrlPurContrItmCmmdtyQtyTP::com.sap.vocabularies.UI.v1.LineItem::Table-PurgDocCmmdtyDesc"
				);
				sRMSNameHierarchy.getHeader().setTooltip(this._oResourceBundle.getText("RMSName"));
			},

			/**
			 * Bind Document History composite control.
			 */
			bindDocumentHistory: function () {
				var oDocHistoryData = {};
				if (this._sCurrentView === Constants.VIEW_ID.HEADER || this._sCurrentView === Constants.VIEW_ID.HIERARCHY_HEADER) {
					oDocHistoryData.items = [{
						key: "H",
						text: this._oResourceBundle.getText("HeaderFilterText")
					}, {
						key: "HI",
						text: this._oResourceBundle.getText("HeaderAndItemsFilterText")
					}, {
						key: "ID",
						text: this._oResourceBundle.getText("AllItemsAndDistributionLineFilterText")
					}];
				} else if (this._sCurrentView === Constants.VIEW_ID.ITEM || this._sCurrentView === Constants.VIEW_ID.HIERARCHY_ITEM) {
					oDocHistoryData.items = [{
						key: "I",
						text: this._oResourceBundle.getText("ItemFilterText")
					}, {
						key: "HID",
						text: this._oResourceBundle.getText("HeaderAndItemAndDistributionsFilterText")
					}];
				} else if (this._sCurrentView === Constants.VIEW_ID.DISTRIBUTION || this._sCurrentView === Constants.VIEW_ID.HIERARCHY_DISTRIBUTION) {
					oDocHistoryData.items = [{
						key: "D",
						text: this._oPCIResourceBundle.getText("DistributionsFilterText")
					}, {
						key: "HID",
						text: this._oPCIResourceBundle.getText("HeaderAndItemAndDistributionFilterText")
					}];
				}

				var oDocHistoryModel = new JSONModel(oDocHistoryData);
				this.byId("idDocHistorySection").setModel(oDocHistoryModel, "docHistory");
				this.byId("idDocumentHistory").loadDocumentHistory();
			},

			/**
			 * Check if document history to be enabled 
			 * @param {sap.ui.base.Event} oEvent The event object
			 */
			handlePageDataLoaded: function (oEvent) {
				this.initInfoIcons();
				this.bindDocumentHistory();
				this.loadZsbFacets();
				if (this._sCurrentView === Constants.VIEW_ID.ITEM) {
					this.handleRMSTableHeaderToolTip();
				}
				if (this._sCurrentView === Constants.VIEW_ID.HIERARCHY_ITEM) {
					this.handleRMSHierarchyTableToolTip();
				}
				//Navigate to pricing conditions
				this.checkNavigationPricingConditions();
			},
			/**
			 * Load zsb tables on demand based on modes, load zsb reference plant filter
			 * @param {sap.ui.base.Event} oEvent The event object
			 */
			loadZsbFacets: function () {
				this._oTemplate = new Item({
					key: "{Plant}",
					text: "{Plant}"
				});
				var bIsEditable = this.uiModel.getProperty("/editable");
				if (this._sCurrentView === Constants.VIEW_ID.ITEM || this._sCurrentView === Constants.VIEW_ID.HIERARCHY_ITEM) {

					this.sZsbAnalyticalFragmentId = (this._sCurrentView === Constants.VIEW_ID.ITEM) ? "idZSBAnalyticalFragment" :
						"idHierZSBAnalyticalFragment";
					this.sZsbGridFragmentId = (this._sCurrentView === Constants.VIEW_ID.ITEM) ? "idZSBGridFragment" : "idHierZSBGridFragment";

					// if contract is in display mode, load zsb analytical table
					if (!bIsEditable) {
						if (!this.oZSBAnalyticalFragment) {
							this.oZSBAnalyticalFragment = Fragment.load({
								id: this.sZsbAnalyticalFragmentId,
								name: "vwks.nlp.s2p.mm.pctrcentral.manage.changes.fragments.ZsbAnalyticalTable",
								controller: this
							}).then(function (oFragment) {
								this.getView().addDependent(oFragment);
								this.byId("idZsbComponentLayout").insertContent(oFragment, 0);
								this.oZsbPlantComboBox = Fragment.byId(this.sZsbAnalyticalFragmentId, "idPlantComboBox");
								this.oZsbComponentTable = Fragment.byId(this.sZsbAnalyticalFragmentId, "idZsbComponentSmartTable");
								if (this.oZsbComponentTable) {
									this.oZsbAnalyticalTable = this.oZsbComponentTable.getTable();
								}
								//	bind plants dropdown with distribution lines
								this.oZsbPlantComboBox.setValue("");
								this.oZsbPlantComboBox.clearSelection();
								this.oZsbPlantComboBox.bindItems({
									path: "to_CntrlPurContrDistributionTP",
									template: this._oTemplate,
									events: {
										dataReceived: this.getPlantsData.bind(this)
									}
								});

							}.bind(this));
						}
					} else {
						//if contract is in edit mode, load zsb grid table
						if (!this.oZSBGridFragment) {
							this.oZSBGridFragment = Fragment.load({
								id: this.sZsbGridFragmentId,
								name: "vwks.nlp.s2p.mm.pctrcentral.manage.changes.fragments.ZsbGridTable",
								controller: this
							}).then(function (oFragment) {
								this.getView().addDependent(oFragment);
								this.byId("idZsbComponentLayout").insertContent(oFragment, 0);
								this.oZsbPlantComboBoxEditTable = Fragment.byId(this.sZsbGridFragmentId, "idPlantComboBoxEditTable");
								this.oZsbComponentGridSmartTable = Fragment.byId(this.sZsbGridFragmentId, "idZsbComponentSmartTableGrid");
								if (this.oZsbComponentGridSmartTable) {
									this.oZsbComponentGridTable = this.oZsbComponentGridSmartTable.getTable();
								}
								//	bind plants dropdown with distribution lines

								this.oZsbPlantComboBoxEditTable.setValue("");
								this.oZsbPlantComboBoxEditTable.clearSelection();
								this.oZsbPlantComboBoxEditTable.bindItems({
									path: "to_CntrlPurContrDistributionTP",
									template: this._oTemplate,
									events: {
										dataReceived: this.getPlantsDataEditTable.bind(this)
									}
								});
							}.bind(this));
						}
						this.handleZSBEdit();
					}

					//bind plants dropdown for zswb reference facet
					this.oZsbRefPlantComboBox.setValue("");
					this.oZsbRefPlantComboBox.clearSelection();

					this.oZsbRefPlantComboBox.bindItems({
						path: "to_CntrlPurContrDistributionTP",
						template: this._oTemplate,
						events: {
							dataReceived: this.getRefPlantsData.bind(this)
						}
					});
				}
			},
			/**
			 * Method to initialise Info Icons
			 */
			initInfoIcons: function () {
				this.initIconIds();
				var oPaymentTermsInfo, oIncotermInfo, oShippingInstructionInfo;
				switch (this._sCurrentView) {
				case Constants.VIEW_ID.HEADER:
					oPaymentTermsInfo = this.base.byId(this.sPayTermsId);
					oIncotermInfo = this.base.byId(this.sIncotermId);
					oShippingInstructionInfo = this.base.byId(this.sShippInsId);
					break;
				case Constants.VIEW_ID.ITEM:
					oIncotermInfo = this.base.byId(this.sItmIncotermId);
					oShippingInstructionInfo = this.base.byId(this.sItmShippInsId);
					break;
				case Constants.VIEW_ID.DISTRIBUTION:
					oPaymentTermsInfo = this.base.byId(this.sItmDistPayTermsId);
					oIncotermInfo = this.base.byId(this.sItmDistIncotermId);
					oShippingInstructionInfo = this.base.byId(this.sItmDistShippInsId);
					break;
				case Constants.VIEW_ID.HEADER_DISTRIBUTION:
					oPaymentTermsInfo = this.base.byId(this.sHdrDistPayTermsId);
					oIncotermInfo = this.base.byId(this.sHdrDistIncotermId);
					oShippingInstructionInfo = this.base.byId(this.sHdrDistShippInsId);
					break;
				case Constants.VIEW_ID.HIERARCHY_HEADER:
					oPaymentTermsInfo = this.base.byId(this.sHierPayTermsId);
					oIncotermInfo = this.base.byId(this.sHierIncotermId);
					oShippingInstructionInfo = this.base.byId(this.sHierShippInsId);
					break;
				case Constants.VIEW_ID.HIERARCHY_ITEM:
					oIncotermInfo = this.base.byId(this.sHierItmIncotermId);
					oShippingInstructionInfo = this.base.byId(this.sHierItmShippInsId);
					break;
				case Constants.VIEW_ID.HIERARCHY_DISTRIBUTION:
					oPaymentTermsInfo = this.base.byId(this.sHierItmDistPayTermsId);
					oIncotermInfo = this.base.byId(this.sHierItmDistIncotermId);
					oShippingInstructionInfo = this.base.byId(this.sHierItmDistShippInsId);
					break;
				case Constants.VIEW_ID.HIERARCHY_HEADER_DISTRIBUTION:
					oPaymentTermsInfo = this.base.byId(this.sHierHdrDistPayTermsId);
					oIncotermInfo = this.base.byId(this.sHierHdrDistIncotermId);
					oShippingInstructionInfo = this.base.byId(this.sHierHdrDistShippInsId);
					break;
				}
				this.setIconClass(oPaymentTermsInfo, oIncotermInfo, oShippingInstructionInfo);
			},

			/**
			 * Method to initialise Info Icons Ids
			 */
			initIconIds: function () {
				this.sPayTermsId =
					"ui.s2p.mm.pur.central.ctr.sts1::sap.suite.ui.generic.template.ObjectPage.view.Details::C_CentralPurchaseContractTP--vwks.nlp.s2p.mm.pctrcentral.manage.idPaymentTermsInfo";
				this.sHierPayTermsId =
					"ui.s2p.mm.pur.central.ctr.sts1::sap.suite.ui.generic.template.ObjectPage.view.Details::C_CntrlPurContrHierHdrTP--vwks.nlp.s2p.mm.pctrcentral.manage.idHierPaymentTermsInfo";
				this.sItmDistPayTermsId =
					"ui.s2p.mm.pur.central.ctr.sts1::sap.suite.ui.generic.template.ObjectPage.view.Details::C_CntrlPurContrDistributionTP--vwks.nlp.s2p.mm.pctrcentral.manage.idItmDistPaymentTermsInfo";
				this.sHdrDistPayTermsId =
					"ui.s2p.mm.pur.central.ctr.sts1::sap.suite.ui.generic.template.ObjectPage.view.Details::C_CntrlPurContrHdrDistrTP--vwks.nlp.s2p.mm.pctrcentral.manage.idHdrDistPaymentTermsInfo";
				this.sHierItmDistPayTermsId =
					"ui.s2p.mm.pur.central.ctr.sts1::sap.suite.ui.generic.template.ObjectPage.view.Details::C_CntrlPurContrHierItemDistrTP--vwks.nlp.s2p.mm.pctrcentral.manage.idHierItmDistPaymentTermsInfo";
				this.sHierHdrDistPayTermsId =
					"ui.s2p.mm.pur.central.ctr.sts1::sap.suite.ui.generic.template.ObjectPage.view.Details::C_CntrlPurContrHierHdrDistrTP--vwks.nlp.s2p.mm.pctrcentral.manage.idHierHdrDistPaymentTermsInfo";
				this.sIncotermId =
					"ui.s2p.mm.pur.central.ctr.sts1::sap.suite.ui.generic.template.ObjectPage.view.Details::C_CentralPurchaseContractTP--vwks.nlp.s2p.mm.pctrcentral.manage.idIncotermInfo";
				this.sHierIncotermId =
					"ui.s2p.mm.pur.central.ctr.sts1::sap.suite.ui.generic.template.ObjectPage.view.Details::C_CntrlPurContrHierHdrTP--vwks.nlp.s2p.mm.pctrcentral.manage.idHierIncotermInfo";
				this.sItmDistIncotermId =
					"ui.s2p.mm.pur.central.ctr.sts1::sap.suite.ui.generic.template.ObjectPage.view.Details::C_CntrlPurContrDistributionTP--vwks.nlp.s2p.mm.pctrcentral.manage.idItmDistIncotermInfo";
				this.sHdrDistIncotermId =
					"ui.s2p.mm.pur.central.ctr.sts1::sap.suite.ui.generic.template.ObjectPage.view.Details::C_CntrlPurContrHdrDistrTP--vwks.nlp.s2p.mm.pctrcentral.manage.idHdrDistIncotermInfo";
				this.sHierItmDistIncotermId =
					"ui.s2p.mm.pur.central.ctr.sts1::sap.suite.ui.generic.template.ObjectPage.view.Details::C_CntrlPurContrHierItemDistrTP--vwks.nlp.s2p.mm.pctrcentral.manage.idHierItmDistIncotermInfo";
				this.sHierHdrDistIncotermId =
					"ui.s2p.mm.pur.central.ctr.sts1::sap.suite.ui.generic.template.ObjectPage.view.Details::C_CntrlPurContrHierHdrDistrTP--vwks.nlp.s2p.mm.pctrcentral.manage.idHierHdrDistIncotermInfo";
				this.sItmIncotermId =
					"ui.s2p.mm.pur.central.ctr.sts1::sap.suite.ui.generic.template.ObjectPage.view.Details::C_CntrlPurchaseContractItemTP--vwks.nlp.s2p.mm.pctrcentral.manage.idItmIncotermInfo";
				this.sHierItmIncotermId =
					"ui.s2p.mm.pur.central.ctr.sts1::sap.suite.ui.generic.template.ObjectPage.view.Details::C_CntrlPurContrHierItemTP--vwks.nlp.s2p.mm.pctrcentral.manage.idHierItmIncotermInfo";
				this.sShippInsId =
					"ui.s2p.mm.pur.central.ctr.sts1::sap.suite.ui.generic.template.ObjectPage.view.Details::C_CentralPurchaseContractTP--vwks.nlp.s2p.mm.pctrcentral.manage.idShippingInstructionInfo";
				this.sHierShippInsId =
					"ui.s2p.mm.pur.central.ctr.sts1::sap.suite.ui.generic.template.ObjectPage.view.Details::C_CntrlPurContrHierHdrTP--vwks.nlp.s2p.mm.pctrcentral.manage.idHierShippingInstructionInfo";
				this.sItmDistShippInsId =
					"ui.s2p.mm.pur.central.ctr.sts1::sap.suite.ui.generic.template.ObjectPage.view.Details::C_CntrlPurContrDistributionTP--vwks.nlp.s2p.mm.pctrcentral.manage.idItmDistShippingInstructionInfo";
				this.sHdrDistShippInsId =
					"ui.s2p.mm.pur.central.ctr.sts1::sap.suite.ui.generic.template.ObjectPage.view.Details::C_CntrlPurContrHdrDistrTP--vwks.nlp.s2p.mm.pctrcentral.manage.idHdrDistShippingInstructionInfo";
				this.sHierItmDistShippInsId =
					"ui.s2p.mm.pur.central.ctr.sts1::sap.suite.ui.generic.template.ObjectPage.view.Details::C_CntrlPurContrHierItemDistrTP--vwks.nlp.s2p.mm.pctrcentral.manage.idHierItmDistShippingInstructionInfo";
				this.sHierHdrDistShippInsId =
					"ui.s2p.mm.pur.central.ctr.sts1::sap.suite.ui.generic.template.ObjectPage.view.Details::C_CntrlPurContrHierHdrDistrTP--vwks.nlp.s2p.mm.pctrcentral.manage.idHierHdrDistShippingInstructionInfo";
				this.sItmShippInsId =
					"ui.s2p.mm.pur.central.ctr.sts1::sap.suite.ui.generic.template.ObjectPage.view.Details::C_CntrlPurchaseContractItemTP--vwks.nlp.s2p.mm.pctrcentral.manage.idItmShippingInstructionInfo";
				this.sHierItmShippInsId =
					"ui.s2p.mm.pur.central.ctr.sts1::sap.suite.ui.generic.template.ObjectPage.view.Details::C_CntrlPurContrHierItemTP--vwks.nlp.s2p.mm.pctrcentral.manage.idHierItmShippingInstructionInfo";
			},

			/*
			 * Method to set Icon margin style class
			 * @param {sap.ui.core.Icon} oPaymentTermsInfo
			 * @param {sap.ui.core.Icon} oIncotermInfo
			 * @param {sap.ui.core.Icon} oShippingInstructionInfo
			 */
			setIconClass: function (oPaymentTermsInfo, oIncotermInfo, oShippingInstructionInfo) {
				var bEditable = this.uiModel.getProperty("/editable");
				if (!bEditable) {
					if (oPaymentTermsInfo) {
						oPaymentTermsInfo.removeStyleClass("sapUiTinyMarginTop");
					}
					if (oIncotermInfo) {
						oIncotermInfo.removeStyleClass("sapUiTinyMarginTop");
					}
					if (oShippingInstructionInfo) {
						oShippingInstructionInfo.removeStyleClass("sapUiTinyMarginTop");
					}
				} else {
					if (oPaymentTermsInfo) {
						oPaymentTermsInfo.addStyleClass("sapUiTinyMarginTop");
					}
					if (oIncotermInfo) {
						oIncotermInfo.addStyleClass("sapUiTinyMarginTop");
					}
					if (oShippingInstructionInfo) {
						oShippingInstructionInfo.addStyleClass("sapUiTinyMarginTop");
					}
				}
			},

			/**
			 * Handler before rebind table for ZSB component table
			 * @param {sap.ui.base.Event} oEvent The event object
			 */
			onBeforeZsbRebindTable: function (oEvent) {
				var bIsEditable = this.uiModel.getProperty("/editable");
				if (!bIsEditable) {
					var mBindingParams = oEvent.getParameter("bindingParams");
					if (mBindingParams && mBindingParams.parameters) {
						mBindingParams.parameters.entitySet = "xVWKSxNLP_CCTR_I_READ_ZSB";
					}
					if (this.aSelectedPlants) {
						var aAllPlantsFilter = this.getAllPlantsFilter(this.aSelectedPlants);
						var aFilter = this.applyAllPlantsFilter(aAllPlantsFilter);
						var oZsbComponentTableBindingParameters = oEvent.getParameter("bindingParams");
						if (aFilter && aFilter.aFilters && aFilter.aFilters.length) {
							if (oZsbComponentTableBindingParameters) {
								oZsbComponentTableBindingParameters.filters.push(aFilter);
							} else if (this.oZsbComponentTable.getTable().getBinding("rows")) {
								this.oZsbComponentTable.getTable().getBinding("rows").filter([aFilter], FilterType.Application);
							}
						}
					}
				}
				if (!this.oPriceColumn) {
					this.oPriceColumn = Fragment.byId(this.sZsbAnalyticalFragmentId, "idZsbComponentSmartTable-Price");
				}
				if (!this.oConvertedPriceColumn) {
					this.oConvertedPriceColumn = Fragment.byId(this.sZsbAnalyticalFragmentId, "idZsbComponentSmartTable-ConvertedPrice");
				}
				this.oPriceColumn.bindProperty("visible", {
					path: "propertyModel>/bZsbCompPriceColumn"
				});
				this.oConvertedPriceColumn.bindProperty("visible", {
					path: "propertyModel>/bZsbCompConvertedPriceColumn"
				});
				if (this.bZSBLaw) {
					if (this.oPriceColumn) {
						this.getView().getModel("propertyModel").setProperty("/bZsbCompPriceColumn", false);
					}
					if (this.oConvertedPriceColumn) {
						this.getView().getModel("propertyModel").setProperty("/bZsbCompConvertedPriceColumn", false);
					}
				} else {
					if (this.oPriceColumn) {
						this.getView().getModel("propertyModel").setProperty("/bZsbCompPriceColumn", true);
					}
					if (this.oConvertedPriceColumn) {
						this.getView().getModel("propertyModel").setProperty("/bZsbCompConvertedPriceColumn", true);
					}
				}
			},
			/**
			 * Handler before rebind table for ZSB component grid table in edit mdoe
			 * @param {sap.ui.base.Event} oEvent The event object
			 */
			onBeforeEditZsbRebindTable: function (oEvent) {
				var bIsEditable = this.uiModel.getProperty("/editable");
				if (bIsEditable) {
					var mBindingParams = oEvent.getParameter("bindingParams");
					if (mBindingParams && mBindingParams.parameters) {
						mBindingParams.parameters.entitySet = "xVWKSxNLP_CCTR_I_ZSB";
					}
					if (this.aSelectedPlants) {
						var oItemGuidFilter = new Filter({
							path: "DraftUUID",
							operator: FilterOperator.EQ,
							value1: this.getView().getBindingContext().getObject().DraftUUID
						});

						var aAllPlantsFilter = this.getAllPlantsFilter(this.aSelectedPlants);
						var aFilter = this.applyAllPlantsFilter(aAllPlantsFilter);
						var oZsbComponentEditTableBindingParameters = oEvent.getParameter("bindingParams");
						if (aFilter && aFilter.aFilters && aFilter.aFilters.length) {
							if (oZsbComponentEditTableBindingParameters) {
								oZsbComponentEditTableBindingParameters.filters.push(aFilter);
							} else if (this.oZsbComponentGridSmartTable.getTable().getBinding("rows")) {
								this.oZsbComponentGridTable.attachRowSelectionChange(this.onZsbCompRowSelectionChanged.bind(this));
								this.oZsbComponentGridSmartTable.getTable().getBinding("rows").filter([oItemGuidFilter], FilterType.Control);
								this.oZsbComponentGridSmartTable.getTable().getBinding("rows").filter([aFilter], FilterType.Application);
							}
						}
					}
				}
			},
			/**
			 * Handler before rebind table for ZSB References table
			 * @param {sap.ui.base.Event} oEvent The event object
			 */
			onBeforeZsbRefRebindTable: function (oEvent) {
				var mBindingParams = oEvent.getParameter("bindingParams");
				if (mBindingParams && mBindingParams.parameters) {
					mBindingParams.parameters.entitySet = "xVWKSxNLO_CCTR_I_REF_ZSB";
				}
				if (this.aSelectedPlants) {
					var aAllPlantsFilter = this.getAllPlantsFilter(this.aSelectedPlants);
					var aFilter = this.applyAllPlantsFilter(aAllPlantsFilter);
					var oZsbRefTableBindingParameters = oEvent.getParameter("bindingParams");
					if (aFilter && aFilter.aFilters && aFilter.aFilters.length) {
						if (oZsbRefTableBindingParameters) {
							oZsbRefTableBindingParameters.filters.push(aFilter);
						} else {
							if (this.oZsbRefTable.getTable().getBinding("items")) {
								this.oZsbRefTable.getTable().getBinding("items").filter([aFilter], FilterType.Application);
							}
						}
					}
				}
			},

			/**
			 * Event attached to selection change of subordinate CCTR
			 * @param {sap.ui.base.Event} oEventSource The event object
			 */
			onSubordCCTRSelectionChangeWorkflow: function (oEventSource) {
				var oBindingContext = this.getView().getBindingContext();
				var oSelectedSubordCCTRRow = oEventSource.getSource().getSelectedContexts();
				var oSelectedSubordCCTR = oSelectedSubordCCTRRow[0].getProperty(oSelectedSubordCCTRRow[0].getPath());
				if (oBindingContext && oBindingContext.getProperty("PurchasingProcessingStatus") !== Constants.CONTRACT_STATUS.IN_APPROVAL) {
					if (oSelectedSubordCCTR.Status === Constants.CONTRACTS_STATUS.REJECTED) {
						this.getView().getModel("propertyModel").setProperty("/bUpdatedRetriggerBtnVisible", true);
					} else {
						this.getView().getModel("propertyModel").setProperty("/bUpdatedRetriggerBtnVisible", false);
					}
				}
			},

			/**
			 * Logic to be triggered when the Retrigger Workflow button is clicked
			 * @param {sap.ui.base.Event} oEvent The event object
			 */
			onClickRetriggerWorkflow: function (oEvent) {
				var oSelectedSubordCCTRRow = this.oSubordCCTRTable.getSelectedContexts();
				var oSelectedSubordCCTR = oSelectedSubordCCTRRow[0].getProperty(oSelectedSubordCCTRRow[0].getPath());

				var sSubordCCTRId = oSelectedSubordCCTR.SubordCntrlPurContract;
				var oPayload = {
					"SubordinateDocumentID": sSubordCCTRId
				};
				var oModel = this.getView().getModel();
				oModel.callFunction(Constants.FUNCTION_IMPORT.RETRIGGER_WORKFLOW, {
					method: "POST",
					urlParameters: oPayload,
					success: jQuery.proxy(this.RetriggerSubordCCTRUpdateSuccess, this),
					error: jQuery.proxy(this.RetriggerSubordCCTRUpdateError, this)
				});
				this.oSubordCCTRTable.setBusy(true);
				this.oSubordCCTRTable.setSelectedItem(this.oSubordCCTRTable.getSelectedItems()[0], false);

			},
			/**
			 * Success callback after the retrigger Subordinate CCTR Update action
			 * @param {Object} oData Success payload
			 * */
			RetriggerSubordCCTRUpdateSuccess: function (oData) {
				this.oSubordCCTRTable.setBusy(false);
				this.oSubordCCTRTable.getBinding("items").refresh();
				this.getView().getModel("propertyModel").setProperty("/bUpdatedRetriggerBtnVisible", false);
				MessageToast.show(this._oResourceBundle.getText("RetiggerWorkflowSuccessMsg"));

			},
			//***Error callback after the retrigger Subordinate CCTR Update action
			RetriggerSubordCCTRUpdateError: function (oError) {
				this.getView().getModel("propertyModel").setProperty("/bUpdatedRetriggerBtnVisible", false);
				this.oSubordCCTRTable.setBusy(false);
				this.oSubordCCTRTable.getBinding("items").refresh();

				if (oError.responseText) {
					var oMessage = JSON.parse(oError.responseText);
					MessageBox.error(oMessage.error.message.value);
				}
			},

			/*
			 * Select Conditions section tab.
			 */
			checkNavigationPricingConditions: function () {
				if (this._sCurrentView === Constants.VIEW_ID.ITEM || this._sCurrentView === Constants.VIEW_ID.HIERARCHY_ITEM) {
					sap.ui.require(["sap/ui/util/Storage"], function (Storage) {
						var oMyStorage = new Storage(Storage.Type.session, "navigation_parameter"),
							storageParameter = oMyStorage.get("navigationFlag");
						if (storageParameter) {
							if (storageParameter.flagNavigationPricingConditions) {
								//This is used to select Conditions tab if flagNavigationPricingConditions === true
								if (this._sCurrentView === Constants.VIEW_ID.ITEM) {
									var oContractItemObjectPage = this.base.byId(
										"ui.s2p.mm.pur.central.ctr.sts1::sap.suite.ui.generic.template.ObjectPage.view.Details::C_CntrlPurchaseContractItemTP--objectPage"
									);

									oContractItemObjectPage.setSelectedSection(
										"ui.s2p.mm.pur.central.ctr.sts1::sap.suite.ui.generic.template.ObjectPage.view.Details::C_CntrlPurchaseContractItemTP" +
										"--sap.cus.sd.lib.item.cndn.forSmartElements::item::C_CntrlPurContrItmCndnAmountTP:C_CntrlPurContrItmPrcSimln::ComponentSection"
									);
								}
								if (this._sCurrentView === Constants.VIEW_ID.HIERARCHY_ITEM) {
									var oContractItemObjectPageHierarchy = this.base.byId(
										"ui.s2p.mm.pur.central.ctr.sts1::sap.suite.ui.generic.template.ObjectPage.view.Details::C_CntrlPurContrHierItemTP--objectPage"
									);

									oContractItemObjectPageHierarchy.setSelectedSection(
										"ui.s2p.mm.pur.central.ctr.sts1::sap.suite.ui.generic.template.ObjectPage.view.Details::C_CntrlPurContrHierItemTP" +
										"--sap.cus.sd.lib.item.cndn.forSmartElements::item::C_CPurConHierItmCndnAmountTP:C_CntrlPurContrItmPrcSimln::ComponentSection"
									);
								}
								//The flag is set to false so that once the conditions tab is selected,it should not be selected again
								oMyStorage.put("navigationFlag", {
									flagNavigationPricingConditions: false
								});
							}
						}
					}.bind(this));
				}
			},

			/*
			 * Check to enable zsb functionalities
			 * @param {oContext} the context object
			 */
			checkAndEnableZsb: function (oContext) {
				var oZsbContextObject = oContext.context.getObject();
				this.bShowZSB = oZsbContextObject.showZSBFacet;
				this.bShowRefZsb = oZsbContextObject.showRefZSBFacet;
				this.bZSBLaw = oZsbContextObject.ZSBLaw_Flag;
			},

			/*
			 * Check to display demand management section only if material is P-material
			 * @param {oEvent} the event object
			 */
			checkAndEnableDemandManagement: function (oEvent) {
				var showDemandManagement = oEvent.context.getObject().ShowDemandManagement;
				if (showDemandManagement) {
					//demand handling section
					this.getView().getModel("propertyModel").setProperty("/bDemandManagementSectionVisible", true);
					this.getDemandData(oEvent);
				}
			},

			/**
			 * Get all plants from dropdown in ZSB Component facet
			 * @param {sap.ui.base.Event} oEvent The event object
			 */
			getPlantsData: function (oEvent) {
				this.aPlants = [];
				this.aSelectedPlants = [];
				var oContextObject = oEvent.getSource().getContexts();
				for (var i = 0; i < oContextObject.length; i++) {
					var sPlant = oContextObject[i].getProperty("Plant");
					this.aPlants.push(sPlant);
				}

				if (this.oZsbPlantComboBox) {
					var oSelectedPlant = this.oZsbPlantComboBox.getSelectedItem();
					if (oSelectedPlant) {
						this.aSelectedPlants.push(oSelectedPlant.getText());
					} else {
						this.aSelectedPlants = this.aPlants;
					}
				}
				this.oZsbComponentTable.fireBeforeRebindTable();
			},
			/*
			 * Get all plants from dropdown in ZSB Grid table of Component facet
			 * @param {sap.ui.base.Event} oEvent The event object
			 */
			getPlantsDataEditTable: function (oEvent) {
				this.aPlants = [];
				this.aSelectedPlants = [];
				var oContextObject = oEvent.getSource().getContexts();
				for (var i = 0; i < oContextObject.length; i++) {
					var sPlant = oContextObject[i].getProperty("Plant");
					this.aPlants.push(sPlant);
				}

				if (this.oZsbPlantComboBoxEditTable) {
					var oSelectedPlant = this.oZsbPlantComboBoxEditTable.getSelectedItem();
					if (oSelectedPlant) {
						this.aSelectedPlants.push(oSelectedPlant.getText());
					} else {
						this.aSelectedPlants = this.aPlants;
					}
				}
				this.oZsbComponentGridSmartTable.fireBeforeRebindTable();
			},

			/**
			 * Get all plants from dropdown in ZSB References facet
			 * @param {sap.ui.base.Event} oEvent The event object
			 */
			getRefPlantsData: function (oEvent) {
				this.aPlants = [];
				this.aSelectedPlants = [];
				var oContextObject = oEvent.getSource().getContexts();
				for (var i = 0; i < oContextObject.length; i++) {
					var sPlant = oContextObject[i].getProperty("Plant");
					this.aPlants.push(sPlant);
				}

				if (this.oZsbRefPlantComboBox) {
					var oSelectedPlant = this.oZsbRefPlantComboBox.getSelectedItem();
					if (oSelectedPlant) {
						this.aSelectedPlants.push(oSelectedPlant.getText());
					} else {
						this.aSelectedPlants = this.aPlants;
					}
				}
				this.oZsbRefTable.fireBeforeRebindTable();
			},

			/**
			 * Get all plants filter in ZSB Component facet
			 * @param {Object} aSelectedPlants The plant array object
			 * @returns {sap.ui.model.Filter} the all plants filter
			 */
			getAllPlantsFilter: function (aSelectedPlants) {
				var aAllPlantsFilter = [];
				for (var i = 0; i < aSelectedPlants.length; i++) {
					var oPlantFilter = new Filter({
						path: "Plant",
						operator: FilterOperator.EQ,
						value1: aSelectedPlants[i]
					});
					aAllPlantsFilter.push(oPlantFilter);
				}
				return aAllPlantsFilter;
			},

			/*
			 * Apply all plants filter on ZSB Component table 
			 * @param {Object} aAllPlantsFilter The all plant filters array
			 * @return {sap.ui.model.Filter} aFilter The all plants filter
			 */
			applyAllPlantsFilter: function (aAllPlantsFilter) {
				if (aAllPlantsFilter.length) {
					var aFilter = new Filter({
						filters: aAllPlantsFilter,
						and: false
					});
					return aFilter;
				} else {
					return {};
				}
			},

			/**
			 * Handler for plants selection in ZSB Component facet
			 * @param {sap.ui.base.Event} oEvent The event object
			 */
			onPlantChange: function (oEvent) {
				var oSelectedPlant = oEvent.getSource().getValue();
				var aFilter = [];
				if (oSelectedPlant === "") {
					this.aSelectedPlants = this.aPlants;
					var aAllPlantsFilter = this.getAllPlantsFilter(this.aSelectedPlants);
					aFilter = this.applyAllPlantsFilter(aAllPlantsFilter);
					this.oZsbComponentTable.getTable().getBinding("rows").filter([aFilter], FilterType.Application);
				} else {
					this.aSelectedPlants = [];
					this.aSelectedPlants.push(oSelectedPlant);
					var oPlantFilter = new Filter({
						filters: [
							new Filter({
								path: "Plant",
								operator: FilterOperator.EQ,
								value1: oSelectedPlant
							})
						]
					});
					aFilter.push(oPlantFilter);
					this.oZsbComponentTable.getTable().getBinding("rows").filter(aFilter, FilterType.Application);
				}
			},
			/*
			 * Handler for plants selection in ZSB Grid table of Component facet
			 * @param {sap.ui.base.Event} oEvent The event object
			 */
			onPlantChangeEditTable: function (oEvent) {
				var oSelectedPlant = oEvent.getSource().getValue();
				var aFilter = [];
				if (oSelectedPlant === "") {
					this.aSelectedPlants = this.aPlants;
					var aAllPlantsFilter = this.getAllPlantsFilter(this.aSelectedPlants);
					aFilter = this.applyAllPlantsFilter(aAllPlantsFilter);
					this.oZsbComponentGridSmartTable.getTable().getBinding("rows").filter([aFilter], FilterType.Application);
				} else {
					this.aSelectedPlants = [];
					this.aSelectedPlants.push(oSelectedPlant);
					var oPlantFilter = new Filter({
						filters: [
							new Filter({
								path: "Plant",
								operator: FilterOperator.EQ,
								value1: oSelectedPlant
							})
						]
					});
					aFilter.push(oPlantFilter);
					this.oZsbComponentGridSmartTable.getTable().getBinding("rows").filter(aFilter, FilterType.Application);
				}
			},

			/**
			 * Handler for plants selection in ZSB References facet
			 * @param {sap.ui.base.Event} oEvent The event object
			 */
			onRefPlantChange: function (oEvent) {
				var oSelectedPlant = oEvent.getSource().getValue();
				var aFilter = [];
				if (oSelectedPlant === "") {
					this.aSelectedPlants = this.aPlants;
					var aAllPlantsFilter = this.getAllPlantsFilter(this.aSelectedPlants);
					aFilter = this.applyAllPlantsFilter(aAllPlantsFilter);
					this.oZsbRefTable.getTable().getBinding("items").filter([aFilter], FilterType.Application);
				} else {
					this.aSelectedPlants = [];
					this.aSelectedPlants.push(oSelectedPlant);
					var oPlantFilter = new Filter({
						filters: [
							new Filter({
								path: "Plant",
								operator: FilterOperator.EQ,
								value1: oSelectedPlant
							})
						]
					});
					aFilter.push(oPlantFilter);
					this.oZsbRefTable.getTable().getBinding("items").filter(aFilter, FilterType.Application);
				}
			},

			/*
			/*
			 * Get method for demand data in demand management section
			 * @param {oEvent} the event object
			 */
			getDemandData: function (oEvent) {
				var oContextObject = oEvent.context.getObject();
				this._oDemandManagementTable = this.byId("idDemandManagementTable");
				var oDemandDataFilters = this.getDemandDataFilters(oContextObject);

				var aFilters = [];
				aFilters.push(oDemandDataFilters);

				this._oDemandManagementTable.setBusy(true);
				this.getView().getController().getOwnerComponent().getModel().read(
					"/xVWKSxNLP_CCTR_I_READ_DH", {
						filters: aFilters,
						success: this.getDemandDataSuccess.bind(this),
						error: this.getDemandDataError.bind(this)
					});
			},
			getDemandDataSuccess: function (oData, oResponse) {

				var oLocalModel = new JSONModel();
				oLocalModel.setData(oData.results);
				this.getView().setModel(oLocalModel, "DemandData");
				this._oDemandManagementTable.setBusy(false);
			},

			getDemandDataError: function (oError) {
				this._oDemandManagementTable.setBusy(false);
				if (oError.responseText) {
					var oMessage = JSON.parse(oError.responseText);
					MessageBox.error(oMessage.error.message.value);
				}
			},

			/*
			 * Create Demand data filters
			 * @param {oContextObject}
			 * @returns {sap.ui.model.Filter} the view filter 
			 */
			getDemandDataFilters: function (oContextObject) {
				var oFilter = new Filter({
					filters: [
						new Filter({
							path: "DocumentNumber",
							operator: FilterOperator.EQ,
							value1: oContextObject.CentralPurchaseContract.toString()

						}),
						new Filter({
							path: "DistributionItemNumber",
							operator: FilterOperator.EQ,
							value1: oContextObject.DistributionKey.toString()
						}),
						new Filter({
							path: "DocumentItemNumber",
							operator: FilterOperator.EQ,
							value1: oContextObject.CentralPurchaseContractItem.toString()
						})
					],
					and: true
				});
				return oFilter;
			},

			/**
			 * Reload notes component in header
			 */
			reloadHeaderNotesComponent: function () {
				var headerNotesComponent = this.getHeaderNotesComponent();
				headerNotesComponent.getComponentInstance().load();
			},

			/**
			 * Reload notes component in item
			 */
			reloadItemNotesComponent: function () {
				var itemNotesComponent = this.getItemNotesComponent();
				itemNotesComponent.getComponentInstance().load();
			},

			/**
			 * Returns header notes component reference
			 * @returns {Object} return Header notes component reference.
			 */
			getHeaderNotesComponent: function () {
				if (!this.headerNotesComponent) {
					this.headerNotesComponent = this.base.byId(
						this.headerPageId + "--sap.nw.core.gbt.notes.lib.reuse.notes4smarttemplate::header::Notes::ComponentContainer"
					);
				}
				return this.headerNotesComponent;
			},
			/**
			 * Returns item notes component reference
			 * @returns {Object} return Item notes component reference.
			 */
			getItemNotesComponent: function () {
				if (!this.itemNotesComponent) {
					this.itemNotesComponent = this.base.byId(
						this.itemPageId + "--sap.nw.core.gbt.notes.lib.reuse.notes4smarttemplate::item::Notes::ComponentContainer"
					);
				}
				return this.itemNotesComponent;
			},

			/**
			 * Opening Dialog for copy conditions
			 */
			handleCopyConditionsButtonPress: function () {
				if (!this.oCopyConditionsDialog) {
					Fragment.load({
						id: "idCopyConditionsFragment",
						name: "vwks.nlp.s2p.mm.pctrcentral.manage.changes.fragments.CopyConditionsDialog",
						controller: this
					}).then(function (oDialog) {
						this.oCopyConditionsDialog = oDialog;
						this.getView().addDependent(this.oCopyConditionsDialog);
						this.oCopyConditionsDialog.open();
					}.bind(this));
				} else {
					this.oCopyConditionsDialog.open();
				}
			},

			/**
			 * handling selection of radio button in responsive table
			 */
			handleRadioButtonSelection: function () {
				this.getView().getModel("propertyModel").setProperty("/bCopyButtonEnable", true);
			},

			/*
			 * Closing Copy conditions dialog on press of cancel button
			 */
			handleCopyConditionDialogClose: function () {
				this.oCopyConditionsDialog.close();
				this.oCopyConditionsDialog.destroy();
				// This is to fix duplicate id issue in fragment
				this.oCopyConditionsDialog = undefined;
			},

			/**
			 * Event handler for Copy button press
			 */
			handleCopyButtonPress: function () {
				var sPlant = Fragment.byId("idCopyConditionsFragment", "idPlant").getValue(),
					oTableBindingObject = Fragment.byId("idCopyConditionsFragment", "idCopyConditionsSmartTable").getTable().getSelectedItem().getBindingContext()
					.getObject(),
					oModel = this.getView().getModel();
				oModel.setDeferredGroups(["batchFunctionImport"]);
				oModel.callFunction(Constants.FUNCTION_IMPORT.COPY_CONDITION, {
					method: "POST",
					batchGroupId: "batchFunctionImport",
					urlParameters: {
						ProcmtHubPlant: sPlant,
						Sourcesystem: this.sPlantSourceSystem,
						DraftUUID: oTableBindingObject.DraftUUID,
						ParentDraftUUID: oTableBindingObject.ParentDraftUUID
					}
				});
				oModel.submitChanges({
					batchGroupId: "batchFunctionImport",
					success: this.handleCopyReqButtonSuccess.bind(this),
					error: this.handleCopyReqButtonError.bind(this)
				});
			},

			/**
			 * Event handler for copy functionality success
			 * @param {event} oData - success result
			 * @param {event} response - success response
			 */
			handleCopyReqButtonSuccess: function (oData, response) {
				this.getView().setBusy(false);
				var oResponse = oData.__batchResponses,
					sErrorMessage = "";
				//success case: this condition was given by backend team to identify the success case.
				if (oResponse[0].response === undefined) {
					MessageToast.show(this._oResourceBundle.getText("CopyCndnSuccessMsg"));
					this.getView().getModel("propertyModel").setProperty("/bCopyButtonEnable", false);
					this.handleCopyConditionDialogClose();
				} else { //error case
					sErrorMessage = JSON.parse(oResponse[0].response.body).error.message.value;
					MessageBox.error(sErrorMessage, {
						actions: [MessageBox.Action.OK]
					});
				}
				//refreshing whole conditions reusable component
				this.refreshConditionFacet();
			},
			/**
			 * Event handler for copy functionality error
			 * @param {event} oError - error result
			 */
			handleCopyReqButtonError: function (oError) {
				this.getView().setBusy(false);
				if (oError.responseText) {
					var sErrorMsg = $(oError.responseText).find("message").first().text();
					MessageBox.error(sErrorMsg);
				}
			},
			/*
			 * Date formatter generic method
			 * @param method's parameter iDate. It holds the passed value by invoker.
			 */
			dateFormatter: function (iDate) {
				if (iDate) {
					var dateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
						pattern: "yyyy-MM-dd"
					});
					return dateFormat.format(new Date(iDate), true);
				} else {
					return null;
				}
			},
			/*
			 * formatter method for Visible property overall Quota pop up on item level 
			 * @param {string} Editable property maintained for the view
			 */
			onOverallQuotaFormatter: function (sEditable) {
				return Formatter.onOverallQuotaFormatter(sEditable, this._sCurrentView);
			},
			/*
			 * formatter method for Visible property overall Quota pop up on Distribution level 
			 * @param {string} Editable property maintained for the view
			 */
			onOverallQuotaDistributionFormatter: function (sEditable) {
				return Formatter.onOverallQuotaDistributionFormatter(sEditable, this._sCurrentView);
			},

			/**
			 * Add additional property to track if the item is updated.
			 * @param {object[]} aData  Quota items 
			 */
			_addEditMonitorProp: function (aData) {
				aData.forEach(function (oItem) {
					oItem.updated = false;
					oItem.initialQuota = oItem.Quota;
				});
			},

			/**
			 * Process Overall Quota details data.
			 * Show/Hide error message in popup.
			 * @param {Object[]} aQuotaInfoData Overall Quota data
			 */
			_processOverallQuota: function (aQuotaInfoData) {
				var oTotalItem = aQuotaInfoData[aQuotaInfoData.length - 1];

				if (+oTotalItem.Quota > Constants.MAX_PERCENTAGE_VALUE) {
					this._oOverallQuotaModel.setProperty("/showOverallQuotaErrorMsg", true);
				}
				this.getView().setModel(this._oOverallQuotaModel, "overallQuota");
				this.getView().getModel().setChangeGroups({
					"QuotaAlias": {
						groupId: "updateQuotaFI"
					}
				});
			},

			/**
			 * Change Quota value event handler.
			 * @param {sap.ui.base.Event} oEvent change event object
			 */
			handleUpdateQuotaChange: function (oEvent) {
				var sNewValue = oEvent.getParameter("newValue");
				var oSource = oEvent.getSource();
				var oCtx = oSource.getBindingContext("QuotaAlias");

				this._validateQuotaField(oSource, oCtx, sNewValue);
				this._handleQuotaUpdate(oSource, oCtx, sNewValue);

				var bQuotaHasErrors = !!this._oOverallQuotaModel.getProperty("/errorPaths").length;
				// in case of DL page, Overall Quta should be calculated
				var bIsDistrLineView = this._sCurrentView === Constants.VIEW_ID.HIERARCHY_DISTRIBUTION || this._sCurrentView === Constants.VIEW_ID.DISTRIBUTION;
				if (bIsDistrLineView && !bQuotaHasErrors) {
					this._calculateTotalQuota();
				}
			},

			/**
			 * Validate the Quota input.
			 * If it has error, keep the path in model.
			 * @param {sap.m.Input} oSource Quota Input field
			 * @param {sap.ui.model.Context} oCtx Input context
			 * @param {string} sNewValue Quota value
			 */
			_validateQuotaField: function (oSource, oCtx, sNewValue) {
				var sPath = oCtx.getPath();
				var aErrorPaths = this._oOverallQuotaModel.getProperty("/errorPaths") || [];
				// check the limits
				var bIsInvalid = sNewValue < 0 || sNewValue > 100 || isNaN(Number(sNewValue));
				var iPathInd = aErrorPaths.indexOf(sPath);
				// the path shouldn't be considered again if it's already in /errorPaths array
				if (bIsInvalid && !~iPathInd) {
					aErrorPaths = aErrorPaths.concat([sPath]);
				} else if (!bIsInvalid && ~iPathInd) {
					aErrorPaths.splice(iPathInd, 1);
				}
				this._oOverallQuotaModel.setProperty("/errorPaths", aErrorPaths);
				this._oOverallQuotaModel.setProperty("/hasErrors", !!aErrorPaths.length);
			},

			/**
			 * Handle changes in the Quota input.
			 * If it is equal to initial value, model handles that as unchanged.
			 * @param {sap.m.Input} oSource Quota Input field
			 * @param {sap.ui.model.Context} oCtx Input context
			 * @param {string} sNewValue Quota value
			 */
			_handleQuotaUpdate: function (oSource, oCtx, sNewValue) {
				var oItemData = oCtx.getObject();
				var sPath = oCtx.getPath();
				var aUpdatedPathsInModel = this._oOverallQuotaModel.getProperty("/updatedPaths");
				var oFloatFormat = NumberFormat.getFloatInstance();

				if (oFloatFormat.parse(oItemData.initialQuota) === Number(sNewValue)) {
					// if new value is the same as initial, stop tracking the changes for this item
					oItemData.updated = false;

					if (~aUpdatedPathsInModel.indexOf(sPath)) {
						var aUpdatedPathsTemp = aUpdatedPathsInModel.slice();
						aUpdatedPathsTemp.splice(aUpdatedPathsTemp.indexOf(sPath), 1);
						this._oOverallQuotaModel.setProperty("/updatedPaths", aUpdatedPathsTemp);
					}

				} else {
					// start track the changes for new quota value
					oItemData.Quota = sNewValue;

					oItemData.updated = true;
					if (!~aUpdatedPathsInModel.indexOf(sPath)) {
						this._oOverallQuotaModel.setProperty("/updatedPaths", aUpdatedPathsInModel.concat([sPath]));
					}
				}
				// to see changes in table, by default binding is not updated
				this.getView().getModel("QuotaAlias").updateBindings();
			},

			/**
			 * Calculate locally the Total line value on the fly (Distribution Line).
			 */
			_calculateTotalQuota: function () {
				var oQuotaLineData = this.getView().getModel("QuotaAlias").getData();
				var oTotalLine = oQuotaLineData[oQuotaLineData.length - 1];

				var sNewTotalQuota = oQuotaLineData.reduce(function (iTotal, oLineData, iInd) {
					if (iInd !== oQuotaLineData.length - 1) {
						var sQuotaLine = +oLineData.Quota || 0;
						return iTotal + sQuotaLine;
					}
					return iTotal;
				}, 0);
				oTotalLine.Quota = sNewTotalQuota;
				this.getView().getModel("QuotaAlias").updateBindings();
			},

			/**
			 * Edit icon press event handler.
			 * @param {sap.ui.bas.Event} oEvent press event object
			 */
			handleOverallQuotaDialogEditPress: function (oEvent) {
				this._oOverallQuotaModel.setProperty("/showQuotaEdit", true);
			},

			/**
			 * Formats Overall Quota title in Smart Table in Edit mode.
			 * @param {object[]} aOverallQuotaItems contract items 
			 * @return {number} number of items to show in the smart table header
			 */
			formatOverallQuotaTitle: function (aOverallQuotaItems) {
				var bIsContractItem = this._sCurrentView === Constants.VIEW_ID.HIERARCHY_ITEM || this._sCurrentView === Constants.VIEW_ID.ITEM;
				return Formatter.formatOverallQuotaTitle(aOverallQuotaItems, bIsContractItem);
			},

			/**
			 * Formats Quota value.
			 * Instead of "000" -> "—".
			 * Removes leading zeros.
			 * @param {string} sQuota the quota status
			 * @return {string} Quota value string
			 **/
			formatTextQuotaValue: function (sQuota) {
				return Formatter.formatQuotaValue(sQuota, true);
			},

			/**
			 * Formats Quota value.
			 * Instead of "000" -> "0".
			 * Removes leading zeros.
			 * @param {string} sQuota the quota status
			 * @return {string} Quota value string
			 **/
			formatInputQuotaValue: function (sQuota) {
				return Formatter.formatQuotaValue(sQuota);
			},
			/**
			 * Formats Quota value state.
			 * Returns Error if value > 100 or value < 0 or value is NaN.
			 * @param {string} sQuota the quota status
			 * @return {sap.ui.core.ValueState} ValueState for Quota field
			 **/
			formatQuotaValueState: function (sQuota) {
				return Formatter.formatQuotaValueState(sQuota);
			},

			/**
			 * Save Overall Quota updated values.
			 */
			handleOverallQuotaDialogSavePress: function () {
				var oView = this.getView();
				var oModel = oView.getModel();
				oModel.setDeferredGroups(["updateQuotaFI"]);
				var aTableRows = this.getView().getModel("QuotaAlias").getData();
				var aTableRowsCopy = aTableRows.slice();
				aTableRowsCopy.pop();

				aTableRowsCopy.forEach(function (oItem) {
					if (!oItem.updated) {
						return;
					}
					oModel.callFunction(Constants.FUNCTION_IMPORT.UPDATE_QUOTA, {
						method: "POST",
						batchGroupId: "updateQuotaFI",
						urlParameters: {
							ContractDistributionLine: oItem.DistributionKey,
							ContractItem: oItem.CentralPurchaseContractItem,
							ContractNumber: oItem.CentralPurchaseContract,
							Material: oItem.Material,
							Plant: oItem.Plant,
							Quota: !oItem.Quota ? "0" : oItem.Quota
						}
					});
				});

				this._oOverallQuotaDialog.setBusy(true);
				oModel.submitChanges({
					batchGroupId: "updateQuotaFI",
					success: this.handleUpdateQuotaSuccess.bind(this),
					error: this.handleUpdateQuotaError.bind(this)
				});
			},

			/**
			 * Show success message toast after update Quota.
			 * @param {object} oResponse bach response
			 */
			handleUpdateQuotaSuccess: function (oResponse) {
				this._oOverallQuotaDialog.setBusy(false);
				var aBatchResponses = oResponse.__batchResponses,
					sErrorMessage = "";

				if (!aBatchResponses[0].response) {
					MessageToast.show(this._oDistri18nModelResourceBundle.getText("UpdateQuotaSuccessMsg"));
					this._oOverallQuotaModel.setProperty("/updatedPaths", []);
					this._oOverallQuotaModel.setProperty("/errorPaths", []);
					this._oOverallQuotaModel.setProperty("/hasErrors", false);
					this.handleOverallQuotaDialogClosePress();
					this.getView().getModel().refresh();
				} else {
					sErrorMessage = JSON.parse(aBatchResponses[0].response.body).error.message.value;
					MessageBox.error(sErrorMessage, {
						actions: [MessageBox.Action.OK]
					});
				}
			},

			/**
			 * Handle update Quota error.
			 * @param {object} oError error object 
			 */
			handleUpdateQuotaError: function (oError) {
				this._oOverallQuotaDialog.setBusy(false);
				if (oError.responseText) {
					var sErrorMsg = JSON.parse(oError.responseText).error.message.value;
					MessageBox.error(sErrorMsg);
				}
			},

			/**
			 * Return column list item highlight color. Formatter is used.
			 * @param {string} sStatus contract line status code
			 * @return {sap.ui.core.MessageType} color
			 * @public
			 */
			getDistributionLineColor: function (sStatus) {
				return Formatter.getDistributionLineColor(sStatus);
			},

			/*
			 * OverAll Quota More Info Icon
			 * @param {sap.ui.base.Event} oEvent The event object
			 */
			handleOverallQuotaInfoIconPress: function (oEvent) {
				if (!this._oOverallQuotaDialog) {
					Fragment.load({
						id: "OverallQuotaDetails",
						name: "vwks.nlp.s2p.mm.pctrcentral.manage.changes.fragments.OverallQuotaDetails",
						controller: this
					}).then(function (oDialog) {
						this._oOverallQuotaDialog = oDialog;
						this.getView().addDependent(this._oOverallQuotaDialog);
						this._oOverallQuotaDialog.open();
						this._requestQuotaDataForDialog();
					}.bind(this));
				} else {
					this._oOverallQuotaDialog.open();
					this._requestQuotaDataForDialog();
				}
			},

			/*
			 * Request data for the Overall quota popup.
			 */
			_requestQuotaDataForDialog: function () {
				// model for Quota message strip
				this._oOverallQuotaModel = new JSONModel({
					showOverallQuotaErrorMsg: false,
					showQuotaEdit: false,
					updatedPaths: [],
					errorPaths: [],
					hasErrors: false
				});
				this._oOverallQuotaModel.setSizeLimit(1000);
				this.getView().setModel(this._oOverallQuotaModel, "overallQuota");

				if (this._sCurrentView === Constants.VIEW_ID.HIERARCHY_ITEM || this._sCurrentView === Constants.VIEW_ID.ITEM) {
					this.handleItemOverallQuotaInfoIconPress();
				} else {
					this.handleDistrOverallQuotaInfoIconPress();
				}
			},

			/*
			 * Get OverAllQuota information 
			 * @param {sap.ui.base.Event} oEvent The event object
			 */
			handleItemOverallQuotaInfoIconPress: function (oEvent) {
				var oModel = this.getView().getModel();
				var oBindingContext = this.getView().getBindingContext();
				var sNavigationProperty = "/to_CntrlPurContrDistributionTP";
				this._oOverallQuotaDialog.setBusy(true);

				var sPath = oBindingContext.getPath() + sNavigationProperty;
				oModel.read(sPath, {
					success: this.onOverallQuotaDataSuccesshandler.bind(this),
					error: this.onOveralQuotaErrorhandler.bind(this)
				});
			},

			/*
			 * Event handler Overal Quota Item level 
			 * @param {event} oData - success result
			 * @param {event} oResponse - success response
			 */
			onOverallQuotaDataSuccesshandler: function (oData, oResponse) {
				this._oOverallQuotaDialog.setBusy(false);
				this._getQuotaDataResponsiveTable(oData);
			},

			/**
			 * Handle overall quota info icon on distribution line.
			 */
			handleDistrOverallQuotaInfoIconPress: function () {
				var oDistributionData = this.getView().getBindingContext().getObject();
				var oData = {
					results: [{
						Plant: oDistributionData.Plant,
						Material: oDistributionData.Material
					}]
				};
				this._getQuotaDataResponsiveTable(oData);
			},

			/**
			 * Process and refresh data in responsive table for Overall Quota.
			 * @param {object} oData table items data
			 */
			onResponsiveQuotaEditTableSuccess: function (oData) {
				this._oOverallQuotaDialog.setBusy(false);
				var oModel = this._oQuotaAliasModel || new JSONModel();
				oModel.setData(oData.results);
				this.getView().setModel(oModel, "QuotaAlias");
				if (!oData.results.length) {
					return;
				}
				this._addEditMonitorProp(oData.results);
				this._processOverallQuota(oData.results);
			},

			/**
			 * Process and refresh data in analytical table for Overall Quota in Contract Item.
			 * @param {object} oData table items data
			 */
			_getQuotaDataResponsiveTable: function (oData) {
				var aResults = oData.results;
				var bIsDistrLineView = this._sCurrentView === Constants.VIEW_ID.HIERARCHY_DISTRIBUTION || this._sCurrentView === Constants.VIEW_ID
					.DISTRIBUTION;
				var aFilters = this._getQuotaPopupDataResponsiveTableFilters(aResults, bIsDistrLineView);

				this._oOverallQuotaDialog.setBusy(true);
				var bIsEditable = this.uiModel.getProperty("/editable");
				if (bIsEditable || bIsDistrLineView) {
					this._getQuotaPopupDataResponsiveTable(aFilters);
				} else {
					this._refreshAnalyticalTable(aFilters);
				}
			},

			/**
			 * Return filters for the get overall quota data request.
			 * @param {object[]} aResults data with plant and material
			 * @param {boolean} bIsDistrLineView true if the distribution line view
			 * @return {sap.ui.model.Filter[]} request quota data filters array
			 */
			_getQuotaPopupDataResponsiveTableFilters: function (aResults, bIsDistrLineView) {
				var aFilters = [];
				var sMaterial;
				for (var i = 0; i < aResults.length; i++) {
					//fetch the data of selected rows by index
					sMaterial = aResults[i].Plant + aResults[i].Material;
					var oPlantMaterialFilter = new Filter({
						path: "PlantMaterialComb",
						operator: FilterOperator.EQ,
						value1: sMaterial
					});
					aFilters.push(oPlantMaterialFilter);
				}
				// the filter below it's a workaround
				// it helps BE to understand that the call was trigered from Distribution page
				if (bIsDistrLineView) {
					var oDistrFilter = new Filter({
						path: "DistributionKey",
						operator: FilterOperator.BT,
						value1: "0000",
						value2: "9999"
					});
					aFilters.push(oDistrFilter);
				}
				return aFilters;
			},

			/**
			 * Fetch the data for Quota Overall popup in Edit mode (Contract Item).
			 * @param {object[]} aFilters array of filters by 'PlantMaterialComb'
			 */
			_getQuotaPopupDataResponsiveTable: function (aFilters) {
				this.getView().getModel().read("/xVWKSxNLO_CCTR_I_ITM_QUOTAPOP", {
					filters: aFilters,
					success: this.onResponsiveQuotaEditTableSuccess.bind(this),
					error: this.onOveralQuotaErrorhandler.bind(this)
				});
			},

			/**
			 * Fire rebind Analytical table based on filters.
			 * @param {object[]} aFilters array of filters by 'PlantMaterialComb'
			 */
			_refreshAnalyticalTable: function (aFilters) {
				this.aOveralItemPop = aFilters;
				this.oOverallSmartAnalyticalTable.fireBeforeRebindTable();
				this._oOverallQuotaDialog.setBusy(false);
			},

			/*
			 * on Error , Overal Quota Error.
			 * @param {Object} oError - error message details
			 */
			onOveralQuotaErrorhandler: function (oError) {
				try {
					MessageBox.error(JSON.parse(oError.responseText).error.message.value);
				} catch (e) {
					MessageBox.error(this._oDistri18nModelResourceBundle.getText("LoadItemsForOverallQuotaErrorMsg"));
				}
				this._oOverallQuotaDialog.setBusy(false);
			},

			/*
			 * Event fired before table binding is done, in this method 
			 * filter parameters based on distribution are passed for the Analytical Smart table
			 * @param {sap.ui.base.Event} oEvent The event object
			 */
			onBeforeOverallQuotaRebindTable: function (oEvent) {
				var mBindingParams = oEvent.getParameter("bindingParams");
				if (!this.oOverallSmartAnalyticalTable) {
					this.oOverallSmartAnalyticalTable = oEvent.getSource();
				}

				if (mBindingParams && mBindingParams.parameters) {
					mBindingParams.parameters.entitySet = "xVWKSxNLO_CCTR_I_ITM_QUOTAPOP";
				}
				if (this.aOveralItemPop && this.aOveralItemPop.length) {

					var aFilter = new Filter({
						filters: this.aOveralItemPop,
						and: false
					});

					var oQuotaComponentTableBindingParameters = oEvent.getParameter("bindingParams");

					if (oQuotaComponentTableBindingParameters) {
						oQuotaComponentTableBindingParameters.filters.push(aFilter);
					} else {
						if (this.oOverallSmartAnalyticalTable.getTable().getBinding("rows")) {
							this.oOverallSmartAnalyticalTable.getTable().getBinding("rows").filter([aFilter], FilterType.Application);
						}
					}
				}
			},

			/*
			 * OverAll Quota dialog close
			 */
			handleOverallQuotaDialogClosePress: function () {
				if (this._oOverallQuotaModel) {
					var aUpdatedPaths = this._oOverallQuotaModel.getProperty("/updatedPaths");
					if (aUpdatedPaths.length) {
						this._showLoseUpdatedQuotaConfirmation()
							.then(function () {
								this._closeOverallQuotaDialog();
							}.bind(this));
					} else {
						this._closeOverallQuotaDialog();
					}
				} else {
					this._closeOverallQuotaDialog();
				}
			},

			/**
			 * Close Overall Quota dialog.
			 */
			_closeOverallQuotaDialog: function () {
				this._oOverallQuotaDialog.close();
				this._oOverallQuotaDialog.destroy();
				// This is to fix duplicate id issue in OverallQuotaDetails fragment.
				this._oOverallQuotaDialog = undefined;
				this.aOveralItemPop = undefined;
				this.oOverallSmartAnalyticalTable.destroy();
				this.oOverallSmartAnalyticalTable = undefined;
			},

			_showLoseUpdatedQuotaConfirmation: function () {
				return new Promise(function (resolve, reject) {
					MessageBox.confirm(this._oDistri18nModelResourceBundle.getText("LoseUpdatedQuotaConfirmationMsg"), {
						title: this._oDistri18nModelResourceBundle.getText("ConfirmationTitle"),
						actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
						onClose: function (sAction) {
							if (sAction === MessageBox.Action.OK) {
								return resolve();
							} else {
								return reject();
							}
						}
					});
				}.bind(this));
			},

			/*
			 * Navigation to contract item distribution
			 * @param {sap.ui.base.Event} oEvent The event object
			 */
			handleDistributionKeyPress: function (oEvent) {
				var oDistributionLineObject = oEvent.getSource().getParent().getBindingContext("QuotaAlias").getObject();

				var sContractHeader = this.getView().getModel().createKey("C_CntrlPurContrHierHdrTP", {
					CentralPurchaseContract: oDistributionLineObject.CentralPurchaseContract,
					DraftUUID: ReuseConstants.INITIAL_GUID,
					IsActiveEntity: true
				});

				var sContractItem = this.getView().getModel().createKey("C_CntrlPurContrHierItemTP", {
					CentralPurchaseContractItem: oDistributionLineObject.CentralPurchaseContractItem,
					CentralPurchaseContract: oDistributionLineObject.CentralPurchaseContract,
					DraftUUID: ReuseConstants.INITIAL_GUID,
					IsActiveEntity: true
				});

				var sContractDistribution = this.getView().getModel().createKey("C_CntrlPurContrHierItemDistrTP", {
					CentralPurchaseContract: oDistributionLineObject.CentralPurchaseContract,
					CentralPurchaseContractItem: oDistributionLineObject.CentralPurchaseContractItem,
					DistributionKey: oDistributionLineObject.DistributionKey,
					DraftUUID: ReuseConstants.INITIAL_GUID,
					IsActiveEntity: true
				});

				var sContractItemDistributionPath = sContractHeader +
					"/to_CntrlPurchaseContractItemTP(" + sContractItem.split("(")[1] +
					"/to_CntrlPurContrDistributionTP(" + sContractDistribution.split("(")[1];

				//Get path for navigation
				NavigationHelper.getNavigationPath(this.getView().getController(), "MCPC", sContractItemDistributionPath)
					.then(function (oNavigationDetails) {
						//Open in new window
						NavigationHelper.navigateWithURLHelper(oNavigationDetails.sPath, true);

						this.handleOverallQuotaDialogClosePress();
					}.bind(this));
			},

			/*
			 * Fetching data for plant value help
			 * @param {event} oEvent - Event triggered
			 */
			handlePlantValueHelp: function (oEvent) {
				this.getView().getController().getOwnerComponent().getModel().read(
					"/C_ProcmtHubPlantSystemVH", {
						success: this.getPlantValueHelpSuccess.bind(this),
						error: this.getPlantValueHelpError.bind(this)
					});

			},
			/*
			 * Event handler for plant Value help success
			 * @param {event} oData - success result
			 * @param {event} oResponse - success response
			 */
			getPlantValueHelpSuccess: function (oData, oResponse) {
				this.handlePlantVHDialogOpen(oData);
			},
			/*
			 * Event handler for copy functionality error
			 * @param {event} oError - error result
			 */
			getPlantValueHelpError: function (oError) {
				if (oError.responseText) {
					MessageBox.error(oError.message);
				}
			},
			/*
			 * Event handler for Plant VH dialog
			 * @param {event} oData - data for binding
			 */
			handlePlantVHDialogOpen: function (oData) {
				var oColModel = new JSONModel();
				oColModel.setData({
					cols: [{
						label: this._oResourceBundle.getText("Plant"),
						template: "ProcmtHubPlant"
					}, {
						label: this._oResourceBundle.getText("PlantName"),
						template: "ProcmtHubPlantName"
					}, {
						label: this._oResourceBundle.getText("SourceSystem"),
						template: "ProcurementHubSourceSystem"
					}, {
						label: this._oResourceBundle.getText("SourceSystemName"),
						template: "ProcurementHubSourceSystemName"
					}]
				});
				//empty row for plant independent selection
				var aEmptyRow = {
					ProcmtHubCompanyCode: "",
					ProcmtHubCompanyCodeName: "",
					ProcmtHubPlant: "",
					ProcmtHubPlantName: this._oResourceBundle.getText("PlantDefault"),
					ProcmtHubPlantUniqueID: "",
					ProcurementHubSourceSystem: "",
					ProcurementHubSourceSystemName: ""
				};
				oData.results.unshift(aEmptyRow);
				var oRowModel = new JSONModel(oData);
				var aCols = oColModel.getData().cols;

				this._oPlantVHDialog = sap.ui.xmlfragment(this.getView().getId(),
					"vwks.nlp.s2p.mm.pctrcentral.manage.changes.fragments.PlantValueHelpDialog", this);
				this.getView().addDependent(this._oPlantVHDialog);
				this._oPlantVHDialog.open();
				this._oPlantVHDialog.getTableAsync().then(function (oTable) {
					oTable.setModel(oColModel, "columns");
					oTable.setModel(oRowModel);
					if (oTable.bindRows) {
						oTable.bindAggregation("rows", "/results");
					}
					if (oTable.bindItems) {
						oTable.bindAggregation("items", "/results", function () {
							return new ColumnListItem({
								cells: aCols.map(function (column) {
									return new Label({
										text: "{" + column.template + "}"
									});
								})
							});
						});
					}
					this._oPlantVHDialog.update();
				}.bind(this));
			},
			/*
			 * on selection, set the value of Plant field
			 * @param {event} oEvent - Event triggered
			 */
			handlePlantVHOk: function (oEvent) {
				var iSelectedIndex = oEvent.getSource().getTable().getSelectedIndex(),
					oPLantVHObject = oEvent.getSource().getTable().getBinding("rows").getContexts()[iSelectedIndex].getObject();
				Fragment.byId("idCopyConditionsFragment", "idPlant").setValue(oPLantVHObject.ProcmtHubPlant);
				this.sPlantSourceSystem = oPLantVHObject.ProcurementHubSourceSystem;
				this._oPlantVHDialog.close();
			},
			/*
			 * on cancel, close the dialog
			 */
			handlePlantVHCancel: function () {
				this._oPlantVHDialog.close();
			},
			/*
			 * after close, destroy the dialog
			 */
			handlePlantVHAfterClose: function () {
				this._oPlantVHDialog.destroy();
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
			 * @return {sap.ui.core.IconColor} icon color
			 * @public
			 */
			getSupplierOverallStatusState: function (sSupplierOverallStatus) {
				return ReuseFormatter.getSupplierOverallStatusState(sSupplierOverallStatus);
			},

			/**
			 * Fire formatter to return icon src based on the distribution line status.
			 * @param {string} sDistLineStatus distribution line status code
			 * @return {string} icon src
			 * 
			 * @public
			 */
			getDistrStatusIcon: function (sDistLineStatus) {
				return Formatter.getDistrStatusIcon(sDistLineStatus);
			},

			/**
			 * Fire formatter to return status state based on the distribution line status.
			 * @param {string} sDistLineStatus distribution line status code
			 * @return { sap.ui.core.IconColor} icon color
			 * @public
			 */
			getDistrStatusState: function (sDistLineStatus) {
				return Formatter.getDistrStatusState(sDistLineStatus);
			},

			/**
			 * Format Boolean value. Return 'Yes' || 'No' string.
			 * @param {boolean} bValue boolean value
			 * @return {string} 'Yes' || 'No' string
			 */
			formatBooleanValue: function (bValue) {
				return Formatter.formatBooleanValue(bValue, this._oResourceBundle);
			},

			/**
			 * Format decimal value. 
			 * @param {string} sValue decimal value
			 * @return {string} decimal value or empty string
			 * @public
			 */
			formatDecimalEmptyValue: function (sValue) {
				return Formatter.formatDecimalEmptyValue(sValue);
			},

			/**
			 * Change smartfield value event handler.
			 * Clear smart field value if there is 0.
			 * @param {sap.ui.base.Event} oEvent change event
			 * @public
			 */
			changeDecimalEmptyHandler: function (oEvent) {
				var sValue = oEvent.getParameter("newValue");
				this._setEmptyDecimalFields(oEvent.getSource(), sValue);
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
			 * Import Standard Text button press event handler.
			 * @param {sap.ui.base.Event} oEvent press event
			 */
			onImportStdTextPress: function (oEvent) {
				this.oStandardTextSH.open();
			},

			/**
			 * Load fragment for Distribution Search Dialog.
			 * @param {sap.ui.base.Event} oEvent press event
			 */
			onHandleDistributionSearchHelp: function (oEvent) {
				var bIsAddBtn = oEvent.getSource().data("btnName") === Constants.DISTRIBUTION_ACTION.ADD;
				if (!this._oDistributionSearchHelpDialog) {
					Fragment.load({
						id: "DistributionSearchHelpDialog",
						name: "vwks.nlp.s2p.mm.pctrcentral.manage.changes.fragments.DistributionSearchDialog",
						controller: this
					}).then(function (oDialog) {
						this._oDistributionSearchHelpDialog = oDialog;
						this.getView().addDependent(this._oDistributionSearchHelpDialog);
						this._oDistributionModel.setProperty("/showAddBtn", bIsAddBtn);

						this._oDistributionSearchHelpDialog.open();
					}.bind(this));
				} else {
					this._oDistributionModel.setProperty("/showAddBtn", bIsAddBtn);
					this._oDistributionSearchHelpDialog.open();
				}
			},

			onBeforeRebindTable: function (oEvent) {
				// Saving smart table reference for expand collapse 
				if (!this._oDistributionSearchHelpTree) {
					this._oDistributionSearchHelpTree = oEvent.getSource().getTable();
					this._oDistributionSearchHelpTree.attachRowSelectionChange(this.onDistributionTreeRowSelectionChanged.bind(this));
				}
			},
			/**
			 * Event handler for Distribution Tree node Select
			 * @param {sap.ui.base.Event} oEvent press event
			 */
			onDistributionTreeRowSelectionChanged: function (oEvent) {
				var iSelectedIndex = oEvent.getParameters().rowIndex;
				var bNodeSelectionRequired = true;

				// In case of recurcise call, either of two will be filled 
				if (this._aPreviousTreeSelectionInterval.length > 0) {
					this._aPreviousTreeSelectionInterval = [];
					return;
				}
				if (this._aRemovedTreeSelectionInterval.length > 0) {
					this._aRemovedTreeSelectionInterval = [];
					return;
				}

				// in case of select all / deselect all and collpase all 
				if (oEvent.getParameters().selectAll === true || oEvent.getParameters().rowIndex === "-1" || oEvent.getParameters().userInteraction ===
					false) {
					return;
				}
				var oTreetableContext = this._oDistributionSearchHelpTree.getContextByIndex(iSelectedIndex);
				var oSelectedTreeNode = this._oDistributionSearchHelpTree.getModel().getProperty(oTreetableContext.getPath());
				// Plant means a lowest level node , we can skip the multiple selection 
				if (oSelectedTreeNode.Ccode === Constants.SELECTED_NODE.PLANT) {
					bNodeSelectionRequired = false;
					return;
				}

				if (bNodeSelectionRequired) {
					this.handleNodeSelection(iSelectedIndex, oSelectedTreeNode);
				}

			},
			/**
			 * Event handler for node Selection
			 * @param {object} iSelectedIndex selected index value
			 * @param {object} oSelectedTreeNode selected tree node
			 */
			handleNodeSelection: function (iSelectedIndex, oSelectedTreeNode) {
				var oTreeNextContext, oNextTreeNode;
				// check if the event is of node selection or removal of selection 
				var aSelectedIndexs = this._oDistributionSearchHelpTree.getSelectedIndices();
				// checked the index is within the selected tree index , if not means its a case of removal
				var sSelectionEvent = Object.keys(aSelectedIndexs).filter(function (key) {
					return aSelectedIndexs[key] === iSelectedIndex;
				})[0];

				// check a case for Deselection after a collapse , we need not remove interval, this is to avoid issue 
				// reselection after collapse, this is applicable to parent nodes
				if (sSelectionEvent === undefined) {
					// remove selection Interval 
					oTreeNextContext = this._oDistributionSearchHelpTree.getContextByIndex(iSelectedIndex + 1);
					if (!oTreeNextContext) {
						return;
					} else {
						if (!this._oDistributionSearchHelpTree.isIndexSelected(iSelectedIndex + 1)) {
							// next node is already unselected,so need to look for interval
							return;
						}
					}
				}

				var iStartInterval = iSelectedIndex; // start index 
				var iEndInterval = iSelectedIndex; // end Index
				var iNextIndex = iSelectedIndex; // iteration
				var bStopNodeSearch = true;
				var aPreviousSeletedIndex = [];
				aPreviousSeletedIndex.push(iStartInterval);

				while (bStopNodeSearch) {
					// code block to be executed
					iNextIndex++;
					oTreeNextContext = this._oDistributionSearchHelpTree.getContextByIndex(iNextIndex);
					if (oTreeNextContext === undefined) { // this is the case of being the last node in the tree, stop iteration
						iNextIndex--;
						iEndInterval = iNextIndex;
						bStopNodeSearch = false;
						break;
					}
					oNextTreeNode = this._oDistributionSearchHelpTree.getModel().getProperty(oTreeNextContext.getPath());
					// Next node is at the same level as selected node you have comppleted your interval
					if (oNextTreeNode.HierarchyNodeLevel === oSelectedTreeNode.HierarchyNodeLevel) {
						iNextIndex--;
						iEndInterval = iNextIndex;
						bStopNodeSearch = false;
						break;
					}
					// The selected node was a lower level parent and it has countered another 0 level node, which is higher up so stop
					if (oNextTreeNode.HierarchyNodeLevel === "0") {
						iNextIndex--;
						iEndInterval = iNextIndex;
						bStopNodeSearch = false;
						break;
					}
					iEndInterval = iNextIndex; // just continue the loop
					aPreviousSeletedIndex.push(iNextIndex);
				}
				this.handleEventSelection(sSelectionEvent, aPreviousSeletedIndex, iStartInterval, iEndInterval);
			},
			/**
			 * Event handler for event Selection
			 * @param {object} sSelectionEvent to check type of event
			 * @param {object} aPreviousSeletedIndex previously selected index value
			 * @param {object} iStartInterval start index
			 * @param {object} iEndInterval end index
			 */
			handleEventSelection: function (sSelectionEvent, aPreviousSeletedIndex, iStartInterval, iEndInterval) {
				if (sSelectionEvent === undefined) {
					// remove selection Interval 
					this._aRemovedTreeSelectionInterval = aPreviousSeletedIndex;
					this._oDistributionSearchHelpTree.removeSelectionInterval(iStartInterval, iEndInterval);
				} else {
					// Set Selection Sequentally in expanded tree nodes 
					this._aPreviousTreeSelectionInterval = aPreviousSeletedIndex;
					this._oDistributionSearchHelpTree.addSelectionInterval(iStartInterval, iEndInterval);
				}
			},

			/**
			 * Return array of selected nodes in the tree table.
			 * @return {Object[]} aDistributionSearchTreeSelectionNodes array of selected items
			 */
			getDistributionSearchSelectedTreeNodes: function () {
				var aDistributionSearchTreeSelectionNodes = [];
				var aIndices = this._oDistributionSearchHelpTree.getSelectedIndices();
				for (var i = 0; i < aIndices.length; i++) {
					//fetch the data of selected rows by index
					var oTableSelectedIndexContext = this._oDistributionSearchHelpTree.getContextByIndex(aIndices[i]);
					var oSelectedTreeNode = oTableSelectedIndexContext.getObject();
					aDistributionSearchTreeSelectionNodes.push(oSelectedTreeNode);
				}
				return aDistributionSearchTreeSelectionNodes;
			},

			/**
			 * Copy distribution lines.
			 */
			handleDistributionSearchHelpCopy: function () {
				var oHierTable, sPath, aCopyDistributionPromises = [];
				var oBindingContext = this.getView().getBindingContext();
				var aDistributionSearchTreeSelectionNodes = this.getDistributionSearchSelectedTreeNodes();
				var oParameters = {
					"CentralPurchaseContract": oBindingContext.getProperty("CentralPurchaseContract")
				};
				if (this._sCurrentView === Constants.VIEW_ID.HIERARCHY_HEADER) {
					oHierTable = this._oHierHdrDistrTable;
					sPath = Constants.FUNCTION_IMPORT.HIER_COPY_DIST;
				} else {
					oHierTable = this._oHierItemDistrTable;
					sPath = Constants.FUNCTION_IMPORT.HIER_ITEM_COPY_DIST;
					oParameters.CentralPurchaseContractItem = oBindingContext.getProperty("CentralPurchaseContractItem");
				}
				// based on the level (header or item) get selected distribution line
				var oSelectedDistribution = oHierTable.getSelectedItem().getBindingContext().getObject();

				oParameters.DraftUUID = oSelectedDistribution.DraftUUID;
				// if there are no selected nodes in dialog tree, use the data of selected distribution line
				if (!aDistributionSearchTreeSelectionNodes.length) {
					this._addCompanyCodePlanParameters(oSelectedDistribution, oParameters);
					aCopyDistributionPromises.push(this.copyDistributions(sPath, oParameters));
				} else {
					aCopyDistributionPromises = aDistributionSearchTreeSelectionNodes.map(function (oDistributionLineNode) {
						this._addCompanyCodePlanParameters(oDistributionLineNode, oParameters);
						return this.copyDistributions(sPath, oParameters);
					}, this);
				}

				this._oDistributionSearchHelpTree.setBusy(true);

				Promise.all(aCopyDistributionPromises).then(function (oHierarchyTable, oData) {
					this.handlePromiseResolve(oHierarchyTable, oData);
				}.bind(this, oHierTable)).catch(function (oError) {
					this.handleErrorForDistribution(oError);
				}.bind(this));
			},
			/**
			 * Handle error scenario in case of failure of add or copy distribution 
			 * @param {object} oError object
			 */
			handleErrorForDistribution: function (oError) {
				if (JSON.parse(oError.responseText)) {
					var aErrors = JSON.parse(oError.responseText).error.innererror.errordetails;
					this.displayErrorMessageForAddORCopyDistribution(aErrors);

				}
				this._oDistributionSearchHelpTree.setBusy(false);
			},
			/**
			 * Handle error scenario in case of add or copy distribution success
			 * @param {object} oData object
			 */
			handleErrorForDistributionSuccess: function (oData) {
				var aErrors = JSON.parse(oData[0].responseText).error.innererror.errordetails;
				this.displayErrorMessageForAddORCopyDistribution(aErrors);
				this._oDistributionSearchHelpTree.setBusy(false);
			},

			/**
			 * Display error message for add or copy distribution lines
			 * @param {array} aErrors array of error objects
			 */
			displayErrorMessageForAddORCopyDistribution: function (aErrors) {
				var errorText = "";
				for (var errNum = 0; errNum < aErrors.length; errNum++) {
					errorText = errorText + "\n" + aErrors[errNum].message;
				}
				MessageBox.error(errorText);
			},

			/**
			 * Handler for outcome of add or copy distribution promise
			 * @param {object} oHierTable hierarchy distribution table at current level
			 * @param {object} oData object
			 */
			handlePromiseResolve: function (oHierTable, oData) {
				if (oData && oData.length > 0) {
					// in case of error
					if (oData[0].responseText !== undefined) {
						this.handleErrorForDistributionSuccess(oData);
					} else {
						this._oDistributionSearchHelpTree.setBusy(false);
						oHierTable.getBinding("items").refresh();
						this.handleDistributionSearchDialogClose();
					}
				}
			},
			/**
			 * Added 'Company code' and 'Plant' parameters to Copy FI request based on the selected node type.
			 * @param {object} oDistribution distribution line to copy
			 * @param {object} oParameters url parameters object
			 */
			_addCompanyCodePlanParameters: function (oDistribution, oParameters) {
				if (oDistribution.Ccode === Constants.SELECTED_NODE.PLANT) {
					oParameters.Plant = oDistribution.CompanyCode;
					oParameters.CompanyCode = oDistribution.SuprCode;
				} else {
					oParameters.CompanyCode = oDistribution.CompanyCode || "";
					oParameters.Plant = oDistribution.Plant || "";
				}
			},

			/**
			 * Return Promise with FI call.
			 * @param {string} sPath 'HierCtrCopyDist' or 'HierCtrItemCopyDist' FI path
			 * @param {object} oParameters url parameters
			 * @return {Promise} Promise object
			 */
			copyDistributions: function (sPath, oParameters) {
				return new Promise(function (fnResolve, fnReject) {
					var oModel = this.getView().getModel();
					oModel.callFunction(sPath, {
						method: "POST",
						urlParameters: oParameters,
						success: function (oResponse) {
							fnResolve(oResponse);
						},
						error: function (oError) {
							fnReject(oError);
						}
					});
				}.bind(this));

			},

			handleDistributionSearchHelpAdd: function () {
				var vLevel;
				var oHierTable;
				var aDistributionSearchTreeSelectionNodes = [];
				if (this.getView().getId() ===
					"ui.s2p.mm.pur.central.ctr.sts1::sap.suite.ui.generic.template.ObjectPage.view.Details::C_CntrlPurContrHierHdrTP") {
					vLevel = Constants.LEVEL.HEADER;
				} else {
					vLevel = Constants.LEVEL.ITEM;
				}
				var aPromises = [];
				aDistributionSearchTreeSelectionNodes = this.getDistributionSearchSelectedTreeNodes();

				var oView = this.getView();
				var oBindingContext = oView.getBindingContext();
				var draftuuid = oBindingContext.getProperty("DraftUUID");
				var CentralPurchaseContractItem = oBindingContext.getProperty("CentralPurchaseContractItem");
				var encodedValueCentralPurchaseContract = encodeURIComponent(oBindingContext.getProperty("CentralPurchaseContract"));
				if (vLevel === Constants.LEVEL.ITEM) {
					oHierTable = this._oHierItemDistrTable;
					var itemEntity = "/C_CntrlPurContrHierItemTP";
					var sServiceUrl = itemEntity + "(" + "CentralPurchaseContractItem='" + CentralPurchaseContractItem + "'," +
						"CentralPurchaseContract='" + encodedValueCentralPurchaseContract + "'," + "DraftUUID=guid'" + draftuuid + "'," +
						"IsActiveEntity=false)/to_CntrlPurContrDistributionTP";
					this._oDistributionSearchHelpTree.setBusy(true);
				} else {
					oHierTable = this._oHierHdrDistrTable;
					var headerEntity = "/C_CntrlPurContrHierHdrTP";
					sServiceUrl = headerEntity + "(" + "CentralPurchaseContract='" + encodedValueCentralPurchaseContract + "'," + "DraftUUID=guid'" +
						draftuuid + "'," +
						"IsActiveEntity=false)/to_CntrlPurContrHdrDistrTP";
					this._oDistributionSearchHelpTree.setBusy(true);
				}

				for (var i = 0; i < aDistributionSearchTreeSelectionNodes.length; i++) {
					var oDataForEntry = {};
					oDataForEntry.CompanyCode = aDistributionSearchTreeSelectionNodes[i].CompanyCode;
					oDataForEntry.ProcurementHubSourceSystem = aDistributionSearchTreeSelectionNodes[i].ExtSourceSystem;
					oDataForEntry.ProcmtHubCompanyCodeGroupingID = aDistributionSearchTreeSelectionNodes[i].CcodeGroup;
					oDataForEntry.PurchasingDocumentCategory = Constants.PURCHANSING_DOCUMENT_CATEGORY.CONTRACT;
					if (aDistributionSearchTreeSelectionNodes[i].Ccode === Constants.SELECTED_NODE.PLANT) {
						oDataForEntry.Plant = aDistributionSearchTreeSelectionNodes[i].CompanyCode;
						oDataForEntry.CompanyCode = aDistributionSearchTreeSelectionNodes[i].SuprCode;
					}
					//in case of plant it should from the parent 
					var oPromise = this.addDistribution(oView, aDistributionSearchTreeSelectionNodes[i], sServiceUrl, oDataForEntry);
					aPromises.push(oPromise);

				}
				Promise.all(aPromises).then(function (oHierarchyTable, oData) {
					this.handlePromiseResolve(oHierarchyTable, oData);
				}.bind(this, oHierTable)).catch(function (oError) {
					this.handleErrorForDistribution(oError);
				}.bind(this));
			},

			addDistribution: function (oView, oSelectedIndexes, sServiceUrl, oDataForEntry) {
				return new Promise(function (fnResolve, fnReject) {
					var oModel = oView.getModel();
					oModel.create(sServiceUrl, oDataForEntry, {
						success: function (oResponse) {
							fnResolve(oResponse);
						},
						error: function (oError) {
							fnReject(oError);
						}
					});
				});
			},
			handleDistributionSearchDialogClose: function () {
				this._oDistributionSearchHelpDialog.close();
				this.getView().removeDependent(this._oDistributionSearchHelpDialog);
				this._oDistributionSearchHelpDialog.destroy();
				this._oDistributionSearchHelpDialog = null;
				this._oDistributionSearchHelpTree.destroy();
				this._oDistributionSearchHelpTree = null;
			},
			handleDistributionSearchExapndAll: function () {
				if (this._oDistributionSearchHelpTree && !this._oDistributionSearchHelpTree.isExpanded()) {
					// the recommended hierarchy level is 4  for smart tee in the guidelines exapnding it to 4> Recursive expansion is 
					// not supported 
					this._oDistributionSearchHelpTree.expandToLevel(10);
				}
			},

			/**
			 * Pull from BOM press event handler.
			 * @param {sap.ui.base} oEvent press event
			 */
			handlePullFromBOM: function (oEvent) {
				var iRowCount = 0;
				iRowCount = this.oZsbComponentGridTable.getBinding("rows").getLength();
				if (iRowCount > 0) {
					MessageBox.show(this._oResourceBundle.getText("BOMMessageContent"), {
						title: this._oResourceBundle.getText("BOMMessageTitle"),
						actions: [MessageBox.Action.YES, MessageBox.Action.NO],
						emphasizedAction: MessageBox.Action.NO,
						onClose: this.onClosePopup.bind(this)
					});
				} else {
					this._triggerZSBBOM();
				}
			},

			/*
			 * Method for onClose action of popup.
			 * @param {sap.m.MessageBox.Action} oAction
			 */
			onClosePopup: function (oAction) {
				if (oAction === MessageBox.Action.YES) {
					this._triggerZSBBOM();
				}
			},

			/**
			 * Method to call ZSB BOM Promise and handle resolve/rejection of promise
			 */
			_triggerZSBBOM: function () {
				this.getView().setBusy(true);
				var oZSBBOMPromise = this._getZSBBOMPromise();
				oZSBBOMPromise
					.then(function (oResponse) {
						this.onBOMPromiseComplete();
					}.bind(this))
					.catch(function (oError) {
						this._showErrorMessageBox(JSON.parse(oError.responseText));
					}.bind(this))
					.finally(function () {
						this.getView().setBusy(false);
					}.bind(this));
			},

			/**
			 * Method to refresh table contents, Last-BOM-Update
			 */
			onBOMPromiseComplete: function () {
				this.oZsbComponentGridSmartTable.rebindTable();
				this.getView().getModel().refresh();
			},

			/**
			 * Error Handling for messages sent from BADI
			 * @param {Object} oError - error object sent from BADI
			 */
			_showErrorMessageBox: function (oError) {
				if (oError.error && oError.error.innererror && oError.error.innererror.errordetails) {
					var aErrorMessage = oError.error.innererror.errordetails;
					var sMessage = "";
					for (var i = 0; i < aErrorMessage.length; i++) {
						var sNewLine = "";
						if (i !== aErrorMessage.length - 1) {
							sNewLine = "\n";
						}
						sMessage = sMessage + (i + 1) + ". " + aErrorMessage[i].message + sNewLine;
					}
					if (sMessage) {
						MessageBox.error(sMessage);
					}
				}
			},

			/**
			 * Method to call function import to get updated BOM data
			 * @return {Object} Promise Object of the function import
			 **/
			_getZSBBOMPromise: function () {
				var oModel = this.getView().getModel();
				var oObject = this.getView().getBindingContext().getObject();
				var sPlant = this.aSelectedPlants.join();
				var oZSBBOMPromise = new Promise(function (resolve, reject) {
					oModel.callFunction(Constants.FUNCTION_IMPORT.ZSB_ACTION, {
						method: "GET",
						urlParameters: {
							MaterialZSB: oObject.PurchasingCentralMaterial,
							SPlant: sPlant,
							Contract: oObject.CentralPurchaseContract,
							ContractItem: oObject.CentralPurchaseContractItem,
							DRAFTUUID: oObject.DraftUUID,
							HdrDraftUUID: oObject.ParentDraftUUID
						},
						success: function (oData) {
							resolve(oData);
						},
						error: function (oError) {
							reject(oError);
						}
					});
				});
				return oZSBBOMPromise;
			},

			handleDistributionSearchCollapseAll: function (oEvent) {
				if (this._oDistributionSearchHelpTree) {
					this._oDistributionSearchHelpTree.collapseAll();
				}
			},

			/**
			 * Method to show valuation date error
			 */
			_showValuationDate: function () {
				MessageBox.error(this._oResourceBundle.getText("ValuationDateErrorMessage"));
			},

			/**
			 * Calculate price press event handler.
			 * @param {sap.ui.base} oEvent press event
			 */
			handleCalculatePrice: function (oEvent) {
				var dValuationDate = this.getView().getBindingContext().getProperty("ValDate");
				if (dValuationDate) {
					this.getView().setBusy(true);

					var oZSBCalPricePromise = this._getZSBCalPricePromise();
					oZSBCalPricePromise
						.then(function (oResponse) {
							this.oZsbComponentGridSmartTable.rebindTable();
							this.getView().getModel().refresh();
						}.bind(this))
						.catch(function (oError) {
							this._showErrorMessageBox(JSON.parse(oError.responseText));
						}.bind(this))
						.finally(function () {
							this.getView().setBusy(false);
						}.bind(this));
				} else {
					this._showValuationDate();
				}
			},

			/**
			 * Method to call function import to calculate prices
			 * @return {Object} Promise Object of the function import
			 **/
			_getZSBCalPricePromise: function () {
				var oModel = this.getView().getModel();
				var oObject = this.getView().getBindingContext().getObject();
				var sPlant = this.aSelectedPlants.join();
				var oZSBCalPricePromise = new Promise(function (resolve, reject) {
					oModel.callFunction(Constants.FUNCTION_IMPORT.ZSB_CALCULATE_PRICE, {
						method: "GET",
						urlParameters: {
							ValuationDate: oObject.ValDate,
							Plant: sPlant,
							Contract: oObject.CentralPurchaseContract,
							ContractItem: oObject.CentralPurchaseContractItem,
							MaterialZSB: oObject.PurchasingCentralMaterial,
							DRAFTUUID: oObject.DraftUUID,
							HdrDraftUUID: oObject.ParentDraftUUID
						},
						success: function (oData) {
							resolve(oData);
						},
						error: function (oError) {
							reject(oError);
						}
					});
				});
				return oZSBCalPricePromise;
			},

			/**
			 * Take Over ZSBCondtions event handler.
			 * @param {sap.ui.base} oEvent press event
			 */
			handleTakeOverZSBConditions: function (oEvent) {
				var dValuationDate = this.getView().getBindingContext().getProperty("ValDate");
				if (dValuationDate) {
					this.getView().setBusy(true);

					var oZSBTakeOverPromise = this._getZSBTakeOverPromise();
					oZSBTakeOverPromise
						.then(function (oResponse) {
							this.oZsbComponentGridSmartTable.rebindTable();
							this.getView().getModel().refresh();
						}.bind(this))
						.catch(function (oError) {
							this._showErrorMessageBox(JSON.parse(oError.responseText));
						}.bind(this))
						.finally(function () {
							this.getView().setBusy(false);
						}.bind(this));
				} else {
					this._showValuationDate();
				}
			},

			/**
			 * Method to call function import to Take over ZSB Conditions
			 * @return {Object} Promise Object of the function import
			 **/
			_getZSBTakeOverPromise: function () {
				var oModel = this.getView().getModel();
				var oObject = this.getView().getBindingContext().getObject();
				var sPlant = this.aSelectedPlants.join();
				var oZSBTakeOverPromise = new Promise(function (resolve, reject) {
					oModel.callFunction(Constants.FUNCTION_IMPORT.CREATE_ZSB_COND, {
						method: "GET",
						urlParameters: {
							Contract: oObject.CentralPurchaseContract,
							ContractItem: oObject.CentralPurchaseContractItem,
							Plant: sPlant,
							DRAFTUUID: oObject.DraftUUID,
							HdrDraftUUID: oObject.ParentDraftUUID,
							ValuationDate: oObject.ValDate
						},
						success: function (oData) {
							resolve(oData);
						},
						error: function (oError) {
							reject(oError);
						}
					});
				});
				return oZSBTakeOverPromise;
			},

			/**
			 * Method to get Popover data.
			 * @param {string} sId id of info icon
			 * @return {Object} oPopoverData with title and content of the popover
			 */
			getPopoverData: function (sId) {
				var oBindingContextObject = this.getView().getBindingContext().getObject();
				var oPopoverData = {
					sTitle: "",
					sContent: ""
				};
				if (sId === this.sPayTermsId || sId === this.sHierPayTermsId || sId === this.sItmDistPayTermsId || sId === this.sHdrDistPayTermsId ||
					sId === this.sHierItmDistPayTermsId ||
					sId === this.sHierHdrDistPayTermsId) {
					oPopoverData = {
						sTitle: this._oCntrlPCItemResourceBundle.getText("PaymentTerms") + " " + oBindingContextObject.PaymentTerms,
						sContent: oBindingContextObject.PayTermFullText
					};
				} else if (sId === this.sIncotermId || sId === this.sHierIncotermId || sId === this.sItmDistIncotermId || sId === this.sHdrDistIncotermId ||
					sId === this.sHierItmDistIncotermId ||
					sId === this.sHierHdrDistIncotermId || sId === this.sItmIncotermId || sId === this.sHierItmIncotermId) {
					oPopoverData = {
						sTitle: this._oCntrlPCItemResourceBundle.getText("Incoterm") + " " + oBindingContextObject.IncotermsClassification,
						sContent: oBindingContextObject.IncoTermFullText
					};
				} else {
					oPopoverData = {
						sTitle: this._oCntrlPCItemResourceBundle.getText("ShippIns") + " " + oBindingContextObject.ShippingInstruction,
						sContent: oBindingContextObject.ShipInsFullText
					};
				}
				return oPopoverData;
			},

			/**
			 * Method to display LongText Popover 
			 * @param {sap.ui.base.Event} oEvent The event object
			 */
			handlePreviewButtonClick: function (oEvent) {
				var sId = oEvent.getSource().getId();
				var oPopoverData = this.getPopoverData(sId);
				var oPreviewBtn = oEvent.getSource();
				if (!this.oLongTextPopover) {
					this.oLongTextPopover = Fragment.load({
						name: "vwks.nlp.s2p.mm.pctrcentral.manage.changes.fragments.LongTextPopover",
						controller: this
					}).then(function (oLngTextPopover) {
						this.getView().addDependent(oLngTextPopover);
						return oLngTextPopover;
					}.bind(this));
				}
				this.oLongTextPopover.then(function (oLngTextPopover) {
					oLngTextPopover.setProperty("title", oPopoverData.sTitle);
					oLngTextPopover.removeContent(0);
					oLngTextPopover.insertContent(new FormattedText("", {
						htmlText: oPopoverData.sContent
					}));
					oLngTextPopover.openBy(oPreviewBtn);
				});
			},

			/**
			 * Find Contracts press event handler
			 */
			handleFindContracts: function () {
				var dValuationDate = this.getView().getBindingContext().getProperty("ValDate");
				if (dValuationDate) {
					var oZSBFindContractsPromise = this._getZSBFindContractsPromise("");
					oZSBFindContractsPromise.then(function (oResponse) {
						if (oResponse.ShowPopup) {
							Fragment.load({
								id: "idFindContractsDialog",
								name: "vwks.nlp.s2p.mm.pctrcentral.manage.changes.fragments.FindContractsDialog",
								controller: this
							}).then(function (oDialog) {
								this._oFindContractsDialog = oDialog;

								this._oFindContractsIconTabBar = Fragment.byId("idFindContractsDialog", "idFindContractsIconTabBar");
								this._oFindContractsSmartTable = Fragment.byId("idFindContractsDialog", "idFindContractsSmartTable");

								this.setFindContractsModels();

								this.getView().addDependent(this._oFindContractsDialog);
								this._oFindContractsDialog.open();
							}.bind(this));
						} else {
							this.oZsbComponentGridSmartTable.rebindTable();
							this.getView().getModel().refresh();
						}
					}.bind(this)).catch(function (oError) {
						var oErrorResponseText = JSON.parse(oError.responseText);
						if (oErrorResponseText.error.code === Constants.ZSB_ERROR_CODES.FIND_CONTRACTS) {
							this._showCostDeletionWarning(false, oErrorResponseText.error.message.value);
						}
					}.bind(this));
				} else {
					this._showValuationDate();
				}
			},

			/**
			 * Method to show warning message to user in case different supplier
			 * @param {boolean} bFindContractDialog - determines if call is from FI or Find Contract Popup
			 * @param {string} sMessage - Warning message title received from BE
			 */
			_showCostDeletionWarning: function (bFindContractDialog, sMessage) {
				MessageBox.warning(sMessage, {
					actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
					emphasizedAction: MessageBox.Action.OK,
					onClose: this._deleteCosts.bind(this, bFindContractDialog)
				});
			},

			/**
			 * Method to delete costs
			 * @param {boolean} bFindContractDialog - determines if call is from FI or Find Contract Popup
			 * @param {string} sAction - user action value
			 */
			_deleteCosts: function (bFindContractDialog, sAction) {
				if (sAction === MessageBox.Action.OK) {
					if (bFindContractDialog) {
						var oZSBFindContractsPostCallPromise = this._getFindContractsPostCallPromise("X");
						oZSBFindContractsPostCallPromise.then(function (oResponse) {
							this.onFindContractsDialogCancel();
							this.oZsbComponentGridSmartTable.rebindTable();
							this.getView().getModel().refresh();
						}.bind(this)).catch(function (oError) {
							this._showErrorMessageBox(JSON.parse(oError.responseText));
						}.bind(this));
					} else {
						var oZSBFindContractsPromise = this._getZSBFindContractsPromise("X");
						oZSBFindContractsPromise.then(function (oResponse) {
							this.oZsbComponentGridSmartTable.rebindTable();
							this.getView().getModel().refresh();
						}.bind(this)).catch(function (oError) {
							this._showErrorMessageBox(JSON.parse(oError.responseText));
						}.bind(this));
					}
				}
			},

			/**
			 * Method to intial Find Contracts Model
			 */
			setFindContractsModels: function () {
				var oi18nModel = this.getView().getModel(
					"i18n|sap.suite.ui.generic.template.ObjectPage|C_CntrlPurchaseContractItemTP");
				this._oFindContractsDialog.setModel(oi18nModel, "i18n");
				var oFindContractsModel = new JSONModel({
					isConfirmEnabled: false,
					isFirstTimeOpen: true,
					selectedMultipleContracts: [],
					selectedNoContracts: [],
					infoLabel: oi18nModel.getProperty("SingleContractInfoLabel"),
					selectedTabKey: Constants.TAB_KEYS.SINGLE
				});
				this._oFindContractsDialog.setModel(oFindContractsModel, "findContracts");
			},

			/**
			 * Return "findContracts" local JSON model assigned to the Find Contracts dialog.
			 * @return {sap.ui.model.json.JSONModel} "findContracts" json model
			 */
			getFindContractsModel: function () {
				return this._oFindContractsDialog.getModel("findContracts");
			},

			/**
			 * Event handle for selection change on table
			 * @param {sap.ui.base.Event} oEvent - event object
			 */
			onTableSelectionChange: function (oEvent) {
				var oEventParams = oEvent.getParameters();
				var bIsSelectAll = oEventParams.selectAll;
				var oModel = this.getFindContractsModel();

				// true if the "Multiple Contracts" tab is selected
				var bIsMultipleSelected = oModel.getProperty("/selectedTabKey") === Constants.TAB_KEYS.MULTIPLE;
				// true if the "No Contract" tab is selected
				var bIsNoContractSelected = oModel.getProperty("/selectedTabKey") === Constants.TAB_KEYS.ROD;
				var sSelectedContractsProp = bIsMultipleSelected ? "/selectedMultipleContracts" : "/selectedNoContracts";
				var aSelectedContracts = oModel.getProperty(sSelectedContractsProp);

				if (bIsSelectAll) {
					oEvent.preventDefault();
				}

				oModel.setProperty(sSelectedContractsProp, aSelectedContracts);
				if (bIsMultipleSelected) {
					this._checkSelectionRules(oEventParams.listItems, bIsSelectAll);
				} else if (bIsNoContractSelected) {
					this._updateSelectedFindContracts(aSelectedContracts, oEventParams.listItems);
				}
			},

			/**
			 * Return all items from Find Contracts table.
			 * @param {sap.m.Table} oTable - inner Find Contracts responsive table
			 * @param {boolean} bIsMultipleSelected - true, if "Multiple" tab is selected
			 * @return {Object[]} items array: id, group, data
			 */
			_getAllSelectedContractsData: function (oTable, bIsMultipleSelected) {
				return oTable.getItems().reduce(function (aResult, oItem) {
					var sSelectedItemGroup = oItem.getGroupAnnouncement();
					// consider selected items in 'Multiple Contracts' (except group items) and all items in 'No Contracts'
					if (bIsMultipleSelected && sSelectedItemGroup || !bIsMultipleSelected) {
						this._pushSelectedItemData(oItem, aResult);
					}
					return aResult;
				}.bind(this), []);
			},

			/**
			 * Add new selected contracts to json model in case it's selected 
			 * or remove contract in case it's unselected.
			 * @param {Object[]} aModelSelContracts - selected contracts array from model
			 * @param {Object[]} aNewSelConracts - new selected contracts array
			 * @param {boolean} bIsSelectAll - true, if selectAll property is true
			 */
			_updateSelectedFindContracts: function (aModelSelContracts, aNewSelConracts, bIsSelectAll) {
				aNewSelConracts.forEach(function (oSelectedItem) {
					var iIndex = aModelSelContracts.findIndex(function (oSelectedContract) {
						return oSelectedContract.id === oSelectedItem.getId();
					});
					if (!~iIndex && !bIsSelectAll) {
						oSelectedItem.setSelected(true);
						this._pushSelectedItemData(oSelectedItem, aModelSelContracts);
					} else if (~iIndex && !bIsSelectAll) {
						oSelectedItem.setSelected(false);
						aModelSelContracts.splice(iIndex, 1); // remove one contract from iIndex position
					} else if (!~iIndex && bIsSelectAll) {
						oSelectedItem.setSelected(false);
					}
				}, this);
			},

			/**
			 * Push the config for selected item to the array.
			 * @param {sap.ui.core.ListItem} oSelectedItem - selected contract item
			 * @param {Object[]} aSelectedContracts - selected contracts array
			 */
			_pushSelectedItemData: function (oSelectedItem, aSelectedContracts) {
				var sSelectedItemGroup = oSelectedItem.getGroupAnnouncement();
				var sSelectedContractId = oSelectedItem.getId();
				var oSelectedListItemData = oSelectedItem.getBindingContext().getObject();
				aSelectedContracts.push({
					id: sSelectedContractId,
					group: sSelectedItemGroup,
					data: oSelectedListItemData
				});
			},

			/**
			 * Method to check selection rules.
			 * @param {Object[]} aNewSelectedItems - new selected contracts array
			 * @param {boolean} bIsSelectAll - true, if selectAll property is true
			 */
			_checkSelectionRules: function (aNewSelectedItems, bIsSelectAll) {
				var aUpdatedItems = aNewSelectedItems.slice();
				var oModel = this.getFindContractsModel();
				var oi18nModel = this._oFindContractsDialog.getModel("i18n");
				var aSelectedContracts = oModel.getProperty("/selectedMultipleContracts");
				var aAllMultipleContracts = oModel.getProperty("/allMultipleContracts");

				var oGroupCount = {};
				var bIsConfirmEnabled = true;
				var bIsSelectionCorrect = true;

				this._updateSelectedFindContracts(aSelectedContracts, aNewSelectedItems, bIsSelectAll);

				// fill oGroupCount object with info {groupName: numberOfSelectedContracts}
				aSelectedContracts.forEach(function (oSelectedItemConfig) {
					var sGroupName = oSelectedItemConfig.group;
					oGroupCount[sGroupName] = oGroupCount[sGroupName] === undefined ? 1 : ++oGroupCount[sGroupName];
				});

				// how many groups have selected contracts
				var iSelectedGroups = Object.getOwnPropertyNames(oGroupCount).length;

				if (!aAllMultipleContracts.length) {
					// if there is no data in Multiple tab
					bIsSelectionCorrect = true;
					bIsConfirmEnabled = true;
				} else if (iSelectedGroups && this.getFindContractsMultipleGroups().length === iSelectedGroups) {
					// if each group has at least one selected contract
					for (var sGroup in oGroupCount) {
						// if the group has more than one selected contract - show warning msg
						if (oGroupCount[sGroup] > 1) {
							bIsSelectionCorrect = false;
							break;
						}
					}
				} else {
					// if at least one group doesn't have selected contract
					bIsSelectionCorrect = false;
					bIsConfirmEnabled = false;
					aUpdatedItems = [];
				}

				if (bIsSelectAll) {
					// not to allow selectAll action, show warning msg
					bIsSelectionCorrect = false;
					aUpdatedItems = [];
				}

				oModel.setProperty("/isSelectionCorrect", bIsSelectionCorrect);
				oModel.setProperty("/isConfirmEnabled", bIsConfirmEnabled);

				if (!bIsSelectionCorrect) {
					MessageBox.warning(oi18nModel.getProperty("SelectContractsWarningMsg"));
					this._updateSelectedFindContracts(aSelectedContracts, aUpdatedItems, bIsSelectAll);
				}
			},

			/**
			 * Tab Selection handler for IconTabBar in Find Contracts Dialog
			 * @param {sap.ui.base.Event} oEvent - event object
			 */
			onFindContractsTabSelection: function (oEvent) {
				var oFindContractsModel = this.getFindContractsModel();
				var oi18nModel = this._oFindContractsDialog.getModel("i18n");
				switch (oEvent.getParameter("selectedKey")) {
				case "02":
					oFindContractsModel.setProperty("/infoLabel", oi18nModel.getProperty("MultipleContractsInfoLabel"));
					break;
				case "01":
					oFindContractsModel.setProperty("/infoLabel", oi18nModel.getProperty("SingleContractInfoLabel"));
					break;
				case "03":
					oFindContractsModel.setProperty("/infoLabel", oi18nModel.getProperty("UOMMismatchInfoLabel"));
					break;
				case "04":
					oFindContractsModel.setProperty("/infoLabel", oi18nModel.getProperty("NoContractInfoLabel"));
					break;
				}
				this._oFindContractsSmartTable.rebindTable();
			},

			/**
			 * Initialisation method for smart table to bind path
			 */
			onInitialiseFindContractsSmartTable: function () {
				var sUrlPath = this._getFindContractsSmartTableBindingPath();
				this._oFindContractsSmartTable.setTableBindingPath(sUrlPath);
				this._oFindContractsSmartTable.rebindTable();
			},

			/**
			 * Method to get smart table binding path
			 *  @return {String} binding path for the smart table
			 */
			_getFindContractsSmartTableBindingPath: function () {
				var oBindingContext = this.getView().getBindingContext();
				var sItemDraftUUID = oBindingContext.getProperty("DraftUUID");
				var dValuationDate = oBindingContext.getProperty("ValDate");
				var oFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
					pattern: "yyyy-MM-ddTHH%3Amm%3Ass"
				});
				dValuationDate = oFormat.format(dValuationDate);
				return "/" + Constants.ENTITYSET.ZSB_FIND_CONTRACTS + "(p_draftuuid=guid'" + sItemDraftUUID +
					"',p_valuationdate=datetime'" + dValuationDate + "')/Set";
			},

			/**
			 * On beforeRebind table method for smart table in Find Contracts Dialog
			 * @param {sap.ui.base.Event} oEvent - event object
			 */
			onFindContractsRebindTable: function (oEvent) {                
				var aFindContractsFilter = this._createFindContractsFilters(this._oFindContractsIconTabBar.getSelectedKey());
				this.updateFindContractsBindingParameters(oEvent, aFindContractsFilter);
			},

            /**
			 * Method to update find contracts binding parameters
			 * @param {sap.ui.base.Event} oEvent - event object
             * @param {sap.ui.model.Filter[]} aFindContractsFilter - filter parameter
			 */
            updateFindContractsBindingParameters: function (oEvent, aFindContractsFilter) {
                var aFilter = new Filter({
					filters: aFindContractsFilter
				});
				var oInternalMaterialTableBindingParameters = oEvent.getParameter("bindingParams");
				if (aFilter && aFilter.aFilters && aFilter.aFilters.length) {
					if (oInternalMaterialTableBindingParameters) {
						oInternalMaterialTableBindingParameters.filters.push(aFilter);
					}
				}
				if (this._oFindContractsIconTabBar.getSelectedKey() === Constants.TAB_KEYS.MULTIPLE) {
					oInternalMaterialTableBindingParameters.sorter.push(this._getMultipleContractsSorter());
				}
            },

            /**
			 * On beforeRebind table method for Taufung smart table in Find Contracts Dialog
			 * @param {sap.ui.base.Event} oEvent - event object
			 */
            onFindContractsTaufungRebindTable: function (oEvent) {
                var aFindContractsFilter = this._createFindContractsFilters(Constants.QUALIFIER.TAUFUNG);
                this.updateFindContractsBindingParameters(oEvent, aFindContractsFilter);
            },

            /**
			 * On beforeRebind table method for RoD smart table in Find Contracts Dialog
			 * @param {sap.ui.base.Event} oEvent - event object
			 */
            onFindContractsRodRebindTable: function (oEvent) {
                var aFindContractsFilter = this._createFindContractsFilters(Constants.QUALIFIER.ROD);
                this.updateFindContractsBindingParameters(oEvent, aFindContractsFilter);
            },

			/**
			 * On update finished table event handler in Find Contracts Dialog.
			 * @param {sap.ui.base.Event} oEvent - event object
			 */
			onFindContractsUpdateFinished: function (oEvent) {
				var aSelectedItems = [];
				var oTable = oEvent.getSource();
				var aTableItems = oTable.getItems();

				var oFindContractsModel = this.getFindContractsModel();
				var sCurTab = oFindContractsModel.getProperty("/selectedTabKey");

				var oConfig = {
					"02": {
						allItemsProp: "/allMultipleContracts",
						modelProp: "/selectedMultipleContracts"
					},
					"04": {
						allItemsProp: "/allNoContracts",
						modelProp: "/selectedNoContracts"
					}
				};
				if (sCurTab === Constants.TAB_KEYS.MULTIPLE || sCurTab === Constants.TAB_KEYS.ROD) {
					aSelectedItems = oFindContractsModel.getProperty(oConfig[sCurTab].modelProp);
					oFindContractsModel.setProperty(oConfig[sCurTab].allItemsProp, aTableItems);
					if (aSelectedItems.length) {
						aSelectedItems.forEach(function (oSelectedItem) {
							oTable.setSelectedItemById(oSelectedItem.id);
						});
					} else {
						if (oFindContractsModel.getProperty("/isFirstTimeOpen")) {
							oFindContractsModel.setProperty("/isFirstTimeOpen", false);

							aTableItems.forEach(function (oSelectedItem) {
								if (oSelectedItem.getBindingContext().getProperty("Selected")) {
									oTable.setSelectedItem(oSelectedItem);
									this._updateSelectedFindContracts(aSelectedItems, [oSelectedItem]);
								}
							}, this);
						}
					}

				}
			},

			/**
			 * Method to create filters to apply on Find Contracts Dialog smart table
             * @param {string} sQualifierValue - qualifier value
			 * @return {array} aFilter - array of generated filters
			 */
			_createFindContractsFilters: function (sQualifierValue) {
				var aFilter = [];
				var oFindContractsFilter = new Filter({
					path: "Qualifier",
					operator: FilterOperator.EQ,
					
                    value1: sQualifierValue
				});
				aFilter.push(oFindContractsFilter);
				return aFilter;
			},

			/**
			 * Sorter method for multiple contracts table
			 * @return {Object} sorted object
			 */
			_getMultipleContractsSorter: function () {
				var oI18nContractItemModel = this.getView().getModel(
					"i18n|sap.suite.ui.generic.template.ObjectPage|C_CntrlPurchaseContractItemTP");
				var fnGroup = function (oCtx) {
					var oGroup = {
						key: oCtx.getObject("Plant") + oCtx.getObject("Material"),
						text: oI18nContractItemModel.getProperty("Material") + ": " + oCtx.getObject("Material") + " - " +
							oI18nContractItemModel.getProperty("Plant") + ": " + oCtx.getObject("Plant")
					};
					this.setFindContractsMultipleGroups(oGroup);
					return oGroup;
				};
				return new sap.ui.model.Sorter("Plant", true, fnGroup.bind(this));
			},

			/**
			 * Method to set groups for Multiple contracts Tab
			 * @param {Object} oGroup - group
			 */
			setFindContractsMultipleGroups: function (oGroup) {
				var oFindContractsModel = this.getFindContractsModel();
				var aGroups = oFindContractsModel.getProperty("/groups") || [];

				var nIndex = aGroups.indexOf(oGroup.key);
				if (!~nIndex) {
					aGroups.push(oGroup.key);
				}
				oFindContractsModel.setProperty("/groups", aGroups);
			},

			/**
			 * Method to get groups of Multiple contracts Tab
			 * @return {Object} OGroup - group
			 */
			getFindContractsMultipleGroups: function () {
				var oFindContractsModel = this.getFindContractsModel();
				return oFindContractsModel.getProperty("/groups");
			},

			/**
			 * Handler method for Confirm button click of Find Contracts Dialog
			 */
			onFindContractsDialogConfirm: function () {
				var oi18nModel = this._oFindContractsDialog.getModel("i18n");
				var aAllMultipleContracts = this.getFindContractsModel().getProperty("/allMultipleContracts");
				// Contracts in Multiple tab were not initialised
				if (!aAllMultipleContracts) {
					return;
				}

				// If user opens dialog and doesn't make any selections, the current state should be checked
				this._checkSelectionRules([]);

				var bIsConfirmEnabled = this.getFindContractsModel().getProperty("/isConfirmEnabled");
				var bIsSelectionCorrect = this.getFindContractsModel().getProperty("/isSelectionCorrect");

				if (!bIsConfirmEnabled && bIsSelectionCorrect) {
					MessageBox.warning(oi18nModel.getProperty("SelectContractsWarningMsg"));
				} else if (bIsConfirmEnabled && bIsSelectionCorrect) {
					this.getView().setBusy(true);

					var oZSBFindContractsPostCallPromise = this._getFindContractsPostCallPromise("");
					oZSBFindContractsPostCallPromise
						.then(function (oResponse) {
							this.onFindContractsDialogCancel();
							this.oZsbComponentGridSmartTable.rebindTable();
							this.getView().getModel().refresh();
						}.bind(this))
						.catch(function (oError) {
							var oErrorResponseText = JSON.parse(oError.responseText);
							if (oErrorResponseText.error.code === Constants.ZSB_ERROR_CODES.FIND_CONTRACTS) {
								this._showCostDeletionWarning(true, oErrorResponseText.error.message.value);
							}
						}.bind(this))
						.finally(function () {
							this.getView().setBusy(false);
						}.bind(this));
				}
			},

			/**
			 * Method to get payload for Find Contracts Post Call
			 * @param {string} sConfirmSupplier - value for CONFIRMSUPPLIER
			 * @return {Object} oPayload - Payload
			 */
			_getFindContractsPostCallPayload: function (sConfirmSupplier) {
				var oFindContractsModel = this.getFindContractsModel();
				var oselectedMultipleContracts = oFindContractsModel.getProperty("/selectedMultipleContracts");
				var oselectedNoContracts = oFindContractsModel.getProperty("/selectedNoContracts");
				var aResults = [];
				oselectedMultipleContracts.forEach(function (oSelectedItem) {
					var oData = oSelectedItem.data;
					var oPayloadData = {
						"Material": oData.Material,
						"Plant": oData.Plant,
						"CentralContract": oData.Ebeln,
						"CentralContractItem": oData.Ebelp,
						"Supplier": oData.Supplier,
						"SupplierPickup": oData.supplier_pickup,
						"Quota": oData.Quota,
						"Qualifier": "02"
					};
					aResults.push(oPayloadData);
				});
				oselectedNoContracts.forEach(function (oSelectedItem) {
					var oData = oSelectedItem.data;
					var oPayloadData = {
						"Material": oData.Material,
						"Plant": oData.Plant,
						"Qualifier": "04"
					};
					aResults.push(oPayloadData);
				});
				var oViewContextObject = this.getView().getBindingContext().getObject();
				var oPayload = {
					"p_draftuuid": oViewContextObject.DraftUUID,
					"p_valuationdate": oViewContextObject.ValDate,
					"HdrDraftUUID": oViewContextObject.ParentDraftUUID,
					"ZSBContractNo": oViewContextObject.CentralPurchaseContract,
					"ZSBContractItem": oViewContextObject.CentralPurchaseContractItem,
					"ConfirmSupplier": sConfirmSupplier,
					"to_Zsb": {
						"results": aResults
					}
				};
				return oPayload;
			},

			/**
			 * Method to trigger POST call to Find contracts
			 * @param {string} sConfirmSupplier - value for CONFIRMSUPPLIER
			 * @return {Object} Promise Object of the Post call
			 **/
			_getFindContractsPostCallPromise: function (sConfirmSupplier) {
				var oViewModel = this.getView().getModel();
				var oZSBFindContractsPostCallPromise = new Promise(function (resolve, reject) {
					oViewModel.create(this._getFindContractsSmartTableBindingPath(), this._getFindContractsPostCallPayload(sConfirmSupplier), {
						success: function (oData) {
							resolve(oData);
						},
						error: function (oError) {
							reject(oError);
						}
					});
				}.bind(this));
				return oZSBFindContractsPostCallPromise;
			},

			/**
			 * Handler method for Cancel button click of Find Contracts Dialog
			 */
			onFindContractsDialogCancel: function () {
				this._oFindContractsDialog.close();
				this._oFindContractsDialog.destroy();
				this._oFindContractsDialog = null;
			},

			/**
			 * Method to call function import to Find contracts
			 * @param {string} sConfirmSupplier - value for CONFIRMSUPPLIER
			 * @return {Object} Promise Object of the function import
			 **/
			_getZSBFindContractsPromise: function (sConfirmSupplier) {
				var oViewModel = this.getView().getModel();
				var oViewContextObject = this.getView().getBindingContext().getObject();
				var sPlant = this.aSelectedPlants.join();
				var oZSBFindContractsPromise = new Promise(function (resolve, reject) {
					oViewModel.callFunction(Constants.FUNCTION_IMPORT.ZSB_FIND_CONTRACTS, {
						method: "GET",
						urlParameters: {
							ValuationDate: oViewContextObject.ValDate,
							Plant: sPlant,
							Contract: oViewContextObject.CentralPurchaseContract,
							ContractItem: oViewContextObject.CentralPurchaseContractItem,
							MaterialZSB: oViewContextObject.PurchasingCentralMaterial,
							DRAFTUUID: oViewContextObject.DraftUUID,
							HdrDraftUUID: oViewContextObject.ParentDraftUUID,
							CONFIRMSUPPLIER: sConfirmSupplier
						},
						success: function (oData) {
							resolve(oData);
						},
						error: function (oError) {
							reject(oError);
						}
					});
				});
				return oZSBFindContractsPromise;
			},

			/*
			 * Visible formatter for Alternative parts button
			 * @param {string} sProcessIndicator Process Indicator Formatter
			 */
			handleAlternatePartsVisibleFormatter: function (sProcessIndicator) {
				if (sProcessIndicator === Constants.PROCESS_INDICATOR.PMATERIAL) {
					return true;
				} else {
					return false;
				}
			},
			/**
			 * Event handler for Alternative Parts button
			 * @param {sap.ui.base.Event} oEvent The event object
			 */
			handleAlternativePartCall: function (oEvent) {
				var oHierObjectContext = this.getView().getBindingContext().getObject();
				var sSupplier = "";
				var sDraftGuid;
				if (this._sCurrentView === Constants.VIEW_ID.HIERARCHY_HEADER) {
					sSupplier = oHierObjectContext.Supplier;
				}
				// On Header entity DraftUUID is taken on Item level ParentDraftUUID is taken 
				if (this._sCurrentView === Constants.VIEW_ID.HEADER || this._sCurrentView === Constants.VIEW_ID.HIERARCHY_HEADER) {
					sDraftGuid = oHierObjectContext.DraftUUID;
				} else if (this._sCurrentView === Constants.VIEW_ID.ITEM || this._sCurrentView === Constants.VIEW_ID.HIERARCHY_ITEM) {
					sDraftGuid = oHierObjectContext.ParentDraftUUID;
				}

				this.getView().getModel().callFunction(Constants.FUNCTION_IMPORT.ALTERNATIVE_PART_CTR, {
					method: "GET",
					urlParameters: {
						"Supplier": sSupplier,
						"Contract": oHierObjectContext.CentralPurchaseContract,
						"DraftUUID": sDraftGuid
					},
					success: this.onAlternativePartsSuccesshandler.bind(this),
					error: this.onAlternativePartsErrorhandler.bind(this)
				});
			},

			/*
			 * on Success , Alternative Parts Success handler trigger header Entity refresh 
			 * @param {Object} oResponse - success response
			 */
			onAlternativePartsSuccesshandler: function (oResponse) {
				var sSuccessMessage;
				if (this._sCurrentView === Constants.VIEW_ID.HIERARCHY_HEADER) {
					sSuccessMessage = this._oResourceBundle.getText("AlternativePartsSuccessMsg");
				} else if (this._sCurrentView === Constants.VIEW_ID.HIERARCHY_ITEM) {
					sSuccessMessage = this._oResourceBundle.getText("AlternativePartsItemSuccessMsg");
				}
				MessageBox.success(sSuccessMessage, {
					actions: [MessageBox.Action.OK],
					onClose: function (sButton) {
						if (sButton === MessageBox.Action.OK) {
							var oModel = this.getView().getModel();
							var sURL = this.getView().getBindingContext().getPath();
							oModel.read(sURL);
						}
					}.bind(this)
				});
			},
			/*
			 * on Error , Alternative Parts Error handler
			 * @param {Object} oError - error message details
			 */
			onAlternativePartsErrorhandler: function (oError) {
				try {
					MessageBox.error(JSON.parse(oError.responseText).error.message.value);
				} catch (e) {
					MessageBox.error(this._oResourceBundle.getText("AlternativePartsErrorMsg"));
				}
			},

			/**
			 * Open Alternative Parts popup and load data.
			 * @param {sap.ui.base.Event} oEvent The event object
			 */
			onAlternativePartsLinkPress: function (oEvent) {
				var oSourceLink = oEvent.getSource();
				var oDistributionLineCtx = oSourceLink.getBindingContext();
				this.oAlternativeParts.loadDialog()
					.then(function () {
						this.oAlternativeParts.setBusy(true);
						return this.oAlternativeParts.loadAlternativeParts(oDistributionLineCtx, this._sCurrentView);
					}.bind(this))
					.then(function (oAlternativeParts) {
						this.oAlternativeParts.setDialogData(oAlternativeParts);
					}.bind(this))
					.finally(function () {
						this.oAlternativeParts.setBusy(false);
					}.bind(this));
			},

			/**
			 * Handle Edit of ZSB
			 */
			handleZSBEdit: function () {
				this._attachZSBColumnTemplateInitialiseById("idManualExchangeRateColumnEditTable");
			},

			/**
			 * Attach initialise column template event by column id.
			 * @param{string}sColumnId for column template
			 */
			_attachZSBColumnTemplateInitialiseById: function (sColumnId) {
				var aColumns = Fragment.byId(this.sZsbGridFragmentId, "idZsbComponentSmartTableGrid").getTable().getColumns();
				var oResColumn = aColumns.find(function (oColumn) {
					return !!~oColumn.getId().indexOf(sColumnId);
				});
				if (!oResColumn) {
					return;
				}
				oResColumn.getTemplate().attachInitialise(this.onColumnTemplateInitialise.bind(this));
			},

			/**
			 * Manual Exchange Rate column template initialise event handler.
			 * @param {sap.ui.base.Event} oEvent initialise event object
			 */
			onColumnTemplateInitialise: function (oEvent) {
				var sValue = oEvent.getSource().getValue();
				this._setEmptyDecimalFields(oEvent.getSource(), sValue);
			},

			/**
			 * Set empty value to field in case of 0.
			 * @param {sap.ui.core.Control} oControl ui control

			 * @param {string} sValue control string value 
			 */
			_setEmptyDecimalFields: function (oControl, sValue) {
				var sNewValue = Formatter.formatDecimalEmptyValue(sValue);
				if (!sNewValue) {
					oControl.setValue(null);
				}
			},

			/**
			 * Event handler for ZSB components analytical table row selection changed
			 */
			onZsbCompRowSelectionChanged: function () {
				var iSelectedIndices = this.oZsbComponentGridTable.getSelectedIndices(),
					bEnableDeleteButton = this.getView().getModel("ui").getData().editable;
				if (iSelectedIndices.length && bEnableDeleteButton) {
					this.getView().getModel("propertyModel").setProperty("/bDeleteLineBtnEnable", true);
				} else {
					this.getView().getModel("propertyModel").setProperty("/bDeleteLineBtnEnable", false);
				}
			},

			/**
			 * Event handler for deletion of entry from ZSB components table 
			 * @param {sap.ui.base.Event} oEvent The event object
			 */
			handleDeleteLine: function (oEvent) {
				var iSelectedIndices = this.oZsbComponentGridTable.getSelectedIndices().length,
					sDeleteConfirmationMessage = "";
				if (iSelectedIndices === 1) {
					sDeleteConfirmationMessage = this._oResourceBundle.getText("DeleteLineConfirmationMessage");
				} else {
					sDeleteConfirmationMessage = this._oResourceBundle.getText("DeleteLinesConfirmationMessage");
				}
				MessageBox.warning(sDeleteConfirmationMessage, {
					title: this._oResourceBundle.getText("DeleteLine"),
					actions: [this._oResourceBundle.getText("DeleteLine"), MessageBox.Action.CANCEL],
					onClose: this.onCloseZsbDelRowPopup.bind(this)
				});
			},

			/**
			 * Method for onClose action of Zsb delete row popup.
			 * @param {sap.m.MessageBox.Action} oAction - provides selected action parameter
			 */
			onCloseZsbDelRowPopup: function (oAction) {
				if (oAction === this._oResourceBundle.getText("DeleteLine")) {
					this.getView().setBusy(true);
					var aSelectedIndices = this.oZsbComponentGridTable.getSelectedIndices(),
						aSelectedRowObject = [];
					for (var i = 0; i < aSelectedIndices.length; i++) {
						aSelectedRowObject.push(this.oZsbComponentGridTable.getContextByIndex(aSelectedIndices[i]).getObject());
					}
					var oModel = this.getView().getModel();
					oModel.setDeferredGroups(["batchFunctionImport"]);
					for (var j = 0; j < aSelectedRowObject.length; j++) {
						oModel.callFunction(Constants.FUNCTION_IMPORT.DELETE_ZSB_COMP, {
							method: "POST",
							batchGroupId: "batchFunctionImport",
							urlParameters: {
								"DraftUUID": this.getView().getBindingContext().getObject().DraftUUID,
								"HdrDraftUUID": this.getView().getBindingContext().getObject().ParentDraftUUID,
								"UniversalId": aSelectedRowObject[j].UniversalId
							}
						});
					}
					oModel.submitChanges({
						batchGroupId: "batchFunctionImport",
						success: this.handleDelZsbCompRowSuccess.bind(this),
						error: this.handleDelZsbCompRowError.bind(this)
					});
				}
				this.oZsbComponentGridTable.clearSelection();

			},

			/**
			 * Event handler for Deletion of entry from ZSB components table functionality success
			 * @param {event} oData - success result
			 * @param {event} oResponse - success response
			 */
			handleDelZsbCompRowSuccess: function (oData, oResponse) {
				this.getView().setBusy(false);
				var oBatchResponse = oData.__batchResponses[0].__changeResponses;
				var sSuccessMessage = "";
				for (var i = 0; i < oBatchResponse.length; i++) {
					sSuccessMessage = sSuccessMessage + oBatchResponse[i].data.results[0].Message + "\n";
				}
				MessageBox.success(sSuccessMessage, {
					actions: [MessageBox.Action.OK]
				});
				this.getView().getModel().refresh();
				this.getView().getModel("propertyModel").setProperty("/bDeleteLineBtnEnable", false);
			},

			/**
			 * Event handler for Deletion of entry from ZSB components table functionality error
			 * @param {event} oError - error result
			 */
			handleDelZsbCompRowError: function (oError) {
				this.getView().setBusy(false);
				if (oError.responseText) {
					var sErrorMsg = JSON.parse(oError.responseText).error.message.value;
					MessageBox.error(sErrorMsg);
				}
			},
			/**
			 * Event handler for Opening Zsb Add line Manually Dialog
			 * 
			 */
			handleAddLineManually: function () {
				this._ozsbSmartForm = null;
				if (!this._oZsbAddLineManualuDialog) {
					Fragment.load({
						name: "vwks.nlp.s2p.mm.pctrcentral.manage.changes.fragments.ZsbAddLineManuallyDialog",
						id: "idZsbAddlineManuallyFragment",
						controller: this
					}).then(function (oPopup) {
						this._oZsbAddLineManualuDialog = oPopup;
						this.getView().addDependent(this._oZsbAddLineManualuDialog);

						var oDummyContext = {
							Material: "",
							MaterialDescription: "",
							ResponsibleBuyer: "",
							Taufung: "",
							// AmountPerZSB: "",
							Plant: "",
							CentralContract: "",
							CentralContractItem: "",
							Supplier: "",
							SupplierPickup: "",
							// Quota: " ",
							// Price: "",
							PriceCurrency: "",
							// PricePreLogistic: "",
							// PricepercentagePreLogistic: "",
							// PriceAddedValue: "",
							// PricepercentageAddedValue: "",
							// PriceHandling: "",
							// PricepercentageHandling: "",
							MaterialZSB: "",
							ValuationDate: "",
							AmountPerZSBUom: "",
							CentralContractNumber: "",
							PriceExternal: "",
							PricePrelogisticCurrency: "",
							priceAddedCurrency: "",
							PriceHandlingCurrency: ""
						};

						var oModel = this.getView().getModel();

						oModel.setDeferredGroups(oModel.getDeferredGroups().concat(["idAddZsbGroup"]));
						var oContext = oModel.createEntry("/xVWKSxNLP_CCTR_I_ZSB", {
							"groupId": "idAddZsbGroup",
							properties: oDummyContext,
							success: function (oData) {}
						});
						this._ozsbSmartForm = Fragment.byId("idZsbAddlineManuallyFragment", "idZsbAddManualForm");
						this._ozsbSmartForm.setBindingContext(oContext);
						this._oZsbAddLineManualuDialog.open();
					}.bind(this));
				} else {
					this._oZsbAddLineManualuDialog.open();
				}
			},

			/*
			 * Event handler for Zsb Add line Dailog Close
			 */
			handleAddLineManuallyDialogClose: function () {
				this._oZsbAddLineManualuDialog.close();
				this._oZsbAddLineManualuDialog.destroy();
				this._ozsbSmartForm = undefined;
				this._oZsbAddLineManualuDialog = undefined;
			},

			/*
			 * Event handler Create Zsb New entry from Smart form
			 * @param {event} oEvent
			 */
			handleAddLineManuallyConfirmPress: function (oEvent) {
				var oModel = this.getView().getModel();
				var oSmartFormObject = this._ozsbSmartForm.getBindingContext().getObject();
				var oHeaderObject = this.getView().getBindingContext().getObject();
				var oDataForEntry = {
					Material: oSmartFormObject.Material,
					MaterialDescription: oSmartFormObject.MaterialDescription,
					ResponsibleBuyer: oSmartFormObject.ResponsibleBuyer,
					AmountPerZSB: oSmartFormObject.AmountPerZSB,
					AmountPerZSBUom: oSmartFormObject.AmountPerZSBUom,
					Plant: oSmartFormObject.Plant,
					CentralContract: oSmartFormObject.CentralContract,
					CentralContractItem: oSmartFormObject.CentralContractItem,
					MaterialZSB: oHeaderObject.PurchasingCentralMaterial, // Material from General Information
					ZSBContractNo: oHeaderObject.CentralPurchaseContract,
					ZSBContractItem: oHeaderObject.CentralPurchaseContractItem,
					Supplier: oSmartFormObject.Supplier,
					SupplierPickup: oSmartFormObject.SupplierPickup,
					Taufung: oSmartFormObject.Taufung,
					Price: oSmartFormObject.Price,
					PriceCurrency: oSmartFormObject.PriceCurrency,
					PricepercentageAddedValue: oSmartFormObject.PricepercentageAddedValue,
					PricepercentageHandling: oSmartFormObject.PricepercentageHandling,
					PricePreLogistic: oSmartFormObject.PricePreLogistic,
					PricepercentagePreLogistic: oSmartFormObject.PricepercentagePreLogistic,
					PriceAddedValue: oSmartFormObject.PriceAddedValue,
					PriceHandling: oSmartFormObject.PriceHandling,
					PricePrelogisticCurrency: oSmartFormObject.PricePrelogisticCurrency,
					priceAddedCurrency: oSmartFormObject.priceAddedCurrency,
					PriceHandlingCurrency: oSmartFormObject.PriceHandlingCurrency,
					ConfirmDuplicate: "",
					DraftUUID: oHeaderObject.DraftUUID,
					HdrDraftUUID: oHeaderObject.ParentDraftUUID
				};

				oModel.create("/xVWKSxNLP_CCTR_I_ZSB", oDataForEntry, {
					success: this.handleZsbAddManualSuccess.bind(this),
					error: this.handleZsbAddManualError.bind(this)
				});

			},
			/*
			 * Event handler for Add Zsb line method Success
			 * @param {oResponse} Success Response
			 */
			handleZsbAddManualSuccess: function (oResponse) {
				this.handleAddLineManuallyDialogClose();
				this.oZsbComponentGridSmartTable.rebindTable();
				this.getView().getModel().refresh();
				// Add message toast 
				MessageToast.show(this._oResourceBundle.getText("ZsbTableAddLineSuccessMsg"));

			},

			/*
			 * Event handler for Add Zsb line method Error 
			 * @param {oErrorResponse} Error Response
			 */
			handleZsbAddManualError: function (oErrorResponse) {
				var iCount = oErrorResponse.responseText.search("VWKS/NLP_CCTR/198");
				if (iCount !== -1) {
					var oErrorObject = JSON.parse(oErrorResponse.responseText).error.innererror.errordetails;
					var sErrorMessage;
					for (var iIndex in oErrorObject) {
						if (oErrorObject[iIndex].code === "/VWKS/NLP_CCTR/198") {
							sErrorMessage = oErrorObject[iIndex].message;
							break;
						}
					}
					MessageBox.warning(sErrorMessage, {
						actions: [this._oResourceBundle.getText("ConfirmButtonText"), MessageBox.Action.NO],
						onClose: function (sButton) {
							if (sButton === "Confirm") {
								this.onConfirmCreateDuplicateZsbline();
							}
						}.bind(this)
					});
					return;
				}
				if (oErrorResponse.responseText) {
					MessageBox.error(JSON.parse(oErrorResponse.responseText).error.message.value);
				}
			},

			/*
			 * handler method to create another duplicate Zsb line item
			 * @param {oErrorResponse} Error Response
			 */
			onConfirmCreateDuplicateZsbline: function () {
				var oModel = this.getView().getModel();
				var oSmartFormObject = this._ozsbSmartForm.getBindingContext().getObject();
				var oHeaderObject = this.getView().getBindingContext().getObject();
				var oDataForEntry = {
					Material: oSmartFormObject.Material,
					MaterialDescription: oSmartFormObject.MaterialDescription,
					ResponsibleBuyer: oSmartFormObject.ResponsibleBuyer,
					AmountPerZSB: oSmartFormObject.AmountPerZSB,
					AmountPerZSBUom: oSmartFormObject.AmountPerZSBUom,
					Plant: oSmartFormObject.Plant,
					CentralContract: oSmartFormObject.CentralContract,
					CentralContractItem: oSmartFormObject.CentralContractItem,
					MaterialZSB: oHeaderObject.PurchasingCentralMaterial,
					ZSBContractNo: oHeaderObject.CentralPurchaseContract,
					ZSBContractItem: oHeaderObject.CentralPurchaseContractItem,
					Supplier: oSmartFormObject.Supplier,
					SupplierPickup: oSmartFormObject.SupplierPickup,
					Taufung: oSmartFormObject.Taufung,
					Price: oSmartFormObject.Price,
					PriceCurrency: oSmartFormObject.PriceCurrency,
					PricepercentageAddedValue: oSmartFormObject.PricepercentageAddedValue,
					PricepercentageHandling: oSmartFormObject.PricepercentageHandling,
					PricePreLogistic: oSmartFormObject.PricePreLogistic,
					PricepercentagePreLogistic: oSmartFormObject.PricepercentagePreLogistic,
					PriceAddedValue: oSmartFormObject.PriceAddedValue,
					PriceHandling: oSmartFormObject.PriceHandling,
					PricePrelogisticCurrency: oSmartFormObject.PricePrelogisticCurrency,
					priceAddedCurrency: oSmartFormObject.priceAddedCurrency,
					PriceHandlingCurrency: oSmartFormObject.PriceHandlingCurrency,
					ConfirmDuplicate: "X",
					DraftUUID: oHeaderObject.DraftUUID,
					HdrDraftUUID: oHeaderObject.ParentDraftUUID
				};
				oModel.create("/xVWKSxNLP_CCTR_I_ZSB", oDataForEntry, {
					success: this.handleZsbAddManualSuccess.bind(this),
					error: function (oErrorResponse) {
						this.handleAddLineManuallyDialogClose();
						if (oErrorResponse.responseText) {
							var oMessage = JSON.parse(oErrorResponse.responseText);
							MessageBox.error(oMessage.error.message.value);
						}
					}.bind(this)
				});
			},

			/*
			 * Handle change in absolute price
			 * @param {sap.ui.base.Event} oEvent 
			 */
			onChangePrice: function (oEvent) {
				var oChangePriceSource = oEvent.getSource(),
					oChangePriceSourceParent = oEvent.getSource().getParent(),
					oZsbObject = oChangePriceSourceParent.getBindingContext().getObject(),
					oChangePriceModel = this.getView().getModel(),
					oChangePriceColumn = oChangePriceSource.getBindingPath("value"),
					oChangePriceBinding = oChangePriceSource.getBinding("value"),
					oChangePriceBindingContext = oChangePriceBinding.getContext();

				if (oChangePriceBinding) {
					var sPercPriceOriginalValue,
						sPerPricePropertyName,
						sPriceOriginalValue = oChangePriceBinding.getValue(),
						sPriceropertyName = oChangePriceBinding.getPath();

					//check which absolute price is changed and retain original percentage price value
					if (oChangePriceColumn === Constants.ZSB_PROPERTY.PRICE_PRELOGISTIC) {
						sPerPricePropertyName = Constants.ZSB_PROPERTY.PRICE_PERCENTAGE_PRELOGISTIC;
						sPercPriceOriginalValue = oZsbObject.PricepercentagePreLogistic;
					} else if (oChangePriceColumn === Constants.ZSB_PROPERTY.PRICE_ADDEDVALUE) {
						sPerPricePropertyName = Constants.ZSB_PROPERTY.PRICE_PERCENTAGE_ADDEDVALUE;
						sPercPriceOriginalValue = oZsbObject.PricepercentageAddedValue;
					} else if (oChangePriceColumn === Constants.ZSB_PROPERTY.PRICE_HANDLING) {
						sPerPricePropertyName = Constants.ZSB_PROPERTY.PRICE_PERCENTAGE_HANDLING;
						sPercPriceOriginalValue = oZsbObject.PricepercentageHandling;
					}

					var sMessage = this._oResourceBundle.getText("ChangePriceConfirmationMsg"),
						sDetails = this._oResourceBundle.getText("ChangePriceConfirmationMsgDetails"),
						aActions = [this._oResourceBundle.getText("Continue"), MessageBox.Action.CANCEL],
						sEmphasizedAction = this._oResourceBundle.getText("Continue");

					MessageBox.confirm(sMessage, {
						actions: aActions,
						details: sDetails,
						emphasizedAction: sEmphasizedAction,
						onClose: function (sAction) {
							if (sAction === MessageBox.Action.CANCEL) {
								oChangePriceModel.setProperty(sPriceropertyName, sPriceOriginalValue, oChangePriceBindingContext);
								oChangePriceModel.setProperty(sPerPricePropertyName, sPercPriceOriginalValue, oChangePriceBindingContext);
								oChangePriceModel.submitChanges();
							}
						}
					});
				}
			},

			/** 
			 * Handler Method to "Workitem ID" Column click in P-Mat action items Smart Table
			 * Opens navigation to P-mat in new tab with provided KeyLink
			 * @param {sap.ui.base.Event} oEvent is the event generated
			 */
			handlePmatKeyLinkPress: function (oEvent) {
				var sKeyLink = oEvent.getSource().getBindingContext().getProperty("KeyLink");

				var oParams = {
					KeyLink: sKeyLink + "l",
					DraftUUID: ReuseConstants.INITIAL_GUID,
					IsActiveEntity: true
				};
				NavigationHelper.navigateToExternalApp(this.getView().getController(), "PMAT", null, oParams, true);
			},

			/**
			 * This method will be called to make read call to refresh Fixed TTO field
			 * @public
			 */
			refreshConditionFacet: function () {
				var oConditionsComponent = this.base.byId(
					"ui.s2p.mm.pur.central.ctr.sts1::sap.suite.ui.generic.template.ObjectPage.view.Details::C_CntrlPurchaseContractItemTP--sap.cus.sd.lib.item.cndn.forSmartElements::item::C_CntrlPurContrItmCndnAmountTP:C_CntrlPurContrItmPrcSimln::ComponentContainer"
				);
				var oHierConditionsComponent = this.base.byId(
					"ui.s2p.mm.pur.central.ctr.sts1::sap.suite.ui.generic.template.ObjectPage.view.Details::C_CntrlPurContrHierItemTP--sap.cus.sd.lib.item.cndn.forSmartElements::item::C_CPurConHierItmCndnAmountTP:C_CntrlPurContrItmPrcSimln::ComponentContainer"
				);
				if (oConditionsComponent) {
					oConditionsComponent.getComponentInstance().load(true);
				}
				if (oHierConditionsComponent) {
					oHierConditionsComponent.getComponentInstance().load(true);
				}
			},

			/**
			 * Format editable state for percentage cost fields based on PaymentModel.
			 * In case of 'Bailment' Payment Model - set disable.
			 * @param {string} sPaymentModel Payment Model code
			 * @returns {boolean} for editable state
			 */
			formatPercentageCostEnableState: function (sPaymentModel) {
				return Formatter.formatPercentageCostEnableState(sPaymentModel);
			},

			/**
			 * Payment Terms, Incoterms and Shipping Instructions change event handler.
			 * @param {sap.ui.base.Event} oEvent change event
			 */
			onInputChanged: function (oEvent) {
				var oModel = this.getView().getModel(),
					oBindingObject = this.getView().getBindingContext().getObject(),
					sChangedValue = oEvent.getParameters().value,
					oBindingContext = oEvent.getSource().getBinding("value").getContext(),
					oSource = oEvent.getSource();

				oModel.resetChanges([oBindingContext.getPath()]);
				oModel.callFunction(Constants.FUNCTION_IMPORT.VALIDATE_INPUT, {
					method: "POST",
					urlParameters: {
						"DraftUUID": oBindingObject.DraftUUID,
						"IncoTerm": oBindingObject.IncotermsClassification,
						"PaymentTerm": oBindingObject.PaymentTerms,
						"ShippingInstruction": oBindingObject.ShippingInstruction
					},
					success: function (oData, oResponse) {
						var bFlag = oData.Success,
							oChangedControl = oSource,
							//oEvent is not accessible inside success and without creating new variable, the previous values are also not accessible 
							sNewValue = sChangedValue;
						if (bFlag === "X") {
							MessageBox.confirm(this._oResourceBundle.getText("OverwriteConfirmationMsg"), {
								title: this._oResourceBundle.getText("Overwrite"),
								actions: [this._oResourceBundle.getText("Overwrite"), MessageBox.Action.CANCEL],
								onClose: function (sAction) {
									if (sAction === this._oResourceBundle.getText("Overwrite")) {
										//set new value
										oChangedControl.setValue(sNewValue);
									}
								}.bind(this)
							});
						} else if (bFlag === "0") {
							//set new value
							oChangedControl.setValue(sNewValue);
						}
					}.bind(this),
					error: function (oError) {
						MessageBox.error(oError.message);
					}
				});
			},

			/**
			 * Method to handle PR Number/Item link press
			 * @param {sap.ui.base.Event} oEvent - event object
			 */
			handlePRNumLinkPress: function (oEvent) {
				var oBindingContextObject = oEvent.getSource().getBindingContext().getObject(),
					sPRNumber = oBindingContextObject.PurchaseRequisition,
					sPRItem = oBindingContextObject.PurchaseRequisitionItem,
					sConnectedSystem = oBindingContextObject.ProcurementHubSourceSystem;

				var oParams = {
					ProcmtHubPurchaseRequisition: sPRNumber,
					ProcmtHubPurRequisitionItem: sPRItem,
					ProcurementHubSourceSystem: sConnectedSystem
				};
				NavigationHelper.navigateToOutboundTarget(this.getView().getController(), "MPRC", oParams, true);
			},

			/**
			 * Method to handle SourcingProject Item link press
			 * @param {sap.ui.base.Event} oEvent - event object
			 */
			handleSPNumLinkPress: function (oEvent) {
				var oBindingContextObject = oEvent.getSource().getBindingContext().getObject(),
					sSPHeaderUUID = oBindingContextObject.SourcingProjectUUID,
					sSPItemUUID = oBindingContextObject.SourcingProjectItemUUID,
					bIsActiveEntity = oBindingContextObject.IsActiveEntity;

				var oParams = {
					SourcingProjectItemUUID: sSPItemUUID,
					SourcingProjectUUID: sSPHeaderUUID,
					IsActiveEntity: bIsActiveEntity
				};
				NavigationHelper.navigateToOutboundTarget(this.getView().getController(), "SourcingProject", oParams, true);
			},

			/**
			 * Before Rebind table Method for RMS Table to load data
			 */
			onBeforeRebindRMSTable: function () {
				if (this._oRMSTableSmartTable) {
					this._oRMSTableSmartTable.setModel(this.getView().getController().getOwnerComponent().getModel());
					this._oRMSTableSmartTable.setEntitySet("xVWKSxNLP_CCTR_C_CCTR_MAN_RMS");
				}
				var bDeleteLineBtnEnable = this.getView().getModel("propertyModel").getProperty("/bDeleteLineBtnEnable");
				if (bDeleteLineBtnEnable !== "") {
					this.getView().getModel("propertyModel").setProperty("/bDeleteLineBtnEnable", this.getView().getModel("ui").getData().editable);
				}
			},

			/**
			 * Handler for create action on RMS table
			 * @param {sap.ui.base.Event} oEvent - event object
			 */
			handleCreateRMS: function (oEvent) {
				var oModel = this.getView().getModel();
				var oParentContext = oEvent.getSource().getBindingContext();
				oModel.createEntry("to_RMSData", {
					context: oParentContext
				});
				oModel.submitChanges({
					success: function () {
						this._oRMSTableSmartTable.rebindTable();
					}.bind(this),
					error: function () {}
				});
			},

			/**
			 * Row Selection Handler for RMS table
			 */
			onRMSSelectionChange: function () {
				if (this._oRMSTableSmartTable.getTable().getSelectedItems().length) {
					this.getView().getModel("propertyModel").setProperty("/bManualRMSDeleteBtnEnable", true);
				} else {
					this.getView().getModel("propertyModel").setProperty("/bManualRMSDeleteBtnEnable", false);
				}
			},

			/**
			 * Handler for delete action on RMS table
			 */
			handleDeleteRMS: function () {
				var sTitle = this.getView().getModel("i18n|sap.suite.ui.generic.template.ObjectPage|C_CntrlPurchaseContractItemTP").getResourceBundle()
					.getText("Delete");
				var sMessage = this.getView().getModel("i18n|sap.suite.ui.generic.template.ObjectPage|C_CntrlPurchaseContractItemTP").getResourceBundle()
					.getText("RMSEntryDeleteMessage");
				MessageBox.warning(sMessage, {
					title: sTitle,
					actions: [MessageBox.Action.DELETE, MessageBox.Action.CANCEL],
					emphasizedAction: MessageBox.Action.DELETE,
					onClose: this._deleteRMSEntry.bind(this)
				});
			},

			/**
			 * Method to delete RMS entry from RMS Table
			 * @param {string} sAction - user action value
			 */
			_deleteRMSEntry: function (sAction) {
				if (sAction === MessageBox.Action.DELETE) {
					var oRMSModel = this.getView().getModel();
					var oSelectedContexts = this._oRMSTableSmartTable.getTable().getSelectedContexts();
					var iRMSTableSelected = oSelectedContexts.length;
					var sRemovePath;
					for (var iIndex = 0; iIndex < iRMSTableSelected; iIndex++) {
						sRemovePath = oSelectedContexts[iIndex].sPath;
						oRMSModel.remove(sRemovePath);
					}
					this._oRMSTableSmartTable.rebindTable();
				}
			},

			/**
			 * Method do load Value Help fragment on Material Identification Number
			 * @param {sap.ui.base.Event} oEvent - event object
			 */
			onInternalMaterialValueHelpRequest: function (oEvent) {
				this._oInternalMaterialValueHelpBindingContext = oEvent.getSource().getBindingContext();
				if (!this._oInternalMaterialValueHelpDialog) {
					Fragment.load({
						id: "idMaterialValueHelpDialog",
						name: "vwks.nlp.s2p.mm.pctrcentral.manage.changes.fragments.InternalMaterialValueHelpDialog",
						controller: this
					}).then(function (oDialog) {
						this._oInternalMaterialValueHelpDialog = oDialog;
						this._oInternalMaterialValueHelpDialog.setModel(this.getView().getModel(
							"i18n|sap.suite.ui.generic.template.ObjectPage|C_CntrlPurchaseContractItemTP"), "i18n");
						this._oInternalMaterialValueHelpSmartTable = Fragment.byId("idMaterialValueHelpDialog", "idInternalMaterialSmartTable");
						this._oInternalMaterialValueHelpSmartTable.getTable().setMode("SingleSelectLeft");
						this._oInternalMaterialValueHelpSmartFilterBar = Fragment.byId("idMaterialValueHelpDialog",
							"idInternalMaterialSmartFilterBar");
						this._oInternalMaterialValueHelpSmartTable.setSmartFilterId(this._oInternalMaterialValueHelpSmartFilterBar.getId());
						this.getView().addDependent(this._oInternalMaterialValueHelpDialog);
						this._oInternalMaterialValueHelpDialog.open();
					}.bind(this));
				} else {
					this._oInternalMaterialValueHelpSmartFilterBar.fireSearch();
					this._oInternalMaterialValueHelpDialog.open();
				}
			},

			/**
			 * Initialisation method for smart table in order to apply filters
			 */
			onInitialiseInternalMaterialSmartTable: function () {
				this._oInternalMaterialValueHelpSmartTable.rebindTable();
			},

			/**
			 * On beforeRebind table method for Material identification number value help smart table
			 * @param {sap.ui.base.Event} oEvent - event object
			 */
			onInternalMaterialRebindTable: function (oEvent) {
				var aCommodityFilter = this._createCommodityFilters();
				var aFilter = new Filter({
					filters: aCommodityFilter
				});
				var oInternalMaterialTableBindingParameters = oEvent.getParameter("bindingParams");
				if (aFilter && aFilter.aFilters && aFilter.aFilters.length) {
					if (oInternalMaterialTableBindingParameters) {
						oInternalMaterialTableBindingParameters.filters.push(aFilter);
					} else {
						if (this._oInternalMaterialValueHelpSmartTable.getTable().getBinding("rows")) {
							this._oInternalMaterialValueHelpSmartTable.getTable().getBinding("rows").filter([aFilter], FilterType.Application);
						}
					}
				}
			},

			/**
			 *Method to create filters to apply on  Material identification number value help smart table
			 * @return {array} aFilter - array of generated filters
			 */
			_createCommodityFilters: function () {
				var aFilter = [];
				var sItemDraftUUID = this.getView().getBindingContext().getProperty("DraftUUID");
				var oCommodityFilter = new Filter({
					path: "ItemGUID",
					operator: FilterOperator.EQ,
					value1: sItemDraftUUID
				});
				aFilter.push(oCommodityFilter);
				return aFilter;
			},

			/**
			 * Handler method for OK button click of Material identification number value help
			 */
			onInternalMaterialOK: function () {
				var oSelectedItem = this._oInternalMaterialValueHelpSmartTable.getTable().getSelectedItem();
				if (oSelectedItem) {
					var oSelectedItemObject = oSelectedItem.getBindingContext().getObject();
					var sPath = this._oInternalMaterialValueHelpBindingContext.getPath();
					this._oInternalMaterialValueHelpBindingContext.getModel().setProperty(sPath + "/MaterialIdentNumber", oSelectedItemObject.CommodityName);
					this._oInternalMaterialValueHelpBindingContext.getModel().setProperty(sPath + "/xvwksxnlp_valid_from", oSelectedItemObject.purgdoccmmdtyqtyvalidfromdate);
					this._oInternalMaterialValueHelpBindingContext.getModel().setProperty(sPath + "/xvwksxnlp_valid_to", oSelectedItemObject.purgdoccmmdtyqtyvalidtodate);
					this._oInternalMaterialValueHelpBindingContext.getModel().setProperty(sPath + "/OperatingWeight", oSelectedItemObject.commodityquantity);
					this._oInternalMaterialValueHelpBindingContext.getModel().setProperty(sPath + "/OperatingWeightUom", oSelectedItemObject.commodityunit);
					this._oInternalMaterialValueHelpBindingContext.getModel().setProperty(sPath + "/SequenceNo", oSelectedItemObject.purgdoccmmdtyqtysqntlnumber);
				}
				this.onInternalMaterialClose();
			},

			/**
			 * Handler method for Cancel button click of Material identification number value help
			 */
			onInternalMaterialClose: function () {
				this._oInternalMaterialValueHelpSmartTable.getTable().removeSelections();
				this._oInternalMaterialValueHelpSmartFilterBar.setFilterData({}, true);
				this._oInternalMaterialValueHelpDialog.close();
			},

			/**
			 * Output control rebind table handler 
			 * @param {sap.ui.base.Event} oEvent - event object
			 */
			_onBeforeRebindOutputControlTable: function (oEvent) {
				var mBindingParams = oEvent.getParameter("bindingParams");
				mBindingParams.events = {
					"dataReceived": this._onDataReceivedOutputControl.bind(this)
				};

			},
			/**
			 * This method finds the pdf button in each table row and enables them for EDI channel
			 * @param {sap.ui.base.Event} oEvent - event object
			 */
			_onDataReceivedOutputControl: function (oEvent) {
				var sSwitchIDRegex = "buttonDisplay";
				var aOutputControlItems = this._outputControlSmartTable.getTable().getItems();
				for (var i = 0; i < aOutputControlItems.length; i++) {
					var sChannel = aOutputControlItems[i].getBindingContext().getProperty("Channel");
					if (sChannel === "EDI") {
						aOutputControlItems[i].getCells().forEach(function (oCell) {
							var sCellId = oCell.getId();
							if (sCellId.includes(sSwitchIDRegex)) {
								oCell.setEnabled(true);
								return;
							}
						});
					}
				}
			},
			/*
			 * formatter method for  overall Quota  on item level Icon Status
			 * @param {string} Status maintianed for Overal Quota
			 */
			getOveralQuotaIconFormatter: function (sQuotaStatus) {
				return Formatter.getOveralQuotaIconFormatter(sQuotaStatus);
			},
			/*
			 * formatter method for Visible property overall Quota pop up on Distribution level 
			 * @param {string} Status maintianed for Overal Quota
			 */
			getOveralQuotaStatusFormatter: function (sQuotaStatus) {
				return Formatter.getOveralQuotaStatusFormatter(sQuotaStatus);
			},
			/*
			 * formatter method for tooltip of the Overall Quota Item field 
			 * @param {string} Status maintianed for Overal Quota
			 * @returns {string} "" || formatter tooltip based on the Quota status
			 */
			formatterOverallQuotaTooltip: function (sQuotaFlag) {
				if (sQuotaFlag) {
					var oResourceBundle = this.getView().getModel("i18n|sap.suite.ui.generic.template.ObjectPage|C_CntrlPurchaseContractItemTP").getResourceBundle();
					return Formatter.formatterOverallQuotaTooltip(sQuotaFlag, oResourceBundle);
				}
				return "";
			},
			/**
			 * Event handler Overall quota Analytical Collapse All 
			 * @param {sap.ui.base.Event} oEvent The event object
			 */
			onHandleOverallQuotaCollapseAll: function (oEvent) {
				if (this.oOverallSmartAnalyticalTable.getTable().getBinding("rows")) {
					this.oOverallSmartAnalyticalTable.getTable().getBinding("rows").collapseToLevel(0);
				}
			},
			/**
			 * Event handler Overall quota Analytical Expand All 
			 * @param {sap.ui.base.Event} oEvent The event object
			 */
			onHandleOverallQuotaExpandAll: function (oEvent) {
				if (this.oOverallSmartAnalyticalTable.getTable().getBinding("rows")) {
					this.oOverallSmartAnalyticalTable.getTable().getBinding("rows").expandToLevel(1);
				}
			},
			/*
			 * Payment Model change event handler.
			 * @param {sap.ui.base.Event} oEvent change event
			 */
			handlePaymentModelChange: function (oEvent) {
				var sPriceCurrency = oEvent.getSource().getBindingContext().getProperty("PriceCurrency");
				if (sPriceCurrency === "") {
					sPriceCurrency = " ";
				}
				// change event is getting called twice and we need to ensure that popup is only shown if payment model value changes from anything other than '02' to '02'.
				if (oEvent.getSource().getValue() === Constants.BAILMENT_PAYMENT_MODEL_CODE && oEvent.getParameters().newValue === Constants.BAILMENT_PAYMENT_MODEL_CODE) {
					MessageBox.information(this._oResourceBundle.getText("BailmentInfoMsg", sPriceCurrency));
				}
			}
		});
	});