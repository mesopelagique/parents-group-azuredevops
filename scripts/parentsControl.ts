import { Control } from "VSS/Controls";
import { IWorkItemChangedArgs, IWorkItemLoadedArgs } from "TFS/WorkItemTracking/ExtensionContracts";
import { WorkItem} from "TFS/WorkItemTracking/Contracts"
import { WorkItemFormService } from "TFS/WorkItemTracking/Services";
import { getClient } from "TFS/WorkItemTracking/RestClient";
import { areaPathField, idField, witField, projectField, titleField, parentField } from "./fieldNames";

export class ParentsControl extends Control<{}> {
    // data
    private wiId: number;
    private parents: WorkItem[];
 
    private async fillParents(wi: WorkItem, project: string) {
        const parentId = wi.fields[parentField];
        if(parentId && parentId>=0) {
            const parentWi: WorkItem = await getClient().getWorkItem(parentId, [idField, titleField, parentField], undefined, undefined, project);
            if (parentWi) {
                this.parents.push(parentWi);
                await this.fillParents(parentWi, project);
            }
        }
    }

    public async refresh() {
        const formService = await WorkItemFormService.getService();
        const fields = await formService.getFieldValues([idField, witField, areaPathField, projectField]);
        this.wiId = fields[idField] as number;
   
        const project = fields[projectField] as string;
        this.parents = [];
        const wi: WorkItem = await getClient().getWorkItem(this.wiId, [parentField], undefined, undefined, project);
        await this.fillParents(wi, project);
        // update ui
        if (this.parents && this.parents.length != 0) {
            await this.updateParents();
        } else {
            this.updateNoParent();
        }
    }

    private updateNoParent() {
        this._element.html(`<div class="no-parents-message">No parents</div>`);
        VSS.resize(window.innerWidth, $(".parent-callout").outerHeight() + 16)
    }

    private async updateParents() {
        this._element.html("");
        const list = $("<div class=\"la-list\"></div>").appendTo(this._element);

        this.parents.forEach(function (parent) {
            const item = $("<div class=\"la-item\"></div>").appendTo(list);
            const wrapper = $("<div class=\"la-item-wrapper\"></div>").appendTo(item);
            const artifactdata = $("<div class=\"la-artifact-data\"></div>").appendTo(wrapper);
            const primarydata = $("<div class=\"la-primary-data\"></div>").appendTo(artifactdata);

            $("<div class=\"la-primary-data-id\" style=\"display: inline;\">"+parent.fields[idField].toString()+"&nbsp;</div>").appendTo(primarydata);

            const link = $("<div class=\"ms-TooltipHost \" style=\"display: inline;\"></div>").appendTo(primarydata);
            $("<a/>").text(parent.fields[titleField])
            .attr({
                href: parent._links["html"]["href"],
                target: "_blank",
                title: "Navigate to parent"
            }).appendTo(link);
        });
        VSS.resize();
    }

    public onLoaded(loadedArgs: IWorkItemLoadedArgs) {
        if (loadedArgs.isNew) {
            this._element.html(`<div class="new-wi-message">Save the work item to see parents data</div>`);
        } else {
            this.wiId = loadedArgs.id;
            this._element.html("");
            this._element.append($("<div/>").text("Looking for parents..."));
            this.refresh();
        }
    }

    public onRefreshed() {
        this.refresh();
    }

    public onSaved(_: IWorkItemChangedArgs) {
        this.refresh();
    }
}
