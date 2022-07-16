/// <reference types="vss-web-extension-sdk" />

import { ParentsControl } from "./parentsControl";
import * as Controls from "VSS/Controls";
import { IWorkItemNotificationListener } from "TFS/WorkItemTracking/ExtensionContracts";
 
const control = <ParentsControl>Controls.BaseControl.createIn(ParentsControl, $(".parents-control"));

const contextData: Partial<IWorkItemNotificationListener> = {
    onSaved: (savedEventArgs) => control.onSaved(savedEventArgs),
    onRefreshed: () => control.onRefreshed(),
    onLoaded: (loadedArgs) => control.onLoaded(loadedArgs)
};

VSS.register(VSS.getContribution().id, contextData);