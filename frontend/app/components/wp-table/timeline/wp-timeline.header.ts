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

import {
  TimelineViewParameters,
  timelineElementCssClass,
  ZoomLevel,
  calculatePositionValueForDayCount
} from "./wp-timeline";
import {todayLine} from "./wp-timeline.today-line";
import Moment = moment.Moment;

const cssClassTableBody = ".work-package-table";
const cssClassHeader = ".wp-timeline-header";

export type GlobalElement = (viewParams: TimelineViewParameters, elem: HTMLElement) => any;
type GlobalElementsRegistry = {[name: string]: GlobalElement};

export class WpTimelineHeader {

  private globalElementsRegistry: GlobalElementsRegistry = {};

  private globalElements: {[type: string]: HTMLElement} = {};

  private headerCell: HTMLElement;

  private marginTop: number;

  private globalHeight: number;

  private activeZoomLevel: ZoomLevel;

  constructor() {
    this.addElement("todayline", todayLine);
  }

  refreshView(vp: TimelineViewParameters) {
    this.lazyInit();
    this.renderLabels(vp);
    this.renderGlobalElements(vp);
  }

  addElement(name: string, renderer: GlobalElement) {
    this.globalElementsRegistry[name] = renderer;
  }

  removeElement(name: string) {
    this.globalElements[name].remove();
    delete this.globalElementsRegistry[name];
  }

  private lazyInit() {
    if (this.headerCell === undefined) {
      this.headerCell = jQuery(cssClassHeader)[0];
    }

    this.marginTop = jQuery(this.headerCell).outerHeight();
    this.globalHeight = jQuery(cssClassTableBody).outerHeight();
  }

  private renderLabels(vp: TimelineViewParameters) {
    if (this.activeZoomLevel === vp.settings.zoomLevel) {
      return;
    }

    jQuery(this.headerCell).empty();
    this.globalElements = {};
    this.renderGlobalElements(vp);

    switch (vp.settings.zoomLevel) {
      case ZoomLevel.DAYS:
        return this.renderLabelsDays(vp);
      case ZoomLevel.WEEKS:
        return this.renderLabelsWeeks(vp);
      case ZoomLevel.MONTHS:
        return this.renderLabelsMonths(vp);
      case ZoomLevel.QUARTERS:
        return this.renderLabelsQuarters(vp);
      case ZoomLevel.YEARS:
        return this.renderLabelsYears(vp);
    }

    this.activeZoomLevel = vp.settings.zoomLevel;
  }

  private renderLabelsDays(vp: TimelineViewParameters) {
    this.headerCell.style.height = "48px";

    this.renderTimeSlices(vp, "month", 0, vp.dateDisplayStart, vp.dateDisplayEnd, (start, cell) => {
      cell.innerHTML = start.format("MMM");
    });

    this.renderTimeSlices(vp, "week", 10, vp.dateDisplayStart, vp.dateDisplayEnd, (start, cell) => {
      cell.innerHTML = parseInt(start.format("WW")) + 1;
    });

    this.renderTimeSlices(vp, "day", 20, vp.dateDisplayStart, vp.dateDisplayEnd, (start, cell) => {
      cell.innerHTML = start.format("D");
    });

    this.renderTimeSlices(vp, "day", 30, vp.dateDisplayStart, vp.dateDisplayEnd, (start, cell) => {
      cell.innerHTML = start.format("dd");
    });
  }

  private renderLabelsWeeks(vp: TimelineViewParameters) {
  }

  private renderLabelsMonths(vp: TimelineViewParameters) {
  }

  private renderLabelsQuarters(vp: TimelineViewParameters) {
  }

  private renderLabelsYears(vp: TimelineViewParameters) {
  }


  renderTimeSlices(vp: TimelineViewParameters,
                   unit: string,
                   marginTop: number,
                   startView: Moment,
                   endView: Moment,
                   cellCallback: (start: Moment, cell: HTMLElement) => void) {

    const slices: [Moment, Moment][] = [];

    const time = startView.clone().startOf(unit);
    const end = endView.clone().endOf(unit);

    while (time.isBefore(end)) {
      const sliceStart = moment.max(time, startView).clone();
      const sliceEnd = moment.min(time.clone().endOf(unit), endView).clone();
      time.add(1, unit);
      slices.push([sliceStart, sliceEnd]);
    }

    for (let [start, end] of slices) {
      const cell = this.addLabelCell();
      cell.style.borderRight = "1px solid black";
      cell.style.top = marginTop + "px";
      cell.style.left = calculatePositionValueForDayCount(vp, start.diff(startView, "days"));
      cell.style.width = calculatePositionValueForDayCount(vp, end.diff(start, "days") + 1);
      cell.style.textAlign = "center";
      cell.style.fontSize = "8px";
      cellCallback(start, cell);
    }
  }

  private addLabelCell(): HTMLElement {
    const label = document.createElement("div");
    label.className = timelineElementCssClass;
    label.style.position = "absolute";
    label.style.height = "10px";
    label.style.width = "10px";
    label.style.top = "0px";
    label.style.left = "0px";
    label.style.backgroundColor = "yellow";
    label.style.lineHeight = "normal";
    this.headerCell.appendChild(label);
    return label;
  }

  private renderGlobalElements(vp: TimelineViewParameters) {
    const enabledGlobalElements = _.keys(this.globalElementsRegistry);
    const createdGlobalElements = _.keys(this.globalElements);
    const newGlobalElements = _.difference(enabledGlobalElements, createdGlobalElements);

    // new elements
    for (const newElem of newGlobalElements) {
      const elem = document.createElement("div");
      elem.className = timelineElementCssClass + " wp-timeline-global-element-" + newElem;
      elem.style.position = "absolute";
      elem.style.top = this.marginTop + "px";
      elem.style.zIndex = "10";
      this.headerCell.appendChild(elem);
      this.globalElements[newElem] = elem;
    }

    // update elements
    for (const elemType of _.keys(this.globalElements)) {
      const elem = this.globalElements[elemType];
      elem.style.height = this.globalHeight + "px";
      this.globalElementsRegistry[elemType](vp, elem);
    }
  }

}
