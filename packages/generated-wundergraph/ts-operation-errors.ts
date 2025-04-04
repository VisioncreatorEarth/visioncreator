// Code generated by wunderctl. DO NOT EDIT.

import type { ClientOperationErrors, GraphQLError } from "@wundergraph/sdk/client";

export type OperationErrors = {
	MyNewsletterStatus: MyNewsletterStatusErrors;
	NewsletterToggle: NewsletterToggleErrors;
	addItemsToShoppingList: AddItemsToShoppingListErrors;
	askClaude: AskClaudeErrors;
	askHominio: AskHominioErrors;
	calculateCID: CalculateCIDErrors;
	checkCapabilities: CheckCapabilitiesErrors;
	createInvite: CreateInviteErrors;
	createShoppingList: CreateShoppingListErrors;
	getUserCapabilities: GetUserCapabilitiesErrors;
	getUserStats: GetUserStatsErrors;
	getUsers: GetUsersErrors;
	getVoices: GetVoicesErrors;
	insertDB: InsertDBErrors;
	insertObject: InsertObjectErrors;
	manageCapabilities: ManageCapabilitiesErrors;
	onboardMe: OnboardMeErrors;
	polarCreateCheckout: PolarCreateCheckoutErrors;
	polarGetCheckout: PolarGetCheckoutErrors;
	polarListProducts: PolarListProductsErrors;
	polarMySubscriptions: PolarMySubscriptionsErrors;
	polarStoreWebhook: PolarStoreWebhookErrors;
	polarUpdateSubscription: PolarUpdateSubscriptionErrors;
	queryCallsAndTimeStats: QueryCallsAndTimeStatsErrors;
	queryComposer: QueryComposerErrors;
	queryDB: QueryDBErrors;
	queryLeaderboard: QueryLeaderboardErrors;
	queryMails: QueryMailsErrors;
	queryMe: QueryMeErrors;
	queryMyCapabilities: QueryMyCapabilitiesErrors;
	queryMyShoppingList: QueryMyShoppingListErrors;
	queryUserStats: QueryUserStatsErrors;
	sandboxFiles: SandboxFilesErrors;
	sandboxFsRead: SandboxFsReadErrors;
	sandboxList: SandboxListErrors;
	sandboxReadFile: SandboxReadFileErrors;
	sandboxStart: SandboxStartErrors;
	sandboxStop: SandboxStopErrors;
	sandboxWriteFile: SandboxWriteFileErrors;
	saveMailWIP: SaveMailWIPErrors;
	sendMail: SendMailErrors;
	sendMailWIP: SendMailWIPErrors;
	toggleOnboarded: ToggleOnboardedErrors;
	updateMe: UpdateMeErrors;
};

export type OperationUltravoxInitializationError = {
	code: "UltravoxInitializationError";
	statusCode: 400;
	message: "";
};
export type OperationUltravoxAuthenticationError = {
	code: "UltravoxAuthenticationError";
	statusCode: 401;
	message: "Invalid or missing Ultravox API key";
};

export type MyNewsletterStatusErrors = ClientOperationErrors;
export type NewsletterToggleErrors = ClientOperationErrors;
export type AddItemsToShoppingListErrors = ClientOperationErrors;
export type AskClaudeErrors = ClientOperationErrors;
export type AskHominioErrors =
	| OperationUltravoxInitializationError
	| OperationUltravoxAuthenticationError
	| ClientOperationErrors;
export type CalculateCIDErrors = ClientOperationErrors;
export type CheckCapabilitiesErrors = ClientOperationErrors;
export type CreateInviteErrors = ClientOperationErrors;
export type CreateShoppingListErrors = ClientOperationErrors;
export type GetUserCapabilitiesErrors = ClientOperationErrors;
export type GetUserStatsErrors = ClientOperationErrors;
export type GetUsersErrors = ClientOperationErrors;
export type GetVoicesErrors = ClientOperationErrors;
export type InsertDBErrors = ClientOperationErrors;
export type InsertObjectErrors = ClientOperationErrors;
export type ManageCapabilitiesErrors = ClientOperationErrors;
export type OnboardMeErrors = ClientOperationErrors;
export type PolarCreateCheckoutErrors = ClientOperationErrors;
export type PolarGetCheckoutErrors = ClientOperationErrors;
export type PolarListProductsErrors = ClientOperationErrors;
export type PolarMySubscriptionsErrors = ClientOperationErrors;
export type PolarStoreWebhookErrors = ClientOperationErrors;
export type PolarUpdateSubscriptionErrors = ClientOperationErrors;
export type QueryCallsAndTimeStatsErrors = ClientOperationErrors;
export type QueryComposerErrors = ClientOperationErrors;
export type QueryDBErrors = ClientOperationErrors;
export type QueryLeaderboardErrors = ClientOperationErrors;
export type QueryMailsErrors = ClientOperationErrors;
export type QueryMeErrors = ClientOperationErrors;
export type QueryMyCapabilitiesErrors = ClientOperationErrors;
export type QueryMyShoppingListErrors = ClientOperationErrors;
export type QueryUserStatsErrors = ClientOperationErrors;
export type SandboxFilesErrors = ClientOperationErrors;
export type SandboxFsReadErrors = ClientOperationErrors;
export type SandboxListErrors = ClientOperationErrors;
export type SandboxReadFileErrors = ClientOperationErrors;
export type SandboxStartErrors = ClientOperationErrors;
export type SandboxStopErrors = ClientOperationErrors;
export type SandboxWriteFileErrors = ClientOperationErrors;
export type SaveMailWIPErrors = ClientOperationErrors;
export type SendMailErrors = ClientOperationErrors;
export type SendMailWIPErrors = ClientOperationErrors;
export type ToggleOnboardedErrors = ClientOperationErrors;
export type UpdateMeErrors = ClientOperationErrors;
