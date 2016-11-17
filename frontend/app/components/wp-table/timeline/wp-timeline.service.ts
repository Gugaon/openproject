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

import {openprojectModule} from "../../../angular-modules";
import {States} from "../../states.service";
import {RenderInfo, TimelineViewParameters} from "./wp-timeline";
import WorkPackage = op.WorkPackage;
import Observable = Rx.Observable;
import Moment = moment.Moment;
import {WpTimelineHeader} from "./wp-timeline.header";


/**
 *
 */
export class WorkPackageTimelineService {

  private _viewParameters: TimelineViewParameters = new TimelineViewParameters();

  private workPackagesInView: {[id: string]: WorkPackage} = {};

  private wpTimelineHeader = new WpTimelineHeader();

  private updateAllWorkPackagesSubject = new Rx.BehaviorSubject<boolean>(true);

  private refreshViewRequested = false;

  constructor(private states: States) {
    "ngInject";
  }

  /**
   * Returns a defensive copy of the currently used view parameters.
   */
  getViewParametersCopy(): TimelineViewParameters {
    return _.cloneDeep(this._viewParameters);
  }

  get viewParameterSettings() {
    return this._viewParameters.settings;
  }

  refreshView() {
    if (!this.refreshViewRequested) {
      setTimeout(() => {
        this.updateAllWorkPackagesSubject.onNext(true);
        this.wpTimelineHeader.refreshView(this._viewParameters);
        this.refreshViewRequested = false;
      }, 30);
    }
    this.refreshViewRequested = true;
  }

  refreshScrollOnly() {
    jQuery(".timeline-element").css("margin-left", this._viewParameters.scrollOffsetInPx + "px");
  }


  addWorkPackage(wpId: string): Rx.Observable<RenderInfo> {
    // console.log("addWorkPackage() = " + wpId);

    const wpObs = this.states.workPackages.get(wpId).observe(null)
      .map((wp: any) => {
        this.workPackagesInView[wp.id] = wp;
        const viewParamsChanged = this.calculateViewParams(this._viewParameters);
        if (viewParamsChanged) {
          // view params have changed, notify all cells
          this.refreshView();
        }

        return {
          viewParams: this._viewParameters,
          workPackage: wp,
          // globalElements: this.globalElementsRegistry
        };
      });

    return Rx.Observable
      .combineLatest(
        wpObs,
        this.updateAllWorkPackagesSubject,
        (renderInfo, forceUpdate) => {
          return renderInfo;
        }
      );
  }

  private calculateViewParams(currentParams: TimelineViewParameters): boolean {
    // console.log("calculateViewParams()");

    const newParams = new TimelineViewParameters();
    let changed = false;

    // Calculate view parameters
    for (const wpId in this.workPackagesInView) {
      const workPackage = this.workPackagesInView[wpId];

      if (workPackage.startDate && workPackage.dueDate) {
        const start = moment(workPackage.startDate as any);
        const due = moment(workPackage.dueDate as any);

        // start date
        newParams.dateDisplayStart = moment.min(
          newParams.dateDisplayStart,
          // currentParams.dateDisplayStart,
          currentParams.now,
          start);

        // due date
        newParams.dateDisplayEnd = moment.max(
          newParams.dateDisplayEnd,
          // currentParams.dateDisplayEnd,
          currentParams.now,
          due);
      }
    }

    // Check if view params changed:

    // start date
    if (!newParams.dateDisplayStart.isSame(this._viewParameters.dateDisplayStart)) {
      changed = true;
      this._viewParameters.dateDisplayStart = newParams.dateDisplayStart;
    }

    // end date
    if (!newParams.dateDisplayEnd.isSame(this._viewParameters.dateDisplayEnd)) {
      changed = true;
      this._viewParameters.dateDisplayEnd = newParams.dateDisplayEnd;
    }

    // console.log("        changed=" + changed);

    return changed;
  }

}

openprojectModule.service("workPackageTimelineService", WorkPackageTimelineService);
