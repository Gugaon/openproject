// -- copyright
// OpenProject is a project management system.
// Copyright (C) 2012-2015 the OpenProject Foundation (OPF)
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License version 3.
//
// OpenProject is a fork of ChiliProject, which is a fork of Redmine. The copyright follows:
// Copyright (C) 2006-2013 Jean-Philippe Lang
// Copyright (C) 2010-2013 the ChiliProject Team
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License
// as published by the Free Software Foundation; either version 2
// of the License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program; if not, write to the Free Software
// Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
//
// See doc/COPYRIGHT.rdoc for more details.
// ++

import {States} from "../../states.service";
import {timelineElementCssClass, RenderInfo, calculatePositionValueForDayCount} from "./wp-timeline";
import {WorkPackageTimelineService} from "./wp-timeline.service";
import IScope = angular.IScope;
import WorkPackage = op.WorkPackage;
import Observable = Rx.Observable;
import IDisposable = Rx.IDisposable;

export class WorkPackageTimelineCell {

  // private wpState: State<WorkPackageResource>;

  private disposable: IDisposable;

  private bar: HTMLDivElement = null;

  constructor(private workPackageTimelineService: WorkPackageTimelineService,
              private scope: IScope,
              private states: States,
              private workPackageId: string,
              private timelineCell: HTMLElement) {

    // this.wpState = this.states.workPackages.get(this.workPackageId);
  }

  activate() {
    this.disposable = this.workPackageTimelineService.addWorkPackage(this.workPackageId)
      .subscribe(renderInfo => {
        this.updateView(renderInfo);
      });
  }

  // TODO never called so far
  deactivate() {
    this.timelineCell.innerHTML = "";
    this.disposable && this.disposable.dispose();
  }

  private lazyInit() {
    if (this.bar === null) {
      this.bar = document.createElement("div");
      this.bar.className = timelineElementCssClass;
      this.timelineCell.appendChild(this.bar);
    }
  }

  private updateView(renderInfo: RenderInfo) {
    // console.log("updateView() wpId=" + this.workPackageId);

    // display bar
    this.lazyInit();
    const viewParams = renderInfo.viewParams;
    const wp = renderInfo.workPackage;

    const start = moment(wp.startDate as any);
    const due = moment(wp.dueDate as any);

    // update global elements
    // this.updateGlobalElements(renderInfo);

    // abort if no start or due date
    if (!wp.startDate || !wp.dueDate) {
      return;
    }

    // general settings - bar
    this.bar.style.position = "relative";
    this.bar.style.height = "1em";
    this.bar.style.backgroundColor = "#8CD1E8";
    this.bar.style.borderRadius = "2px";
    this.bar.style.cssFloat = "left";
    this.bar.style.marginLeft = renderInfo.viewParams.scrollOffsetInPx + "px";

    // offset left
    const offsetStart = start.diff(viewParams.dateDisplayStart, "days");
    this.bar.style.left = calculatePositionValueForDayCount(viewParams, offsetStart);

    // duration
    const duration = due.diff(start, "days") + 1;
    this.bar.style.width = calculatePositionValueForDayCount(viewParams, duration);
  }

}
